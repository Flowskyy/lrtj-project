import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await getSessionWithUser();
  
  console.log('SSE connection request - Session:', session?.user?.id);
  
  if (!session?.user?.id) {
    console.log('SSE - Unauthorized: No session');
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
        console.log('SSE sent:', data.type, 'users:', data.users?.length || 0);
      };

      // Send initial connection event
      sendEvent({ type: 'connected', timestamp: new Date().toISOString() });

      // Fetch initial online users
      try {
        const onlineUsers = await prisma.auth_users.findMany({
          where: { isOnline: true },
          select: {
            id: true,
            name: true,
            email: true,
            lastSeen: true,
          },
        });
        console.log('SSE - Initial online users:', onlineUsers.length);
        sendEvent({ type: 'initial', users: onlineUsers });
      } catch (error) {
        console.error('Error fetching initial users:', error);
      }

      // Poll for changes every 5 seconds
      const interval = setInterval(async () => {
        try {
          const onlineUsers = await prisma.auth_users.findMany({
            where: { isOnline: true },
            select: {
              id: true,
              name: true,
              email: true,
              lastSeen: true,
            },
          });
          sendEvent({ type: 'update', users: onlineUsers, timestamp: new Date().toISOString() });
        } catch (error) {
          console.error('Error polling online users:', error);
        }
      }, 5000);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        console.log('SSE - Client disconnected');
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
