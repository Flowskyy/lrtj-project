import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

// How many of the newest rows to scan each poll for revert-status changes.
// Bounded (PK range scan) so the poll stays cheap on large tables.
const REVERT_WINDOW = BigInt(5000);

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      let lastMaxId = BigInt(0);
      const knownRevertedIds = new Set<string>();

      const sendEvent = (data: any) => {
        if (isClosed) return;
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          isClosed = true;
        }
      };

      // Fetch only rows appended since the last poll (indexed by PK).
      const fetchNewLogs = async () => {
        const rows = await prisma.$queryRaw`
          SELECT
            id,
            actorUserId,
            actorName,
            actorEmail,
            actorRoleId,
            actorRoleName,
            tableName,
            recordId,
            action,
            beforeState,
            afterState,
            changedFields,
            DATE_FORMAT(createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
            DATE_FORMAT(revertedAt, '%Y-%m-%dT%H:%i:%s') as revertedAt,
            revertedByUserId
          FROM system_activity_logs
          WHERE id > ${lastMaxId}
          ORDER BY id ASC
        ` as any[];

        if (rows.length === 0) return;

        lastMaxId = rows[rows.length - 1].id;
        sendEvent({
          type: 'logs_added',
          logs: rows.map((r: any) => ({ ...r, id: r.id.toString() })),
        });
      };

      // Detect reverts applied to already-loaded rows (bounded window).
      const fetchReverted = async () => {
        const windowStart = lastMaxId > REVERT_WINDOW ? lastMaxId - REVERT_WINDOW : BigInt(0);
        const rows = await prisma.$queryRaw`
          SELECT id FROM system_activity_logs
          WHERE revertedAt IS NOT NULL AND id > ${windowStart}
        ` as any[];

        const newlyReverted = rows.filter(
          (r: any) => !knownRevertedIds.has(r.id.toString())
        );

        if (newlyReverted.length === 0) return;

        const ids = newlyReverted.map((r: any) => r.id.toString());
        ids.forEach(id => knownRevertedIds.add(id));
        sendEvent({ type: 'logs_reverted', ids });
      };

      // Establish baseline at connect time.
      try {
        const maxRow = await prisma.$queryRaw`
          SELECT MAX(id) as maxId FROM system_activity_logs
        ` as any[];
        lastMaxId = BigInt(maxRow[0]?.maxId ?? 0);
      } catch (error) {
        console.error('Error fetching initial activity log baseline:', error);
      }

      const interval = setInterval(async () => {
        if (isClosed) return;
        try {
          await fetchNewLogs();
          await fetchReverted();
        } catch (error) {
          console.error('Error polling activity log changes:', error);
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