import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatWIB } from '@/lib/utils';

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
      sendEvent({ type: 'connected' });

      // Fetch initial online users - return raw DateTime values (stored as WIB via getWIBDate)
      try {
        const onlineUsers = await prisma.$queryRaw`
          SELECT
            id,
            name,
            email,
            lastSeen,
            currentPage,
            currentAction
          FROM auth_users
          WHERE isOnline = true
        ` as any[];
        // Format Date objects as WIB strings
        const normalizedUsers = onlineUsers.map((user: any) => ({
          ...user,
          lastSeen: user.lastSeen ? formatWIB(user.lastSeen) : null
        }));
        sendEvent({ type: 'initial', users: normalizedUsers });
      } catch (error) {
        console.error('Error fetching initial users:', error);
      }

      // Fetch initial online admins (filtered by showOnDashboard) for Dashboard
      try {
        const onlineAdmins = await prisma.$queryRaw`
          SELECT
            u.id,
            u.name,
            r.name as role
          FROM auth_users u
          INNER JOIN auth_roles r ON u.roleId = r.id
          WHERE u.isOnline = true
            AND r.showOnDashboard = true
          ORDER BY u.name ASC
        ` as any[];
        sendEvent({ type: 'online-admins', users: onlineAdmins });
      } catch (error) {
        console.error('Error fetching initial online admins:', error);
      }

      // Poll for changes every 5 seconds
      const interval = setInterval(async () => {
        if (isClosed) return;
        try {
          const onlineUsers = await prisma.$queryRaw`
            SELECT
              id,
              name,
              email,
              lastSeen,
              currentPage,
              currentAction
            FROM auth_users
            WHERE isOnline = true
          ` as any[];
          // Format Date objects as WIB strings
          const normalizedUsers = onlineUsers.map((user: any) => ({
            ...user,
            lastSeen: user.lastSeen ? formatWIB(user.lastSeen) : null
          }));
          sendEvent({ type: 'update', users: normalizedUsers });
        } catch (error) {
          console.error('Error polling online users:', error);
          // If there's an error sending, mark as closed to prevent further attempts
          isClosed = true;
          clearInterval(interval);
        }

        // Also poll for online admins updates (filtered by showOnDashboard)
        try {
          const onlineAdmins = await prisma.$queryRaw`
            SELECT
              u.id,
              u.name,
              r.name as role
            FROM auth_users u
            INNER JOIN auth_roles r ON u.roleId = r.id
            WHERE u.isOnline = true
              AND r.showOnDashboard = true
            ORDER BY u.name ASC
          ` as any[];
          sendEvent({ type: 'online-admins', users: onlineAdmins });
        } catch (error) {
          console.error('Error polling online admins:', error);
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

  // Get the origin from the request for CORS
  const origin = request.headers.get('origin') || '*';
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
