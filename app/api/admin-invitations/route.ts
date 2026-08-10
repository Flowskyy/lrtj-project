import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendInviteEmail } from '@/lib/email-service';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

// Generate a cryptographically random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Hash a token using SHA-256
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Generate a random 4-digit OTP
function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and has permission
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, roleId } = body;

    // Validate input
    if (!email || !roleId) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if role exists
    const role = await prisma.auth_roles.findUnique({
      where: { id: parseInt(roleId) },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if user already exists with this email
    const existingUser = await prisma.auth_users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Expire any existing pending/otp_verified invitations for this email
    await prisma.admin_invitations.updateMany({
      where: {
        email,
        status: {
          in: ['pending', 'otp_verified'],
        },
      },
      data: {
        status: 'expired',
      },
    });

    // Generate invitation token and hash it
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);

    // Calculate expiry (48 hours from now)
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setHours(inviteExpiresAt.getHours() + 48);

    // Get current admin user info for createdBy field
    const adminUser = await prisma.auth_users.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    // Create invitation record
    const invitation = await prisma.admin_invitations.create({
      data: {
        email,
        roleId: parseInt(roleId),
        inviteTokenHash: tokenHash,
        inviteExpiresAt,
        status: 'pending',
        createdBy: adminUser?.name || session.user.email || 'Unknown',
      },
      include: {
        auth_roles: true,
      },
    });

    // Generate signup link
    const signupLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup/invite/${rawToken}`;

    // Send email
    await sendInviteEmail({
      recipientName: email,
      to: email,
      signupLink,
      expiryHours: 48,
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.auth_roles.name,
        expiresAt: invitation.inviteExpiresAt,
      },
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
