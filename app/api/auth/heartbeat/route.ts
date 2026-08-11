import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionWithUser();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const currentPage = body.currentPage || null;
    const currentAction = body.currentAction || null;

    // Update user's online status, last seen timestamp, current page, and current action using raw SQL
    await prisma.$queryRaw`
      UPDATE auth_users
      SET isOnline = true, lastSeen = NOW(), currentPage = ${currentPage}, currentAction = ${currentAction}
      WHERE id = ${userId}
    `;

    // Get the current WIB time for response
    const wibTime = await prisma.$queryRaw`
      SELECT DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') as currentTime
    ` as any[];

    return NextResponse.json({ success: true, lastSeen: wibTime[0]?.currentTime });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
