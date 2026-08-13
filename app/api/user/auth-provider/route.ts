import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    // Check if user has a Microsoft account
    const microsoftAccount = await prisma.auth_accounts.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'microsoft',
      },
    });

    // Check if user has a password account
    const passwordAccount = await prisma.auth_accounts.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'email',
      },
    });

    return NextResponse.json({
      isMicrosoftUser: !!microsoftAccount,
      isPasswordUser: !!passwordAccount,
      hasPassword: !!passwordAccount,
    });
  } catch (error) {
    console.error('Error checking auth provider:', error);
    return NextResponse.json(
      { error: 'Failed to check auth provider' },
      { status: 500 }
    );
  }
}