import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionWithUser();
    
    console.log('Heartbeat request - Session:', session?.user?.id);
    
    if (!session?.user?.id) {
      console.log('Heartbeat - Unauthorized: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    console.log('Heartbeat - Updating user:', userId, 'at', now);

    // Update user's online status and last seen timestamp
    await prisma.auth_users.update({
      where: { id: userId },
      data: {
        isOnline: true,
        lastSeen: now,
      },
    });

    console.log('Heartbeat - Successfully updated user:', userId);
    return NextResponse.json({ success: true, lastSeen: now });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
