import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatWIB, getWIBDate } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const currentPage = body.currentPage || null;
    const currentAction = body.currentAction || null;

    // Get current values from database to avoid overwriting non-null with null
    const currentUser = await prisma.$queryRaw`
      SELECT currentPage, currentAction
      FROM auth_users
      WHERE id = ${userId}
    ` as any[];

    const existingPage = currentUser[0]?.currentPage || null;
    const existingAction = currentUser[0]?.currentAction || null;

    // Only update if new value is non-null, otherwise keep existing value
    const finalPage = currentPage !== null ? currentPage : existingPage;
    const finalAction = currentAction !== null ? currentAction : existingAction;

    // Update user's online status, last seen timestamp, current page, and current action using raw SQL
    const now = getWIBDate();
    await prisma.$queryRaw`
      UPDATE auth_users
      SET isOnline = true, lastSeen = ${now}, updatedAt = ${now}, currentPage = ${finalPage}, currentAction = ${finalAction}
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
