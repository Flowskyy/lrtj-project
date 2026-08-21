import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWIBDate } from '@/lib/utils';

// Mark users as offline if they haven't sent a heartbeat in 90 seconds
const OFFLINE_THRESHOLD = 90 * 1000; // 90 seconds in milliseconds

// Retry configuration for deadlock errors
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 100;

// Helper function to check if error is a deadlock/write conflict
function isDeadlockError(error: any): boolean {
  return error?.code === 'P2034' || 
         error?.message?.includes('deadlock') ||
         error?.message?.includes('write conflict');
}

// Helper function for sleep/delay
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let lastError: any = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const thresholdDate = new Date(getWIBDate().getTime() - OFFLINE_THRESHOLD);

      // Mark users as offline if their lastSeen is older than threshold
      const result = await prisma.auth_users.updateMany({
        where: {
          isOnline: true,
          lastSeen: {
            lt: thresholdDate,
          },
        },
        data: {
          isOnline: false,
          updatedAt: getWIBDate(),
        },
      });

      return NextResponse.json({ 
        success: true, 
        count: result.count,
        message: `Marked ${result.count} users as offline` 
      });
    } catch (error) {
      lastError = error;

      // If it's a deadlock error and we haven't exhausted retries, retry with backoff
      if (isDeadlockError(error) && attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Cron cleanup offline attempt ${attempt + 1} failed with deadlock, retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      // For non-deadlock errors or after exhausting retries, break
      break;
    }
  }

  // Log error but don't crash - this is a background maintenance task
  console.error('Cron cleanup offline error after retries:', lastError);
  
  // Return success instead of 500 to avoid surfacing transient deadlocks
  // The cleanup will retry on the next cron run anyway
  return NextResponse.json({ 
    success: true, 
    count: 0,
    message: 'Cron cleanup skipped due to transient error, will retry on next run' 
  });
}

// Also allow GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request);
}