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
      let isClosed = false;
      let lastUserCount = 0;
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
            au.currentPage,
            DATE_FORMAT(
              (SELECT asess.updatedAt FROM auth_sessions asess 
               WHERE asess.userId = au.id 
               ORDER BY asess.updatedAt DESC 
               LIMIT 1),
              '%Y-%m-%dT%H:%i:%s'
            ) as lastOnline
          FROM auth_users au
          LEFT JOIN auth_roles ar ON au.roleId = ar.id
          ORDER BY au.createdAt DESC
        ` as any[];
        
        lastUserCount = initialUsers.length;
        lastUserIds = initialUsers.map((u: any) => u.id);
        sendEvent({ type: 'initial', users: initialUsers });
      } catch (error) {
        console.error('Error fetching initial users:', error);
      }

      // Poll for changes every 3 seconds
      const interval = setInterval(async () => {
        if (isClosed) return;
        try {
          const currentUsers = await prisma.$queryRaw`
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
              au.currentPage,
              DATE_FORMAT(
                (SELECT asess.updatedAt FROM auth_sessions asess 
                 WHERE asess.userId = au.id 
                 ORDER BY asess.updatedAt DESC 
                 LIMIT 1),
                '%Y-%m-%dT%H:%i:%s'
              ) as lastOnline
            FROM auth_users au
            LEFT JOIN auth_roles ar ON au.roleId = ar.id
            ORDER BY au.createdAt DESC
          ` as any[];

          const currentUserIds = currentUsers.map((u: any) => u.id);
          const currentUserCount = currentUsers.length;

          // Check for new users
          const newUsers = currentUsers.filter((u: any) => !lastUserIds.includes(u.id));
          
          // Check for deleted users
          const deletedUserIds = lastUserIds.filter((id: string) => !currentUserIds.includes(id));
          
          // Check for updated users ( roleId, name, email changes)
          // For simplicity, we'll send full list if count changed but no add/delete
          // This handles role changes, name updates, etc.
          const hasCountChanged = currentUserCount !== lastUserCount;
          const hasChanges = newUsers.length > 0 || deletedUserIds.length > 0 || hasCountChanged;

          // Send events if there are changes
          if (newUsers.length > 0) {
            sendEvent({ type: 'users_added', users: newUsers });
          }
          
          if (deletedUserIds.length > 0) {
            sendEvent({ type: 'users_deleted', userIds: deletedUserIds });
          }
          
          // Send full update if there are structural changes (count changed)
          if (hasCountChanged && newUsers.length === 0 && deletedUserIds.length === 0) {
            sendEvent({ type: 'users_updated', users: currentUsers });
          }

          // Update baseline
          lastUserCount = currentUserCount;
          lastUserIds = currentUserIds;

          const currentTime = await prisma.$queryRaw`
            SELECT DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') as currentTime
          ` as any[];
          sendEvent({ type: 'heartbeat', timestamp: currentTime[0]?.currentTime });
        } catch (error) {
          console.error('Error polling user list changes:', error);
          isClosed = true;
          clearInterval(interval);
        }
      }, 3000);

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
