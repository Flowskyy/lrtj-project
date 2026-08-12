import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWIBDate } from '@/lib/utils';

// Mark users as offline if they haven't sent a heartbeat in 90 seconds
const OFFLINE_THRESHOLD = 90 * 1000; // 90 seconds in milliseconds

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    console.error('Cron cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also allow GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request);
}