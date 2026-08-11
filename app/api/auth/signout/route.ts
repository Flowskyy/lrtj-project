import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const result = await auth.api.signOut({
      headers: request.headers,
    });

    const resultAny = result as any;
    if (resultAny.error) {
      return NextResponse.json(
        { error: resultAny.error.message || 'Sign out failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { error: 'Sign out failed' },
      { status: 500 }
    );
  }
}
