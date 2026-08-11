import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await getSessionWithUser();
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
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

      // Poll for changes every 5 seconds
      const interval = setInterval(async () => {
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
        }
      }, 5000);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
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
