import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import crypto from 'crypto';

// Hash a token using SHA-256
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, username, password } = body;

    if (!token || !username || !password) {
      return NextResponse.json(
        { error: 'Token, username, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);

    // Find invitation by token hash using raw SQL to bypass Prisma's timezone conversion
    const invitations = await prisma.$queryRaw`
      SELECT
        id,
        email,
        roleId,
        inviteTokenHash,
        DATE_FORMAT(inviteExpiresAt, '%Y-%m-%dT%H:%i:%s') as inviteExpiresAt,
        status
      FROM admin_invitations
      WHERE inviteTokenHash = ${tokenHash}
    ` as any[];

    if (!invitations || invitations.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invitation' },
        { status: 404 }
      );
    }

    const invitation = invitations[0];

    // Get role info
    const roles = await prisma.$queryRaw`
      SELECT id, name FROM auth_roles WHERE id = ${invitation.roleId}
    ` as any[];
    
    const roleInfo = roles[0] || { name: 'Unknown' };

    // Check if invitation is in otp_verified state
    if (invitation.status !== 'otp_verified') {
      return NextResponse.json(
        { error: 'Invitation must be verified with OTP first' },
        { status: 400 }
      );
    }

    // Check if invitation is expired using WIB time
    const currentTime = await prisma.$queryRaw`
      SELECT DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') as currentTime
    ` as any[];
    
    if (currentTime[0]?.currentTime > invitation.inviteExpiresAt) {
      await prisma.$queryRaw`
        UPDATE admin_invitations
        SET status = 'expired'
        WHERE id = ${invitation.id}
      `;
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if user already exists with this email using raw SQL
    const existingUsers = await prisma.$queryRaw`
      SELECT id FROM auth_users WHERE email = ${invitation.email}
    ` as any[];

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if username is already taken using raw SQL
    const existingUsernames = await prisma.$queryRaw`
      SELECT id FROM auth_users WHERE name = ${username}
    ` as any[];

    if (existingUsernames && existingUsernames.length > 0) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Create user using better-auth signUp method
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: invitation.email,
        password,
        name: username,
      },
    });

    if (signUpResult.error) {
      console.error('Sign up error:', signUpResult.error);
      return NextResponse.json(
        { error: signUpResult.error.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    // Update the user with the role from invitation
    await prisma.auth_users.update({
      where: { email: invitation.email },
      data: {
        roleId: invitation.roleId,
        emailVerified: true, // Auto-verify since we verified via OTP
      },
    });

    // Mark invitation as completed using raw SQL
    await prisma.$queryRaw`
      UPDATE admin_invitations
      SET status = 'completed', completedAt = NOW()
      WHERE id = ${invitation.id}
    `;

    // Create session for the user
    const sessionResult = await auth.api.signInEmail({
      body: {
        email: invitation.email,
        password,
      },
    });

    if (sessionResult.error) {
      console.error('Sign in error:', sessionResult.error);
      // User was created but session failed - still return success
      return NextResponse.json({
        success: true,
        message: 'Account created successfully. Please log in.',
      });
    }

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: signUpResult.user?.id,
        email: signUpResult.user?.email,
        name: signUpResult.user?.name,
        role: roleInfo.name,
      },
    });

    // Set the session cookie from the sign-in response
    if (sessionResult.headers && sessionResult.headers.get('set-cookie')) {
      response.headers.set('set-cookie', sessionResult.headers.get('set-cookie')!);
    }

    return response;
  } catch (error) {
    console.error('Error completing signup:', error);
    return NextResponse.json(
      { error: 'Failed to complete signup' },
      { status: 500 }
    );
  }
}
