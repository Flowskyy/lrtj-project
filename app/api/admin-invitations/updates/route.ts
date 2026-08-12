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

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      let lastSignature = '';

      const sendEvent = (data: any) => {
        if (isClosed) return;
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          isClosed = true;
        }
      };

      // Reuse the same shapes as GET /api/admin-invitations and
      // GET /api/admin-users?pending=true so the client state is identical.
      const fetchData = async () => {
        const invitations = await prisma.$queryRaw`
          SELECT
            ai.id,
            ai.email,
            ai.roleId,
            ar.name as roleName,
            ai.inviteTokenHash,
            ai.status,
            DATE_FORMAT(ai.inviteExpiresAt, '%Y-%m-%dT%H:%i:%s') as inviteExpiresAt,
            DATE_FORMAT(ai.createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
            DATE_FORMAT(ai.completedAt, '%Y-%m-%dT%H:%i:%s') as completedAt,
            DATE_FORMAT(ai.openedAt, '%Y-%m-%dT%H:%i:%s') as openedAt,
            DATE_FORMAT(ai.emailSentAt, '%Y-%m-%dT%H:%i:%s') as emailSentAt,
            ai.activityStep,
            DATE_FORMAT(ai.lastActivityAt, '%Y-%m-%dT%H:%i:%s') as lastActivityAt,
            ai.createdBy
          FROM admin_invitations ai
          LEFT JOIN auth_roles ar ON ai.roleId = ar.id
          WHERE ai.status IN ('pending', 'otp_verified')
            AND ai.inviteExpiresAt > NOW()
          ORDER BY ai.createdAt DESC
        ` as any[];

        const currentTime = await prisma.$queryRaw`
          SELECT DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') as currentTime
        ` as any[];
        const now = currentTime[0]?.currentTime;

        const invitationsWithState = invitations.map((inv: any) => {
          let validityState = 'active';
          if (inv.status === 'completed') validityState = 'used';
          else if (inv.status === 'expired' || (inv.inviteExpiresAt && now > inv.inviteExpiresAt)) validityState = 'expired';
          else if (inv.openedAt && !inv.completedAt) validityState = 'opened_not_completed';

          return {
            ...inv,
            validityState,
            isOpened: !!inv.openedAt,
            isEmailSent: !!inv.emailSentAt,
          };
        });

        const pendingUsers = await prisma.$queryRaw`
          SELECT
            au.id,
            au.name,
            au.email,
            au.image,
            DATE_FORMAT(au.createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
            DATE_FORMAT(au.updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt
          FROM auth_users au
          WHERE au.roleId IS NULL
          ORDER BY au.createdAt DESC
        ` as any[];

        return { invitations: invitationsWithState, pendingUsers };
      };

      const publish = (invitations: any[], pendingUsers: any[]) => {
        sendEvent({ type: 'invitations_updated', invitations });
        sendEvent({ type: 'pending_users_updated', users: pendingUsers });
      };

      // Push current state immediately so the client syncs on connect,
      // then only push again when something actually changed.
      try {
        const { invitations, pendingUsers } = await fetchData();
        lastSignature = JSON.stringify({ invitations, pendingUsers });
        publish(invitations, pendingUsers);
      } catch (error) {
        console.error('Error fetching initial invitation data:', error);
      }

      const interval = setInterval(async () => {
        if (isClosed) return;
        try {
          const { invitations, pendingUsers } = await fetchData();
          const signature = JSON.stringify({ invitations, pendingUsers });

          if (signature === lastSignature) return;

          lastSignature = signature;
          publish(invitations, pendingUsers);
        } catch (error) {
          console.error('Error polling invitation changes:', error);
          isClosed = true;
          clearInterval(interval);
        }
      }, 3000);

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