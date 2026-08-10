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
    const now = new Date();

    console.log('Mark offline - Setting user offline:', userId, 'at', now);

    // Immediately mark user as offline
    await prisma.auth_users.update({
      where: { id: userId },
      data: {
        isOnline: false,
        lastSeen: now,
      },
    });

    console.log('Mark offline - Successfully marked user offline:', userId);
    return NextResponse.json({ success: true, offlineAt: now });
  } catch (error) {
    console.error('Mark offline error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also handle GET for sendBeacon (which uses GET by default with empty body)
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithUser();
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    console.log('Mark offline (GET) - Setting user offline:', userId, 'at', now);

    // Immediately mark user as offline
    await prisma.auth_users.update({
      where: { id: userId },
      data: {
        isOnline: false,
        lastSeen: now,
      },
    });

    console.log('Mark offline (GET) - Successfully marked user offline:', userId);
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Mark offline (GET) error:', error);
    return new Response('Error', { status: 500 });
  }
}
