import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getWIBDate } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      let lastPoll: Date;
      let lastUserIds: string[] = [];

      const sendEvent = (data: any) => {
        if (isClosed) return;
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          isClosed = true;
        }
      };

      // Send initial connection event
      const initialTime = await prisma.$queryRaw`
        SELECT DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') as currentTime
      ` as any[];
      sendEvent({ type: 'connected', timestamp: initialTime[0]?.currentTime });

      // Fetch initial user list to establish baseline
      try {
        const initialUsers = await prisma.$queryRaw`
          SELECT
            au.id,
            au.name,
            au.email,
            au.roleId,
            ar.name as roleName,
            DATE_FORMAT(au.createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
            DATE_FORMAT(au.updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt,
            au.isOnline,
            DATE_FORMAT(au.lastSeen, '%Y-%m-%dT%H:%i:%s') as lastSeen,
            au.currentPage
          FROM auth_users au
          LEFT JOIN auth_roles ar ON au.roleId = ar.id
          ORDER BY au.createdAt DESC
        ` as any[];
        lastUserIds = initialUsers.map((u: any) => u.id);
        sendEvent({ type: 'initial', users: initialUsers });

        // Initialize lastPoll to the max updatedAt from initial fetch (or now)
        const maxUpdatedAt = initialUsers.length > 0
          ? new Date(Math.max(...initialUsers.map((u: any) => new Date(u.updatedAt).getTime())))
          : getWIBDate();
        lastPoll = maxUpdatedAt;
      } catch (error) {
        console.error('Error fetching initial users:', error);
        lastPoll = getWIBDate();
      }

      // Poll for changes every 15 seconds
      const interval = setInterval(async () => {
        if (isClosed) return;
        try {
          // Fetch only users changed since last poll (new or updated)
          // Also fetch all IDs for deletion detection
          const [changedUsersRaw, allUserIdsRaw] = await Promise.all([
            prisma.$queryRaw`
              SELECT
                au.id,
                au.name,
                au.email,
                au.roleId,
                ar.name as roleName,
                DATE_FORMAT(au.createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
                DATE_FORMAT(au.updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt,
                au.isOnline,
                DATE_FORMAT(au.lastSeen, '%Y-%m-%dT%H:%i:%s') as lastSeen,
                au.currentPage
              FROM auth_users au
              LEFT JOIN auth_roles ar ON au.roleId = ar.id
              WHERE au.updatedAt > ${lastPoll}
              ORDER BY au.updatedAt ASC
            `,
            prisma.$queryRaw`
              SELECT id FROM auth_users
            `,
          ]);
          const changedUsers = changedUsersRaw as any[];
          const allUserIds = allUserIdsRaw as any[];

          const currentUserIds = allUserIds.map((u: any) => u.id);

          // Detect new users (in changedUsers but not in lastUserIds)
          const newUsers = changedUsers.filter((u: any) => !lastUserIds.includes(u.id));
          
          // Detect deleted users (in lastUserIds but not in currentUserIds)
          const deletedUserIds = lastUserIds.filter((id: string) => !currentUserIds.includes(id));
          
          // Updated users are those in changedUsers that are NOT new (existing users with changes)
          const updatedUsers = changedUsers.filter((u: any) => lastUserIds.includes(u.id));

          // Send events if there are changes
          if (newUsers.length > 0) {
            sendEvent({ type: 'users_added', users: newUsers });
          }
          
          if (deletedUserIds.length > 0) {
            sendEvent({ type: 'users_deleted', userIds: deletedUserIds });
          }
          
          if (updatedUsers.length > 0) {
            sendEvent({ type: 'users_updated', users: updatedUsers });
          }

          // Update baseline for next poll
          lastUserIds = currentUserIds;
          if (changedUsers.length > 0) {
            lastPoll = new Date(Math.max(...changedUsers.map((u: any) => new Date(u.updatedAt).getTime())));
          } else {
            lastPoll = getWIBDate();
          }

          const currentTime = await prisma.$queryRaw`
            SELECT DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') as currentTime
          ` as any[];
          sendEvent({ type: 'heartbeat', timestamp: currentTime[0]?.currentTime });
        } catch (error) {
          console.error('Error polling user list changes:', error);
          isClosed = true;
          clearInterval(interval);
        }
      }, 15000);

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