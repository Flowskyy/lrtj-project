import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatWIB } from '@/lib/utils';
import { messaging } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

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
  const data = await request.json();

  const sendPush = data.sendPush === true;
  const customPayload = data.payload || null;

  // If push was requested, send FCM notifications
  if (sendPush) {
    if (!messaging) {
      console.warn('[FCM] Firebase Admin SDK not initialized. Skipping push notification.');
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
          console.log('[FCM] No valid device tokens found for push notification.');
        } else {
          console.log(`[FCM] Sending push to ${tokens.length} users`);
          
          // Build FCM message
          const message: any = {
            notification: {
              title: data.title,
              body: data.description,
            },
            data: customPayload ? customPayload : {},
            tokens: tokens,
          };

          // Send multicast message (FCM handles batching internally)
          const response = await (messaging as any).sendEachForMulticast(message);
          
          console.log(`[FCM] Sent to ${response.successCount} devices, failed for ${response.failureCount}`);
          
          // Handle failed tokens - clear stale device tokens
          if (response.failureCount > 0) {
            const tokensToClear: string[] = [];
            const errors: string[] = [];
            
            response.responses.forEach((resp: any, index: number) => {
              if (!resp.success) {
                const token = tokens[index];
                const error = resp.error;
                
                if (error) {
                  console.error(`[FCM] Failed to send to token ${index}:`, error.message);
                  
                  // Clear token if it's no longer registered
                  if (error.code === 'messaging/registration-token-not-registered' ||
                      error.code === 'messaging/invalid-registration-token') {
                    tokensToClear.push(token);
                  } else {
                    errors.push(`Token ${index}: ${error.message} (${error.code})`);
                  }
                }
              }
            });
            
            // Clear stale tokens from database
            if (tokensToClear.length > 0) {
              console.log(`[FCM] Clearing ${tokensToClear.length} stale device tokens`);
              await prisma.users.updateMany({
                where: {
                  device_token: {
                    in: tokensToClear,
                  },
                },
                data: {
                  device_token: null,
                },
              });
            }
            
            if (errors.length > 0) {
              console.error('[FCM] Non-token errors:', errors);
            }
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

  return NextResponse.json(newItem[0]);
}
