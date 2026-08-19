import { NextResponse } from 'next/server';
import { getSessionWithUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionWithUser();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}