import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getWIBDate } from '@/lib/utils';
import crypto from 'crypto';

// Hash OTP using SHA-256
function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

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
    const { otp, newPassword } = body;

    if (!otp || !newPassword) {
      return NextResponse.json(
        { error: 'OTP and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user is Microsoft-authenticated (should not be able to change password)
    const microsoftAccount = await prisma.auth_accounts.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'microsoft',
      },
    });

    if (microsoftAccount) {
      return NextResponse.json(
        { error: 'Microsoft-authenticated users cannot change password' },
        { status: 403 }
      );
    }

    // Verify OTP
    const otpHash = hashOtp(otp);
    const verifications = await prisma.$queryRaw`
      SELECT 
        id,
        value,
        DATE_FORMAT(expiresAt, '%Y-%m-%dT%H:%i:%s') as expiresAt
      FROM auth_verifications
      WHERE identifier = ${`password-change:${session.user.id}`}
    ` as any[];

    if (!verifications || verifications.length === 0) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    const verification = verifications[0];

    // Check if OTP has expired
    const currentTime = await prisma.$queryRaw`
      SELECT DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') as currentTime
    ` as any[];
    
    if (currentTime[0]?.currentTime > verification.expiresAt) {
      // Delete expired verification
      await prisma.$queryRaw`
        DELETE FROM auth_verifications WHERE id = ${verification.id}
      `;
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Verify OTP hash
    if (otpHash !== verification.value) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Find the password account
    const passwordAccount = await prisma.auth_accounts.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'email',
      },
    });

    if (!passwordAccount) {
      return NextResponse.json(
        { error: 'No password account found' },
        { status: 400 }
      );
    }

    // Generate proper password hash using better-auth's signUp method
    const tempEmail = `temp_${Date.now()}@temp.com`;
    const tempResult = await auth.api.signUpEmail({
      body: {
        email: tempEmail,
        password: newPassword,
        name: 'temp',
      },
    });

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
        providerId: 'email',
      },
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
        updatedAt: getWIBDate(),
      },
    });

    // Clean up temp user
    await prisma.auth_users.delete({ where: { id: tempUser.id } });

    // Delete used verification
    await prisma.$queryRaw`
      DELETE FROM auth_verifications WHERE id = ${verification.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying password change OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}