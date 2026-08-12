import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const sendEvent = (data: any) => {
        if (isClosed) return;
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          // Controller is already closed, fail silently
          isClosed = true;
        }
      };

      // Send initial connection event
      const initialTime = await prisma.$queryRaw`
        SELECT DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') as currentTime
      ` as any[];
      sendEvent({ type: 'connected', timestamp: initialTime[0]?.currentTime });

      // Fetch initial online users using raw SQL to bypass Prisma's timezone conversion
      try {
        const onlineUsers = await prisma.$queryRaw`
          SELECT
            id,
            name,
            email,
            DATE_FORMAT(lastSeen, '%Y-%m-%dT%H:%i:%s') as lastSeen,
            currentPage,
            currentAction
          FROM auth_users
          WHERE isOnline = true
        ` as any[];
        sendEvent({ type: 'initial', users: onlineUsers });
      } catch (error) {
        console.error('Error fetching initial users:', error);
      }

      // Poll for changes every 15 seconds
      const interval = setInterval(async () => {
        if (isClosed) return;
        try {
          const onlineUsers = await prisma.$queryRaw`
            SELECT
              id,
              name,
              email,
              DATE_FORMAT(lastSeen, '%Y-%m-%dT%H:%i:%s') as lastSeen,
              currentPage,
              currentAction
            FROM auth_users
            WHERE isOnline = true
          ` as any[];

          const currentTime = await prisma.$queryRaw`
            SELECT DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') as currentTime
          ` as any[];

          sendEvent({ type: 'update', users: onlineUsers, timestamp: currentTime[0]?.currentTime });
        } catch (error) {
          console.error('Error polling online users:', error);
          // If there's an error sending, mark as closed to prevent further attempts
          isClosed = true;
          clearInterval(interval);
        }
      }, 5000);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch (error) {
          // Controller already closed, ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
