import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatWIB } from '@/lib/utils';
import { messaging } from '@/lib/firebase-admin';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sortBy = searchParams.get('sortBy');
  const order = searchParams.get('order') || 'desc';

  const orderBy: any = {};
  if (sortBy === 'id') {
    orderBy.id = order;
  } else if (sortBy === 'created_at') {
    orderBy.created_at = order;
  } else if (sortBy === 'title') {
    orderBy.title = order;
  } else {
    orderBy.id = 'desc';
  }

  // Use raw SQL for consistent WIB formatting - HARD FILTER for broadcast only
  const items = await prisma.$queryRawUnsafe(
    `SELECT
      id, title, description, payload, user_id,
      DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at
    FROM notifications
    WHERE user_id IS NULL
    ${Object.keys(orderBy).length > 0 ? `ORDER BY ${Object.keys(orderBy)[0]} ${(Object.values(orderBy)[0] as string).toUpperCase()}` : 'ORDER BY id DESC'}
  `) as any[];

  const totalCount = items.length;

  return NextResponse.json({
    data: items,
    meta: {
      total: totalCount,
    },
  });
}

export async function POST(request: NextRequest) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    const data = await request.json();

    const sendPush = data.sendPush === true;
    const customPayload = data.payload || null;

    // If push was requested, send FCM notifications
    if (sendPush) {
      if (!messaging) {
        // Firebase Admin SDK not initialized - skip push notification silently
      } else {
        try {
          const usersWithPush = await prisma.users.findMany({
            where: {
              push_notification: 1,
              device_token: {
                not: null,
              },
              status: 1, // Only active users
            },
            select: {
              id: true,
              device_token: true,
            },
          });

          const tokens = usersWithPush.map(u => u.device_token).filter((t): t is string => t !== null && t !== '');

          if (tokens.length === 0) {
            // No valid device tokens found - skip push notification
          } else {

            // FCM has a hard limit of 500 tokens per multicast call
            const BATCH_SIZE = 500;
            const tokenChunks: string[][] = [];
            for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
              tokenChunks.push(tokens.slice(i, i + BATCH_SIZE));
            }

            // Aggregate results across all batches
            let totalSuccessCount = 0;
            let totalFailureCount = 0;
            const allTokensToClear: string[] = [];
            const allErrors: string[] = [];

            // Process batches with limited concurrency to avoid rate limits
            const CONCURRENCY_LIMIT = 5;
            const BATCH_TIMEOUT_MS = 30000; // 30 seconds per batch

            for (let i = 0; i < tokenChunks.length; i += CONCURRENCY_LIMIT) {
              const batch = tokenChunks.slice(i, i + CONCURRENCY_LIMIT);
              const batchNumber = Math.floor(i / CONCURRENCY_LIMIT) + 1;
              const totalBatches = Math.ceil(tokenChunks.length / CONCURRENCY_LIMIT);

              const batchPromises = batch.map(async (chunkTokens, chunkIndex) => {
                const chunkStartIndex = i * BATCH_SIZE + chunkIndex * BATCH_SIZE;
                const currentBatchIndex = i + chunkIndex;

                // Build FCM message for this chunk
                const message: any = {
                  notification: {
                    title: data.title,
                    body: data.description,
                  },
                  data: customPayload ? customPayload : {},
                  tokens: chunkTokens,
                };

                try {
                  // Add timeout to prevent indefinite hangs
                  const response = await Promise.race([
                    (messaging as any).sendEachForMulticast(message),
                    new Promise((_, reject) =>
                      setTimeout(() => reject(new Error('Batch timeout')), BATCH_TIMEOUT_MS)
                    ),
                  ]) as any;

                  // Aggregate results
                  totalSuccessCount += response.successCount;
                  totalFailureCount += response.failureCount;

                  // Handle failed tokens in this chunk
                  if (response.failureCount > 0) {
                    response.responses.forEach((resp: any, index: number) => {
                      if (!resp.success) {
                        const token = chunkTokens[index];
                        const error = resp.error;

                        if (error) {
                          // Only clear token if it's genuinely dead/unregistered
                          // SenderId mismatch is a CONFIGURATION problem, not a dead token
                          if (error.code === 'messaging/registration-token-not-registered' ||
                              error.code === 'messaging/invalid-registration-token') {
                            allTokensToClear.push(token);
                          } else {
                            const globalIndex = chunkStartIndex + index;
                            allErrors.push(`Token ${globalIndex}: ${error.message} (${error.code})`);
                          }
                        }
                      }
                    });
                  }

                  return { success: true };
                } catch (error: any) {
                  console.error(`[FCM] Error sending batch ${currentBatchIndex + 1}:`, error.message || error);
                  // Mark all tokens in this chunk as failed if the entire batch failed
                  chunkTokens.forEach((token, idx) => {
                    const globalIndex = chunkStartIndex + idx;
                    allErrors.push(`Token ${globalIndex}: Batch send failed (${error.message || 'Unknown error'})`);
                  });
                  return { success: false };
                }
              });

              await Promise.all(batchPromises);
            }

            // Clear stale tokens from database
            if (allTokensToClear.length > 0) {
              await prisma.users.updateMany({
                where: {
                  device_token: {
                    in: allTokensToClear,
                  },
                },
                data: {
                  device_token: null,
                },
              });
            }

            if (allErrors.length > 0) {
              console.error('[FCM] Non-token errors:', allErrors);
            }
          }
        } catch (error) {
          console.error('[FCM] Error sending push notification:', error);
          // Don't throw - let the DB save succeed even if FCM fails
        }
      }
    }

    // Store payload directly as JSON (or null if empty)
    const payloadJson = customPayload ? JSON.stringify(customPayload) : null;

    // ALWAYS force user_id to null for broadcast notifications
    // Ignore any user_id from the request body
    await prisma.$queryRaw`
      INSERT INTO notifications (title, description, payload, user_id, created_at)
      VALUES (
        ${data.title},
        ${data.description},
        ${payloadJson},
        null,
        ${formatWIB(new Date())}
      )
    `;

    // Fetch the new item with proper WIB formatting
    const newItem = await prisma.$queryRaw`
      SELECT
        id, title, description, payload, user_id,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at
      FROM notifications
      ORDER BY id DESC
      LIMIT 1
    ` as any[];

    const serialized = newItem[0];

    // Log the activity manually since we're using raw SQL
    await logManualActivity({
      tableName: 'notifications',
      recordId: String(serialized.id),
      action: 'CREATE',
      afterState: serialized,
    });

    return NextResponse.json(serialized);
  });
}
