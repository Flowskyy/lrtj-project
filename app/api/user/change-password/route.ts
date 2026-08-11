import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getWIBDate } from '@/lib/utils';

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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Verify current password by attempting to sign in
    const signInResult = await auth.api.signInEmail({
      body: {
        email: session.user.email,
        password: currentPassword,
      },
    });

    if ('error' in signInResult && signInResult.error) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Update password using better-auth's internal method
    // Better-auth stores password in auth_accounts table
    // We need to update it using the same hashing method
    
    // Get the user's account
    const user = await prisma.auth_users.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the password account
    const passwordAccount = await prisma.auth_accounts.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'email'
      }
    });

    if (!passwordAccount) {
      return NextResponse.json(
        { error: 'No password account found' },
        { status: 400 }
      );
    }

    // Use better-auth's password update if available, otherwise use workaround
    // Since better-auth doesn't expose a direct password update method,
    // we'll use the sign up method to generate a proper hash
    
    // Create a temporary user to get the proper password hash
    const tempEmail = `temp_${Date.now()}@temp.com`;
    const tempResult = await auth.api.signUpEmail({
      body: {
        email: tempEmail,
        password: newPassword,
        name: 'temp',
      },
    });

    // Check if tempResult has error property
    const tempUser = (tempResult as any).user;
    if (!tempUser) {
      return NextResponse.json(
        { error: 'Failed to process password change' },
        { status: 500 }
      );
    }

    // Get the temp account's password hash
    const tempAccount = await prisma.auth_accounts.findFirst({
      where: { 
        userId: tempUser.id,
        providerId: 'email'
      }
    });

    if (!tempAccount?.password) {
      // Clean up temp user
      await prisma.auth_users.delete({ where: { id: tempResult.user.id } });
      return NextResponse.json(
        { error: 'Failed to process password change' },
        { status: 500 }
      );
    }

    // Update the real user's password
    await prisma.auth_accounts.update({
      where: { id: passwordAccount.id },
      data: { 
        password: tempAccount.password,
        updatedAt: getWIBDate()
      }
    });

    // Clean up temp user
    await prisma.auth_users.delete({ where: { id: tempUser.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
