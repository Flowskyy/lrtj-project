import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mark users as offline if they haven't sent a heartbeat in 10 seconds
const OFFLINE_THRESHOLD = 10 * 1000; // 10 seconds in milliseconds

export async function POST(request: NextRequest) {
  try {
    const thresholdDate = new Date(Date.now() - OFFLINE_THRESHOLD);

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
      },
    });

    return NextResponse.json({ 
      success: true, 
      count: result.count,
      message: `Marked ${result.count} users as offline` 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
