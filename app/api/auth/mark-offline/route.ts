import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatWIB } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Immediately mark user as offline using raw SQL to bypass Prisma's timezone conversion
    const now = formatWIB(new Date());
    await prisma.$queryRaw`
      UPDATE auth_users
      SET isOnline = false, lastSeen = ${now}, updatedAt = ${now}
      WHERE id = ${userId}
    `;

    // Get the current WIB time for response
    const wibTime = await prisma.$queryRaw`
      SELECT DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') as currentTime
    ` as any[];

    return NextResponse.json({ success: true, offlineAt: wibTime[0]?.currentTime });
  } catch (error) {
    console.error('Mark offline error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also handle GET for sendBeacon (which uses GET by default with empty body)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    // Immediately mark user as offline using raw SQL to bypass Prisma's timezone conversion
    const now = formatWIB(new Date());
    await prisma.$queryRaw`
      UPDATE auth_users
      SET isOnline = false, lastSeen = ${now}, updatedAt = ${now}
      WHERE id = ${userId}
    `;

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Mark offline (GET) error:', error);
    return new Response('Error', { status: 500 });
  }
}
