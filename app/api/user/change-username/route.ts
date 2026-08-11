import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const existingUser = await prisma.auth_users.findFirst({
      where: {
        name: username,
        id: { not: session.user.id }
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }

    // Update username
    await prisma.auth_users.update({
      where: { id: session.user.id },
      data: { name: username }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing username:', error);
    return NextResponse.json(
      { error: 'Failed to change username' },
      { status: 500 }
    );
  }
}
