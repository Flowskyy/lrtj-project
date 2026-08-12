import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendInviteEmail } from '@/lib/email-service';
import { getSession } from '@/lib/auth';
import { getWIBDate } from '@/lib/utils';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use raw SQL to bypass Prisma's timezone conversion and include new tracking columns
    // PART C: only ongoing invitations (pending/otp_verified and not past expiry)
    const invitations = await prisma.$queryRaw`
      SELECT
        ai.id,
        ai.email,
        ai.roleId,
        ar.name as roleName,
        ai.inviteTokenHash,
        ai.status,
        DATE_FORMAT(ai.inviteExpiresAt, '%Y-%m-%dT%H:%i:%s') as inviteExpiresAt,
        DATE_FORMAT(ai.createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(ai.completedAt, '%Y-%m-%dT%H:%i:%s') as completedAt,
        DATE_FORMAT(ai.openedAt, '%Y-%m-%dT%H:%i:%s') as openedAt,
        DATE_FORMAT(ai.emailSentAt, '%Y-%m-%dT%H:%i:%s') as emailSentAt,
        ai.activityStep,
        DATE_FORMAT(ai.lastActivityAt, '%Y-%m-%dT%H:%i:%s') as lastActivityAt,
        ai.createdBy
      FROM admin_invitations ai
      LEFT JOIN auth_roles ar ON ai.roleId = ar.id
      WHERE ai.status IN ('pending', 'otp_verified')
        AND ai.inviteExpiresAt > NOW()
      ORDER BY ai.createdAt DESC
    ` as any[];

    // Add computed validity state
    const currentTime = await prisma.$queryRaw`
      SELECT DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') as currentTime
    ` as any[];
    const now = currentTime[0]?.currentTime;

    const invitationsWithState = invitations.map(inv => {
      let validityState = 'active';
      if (inv.status === 'completed') validityState = 'used';
      else if (inv.status === 'expired' || (inv.inviteExpiresAt && now > inv.inviteExpiresAt)) validityState = 'expired';
      else if (inv.openedAt && !inv.completedAt) validityState = 'opened_not_completed';
      
      return {
        ...inv,
        validityState,
        isOpened: !!inv.openedAt,
        isEmailSent: !!inv.emailSentAt,
      };
    });

    return NextResponse.json({ invitations: invitationsWithState });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

// Generate a cryptographically random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Hash a token using SHA-256
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, roleId } = body;

    if (!email || !roleId) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const role = await prisma.auth_roles.findUnique({
      where: { id: parseInt(roleId) },
    });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

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
        status: { in: ['pending', 'otp_verified'] },
      },
      data: { status: 'expired' },
    });

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);

    const expiryResult = await prisma.$queryRaw`
      SELECT DATE_ADD(NOW(), INTERVAL 48 HOUR) as inviteExpiresAt
    ` as any[];
    const inviteExpiresAt = expiryResult[0]?.inviteExpiresAt;

    const adminUser = await prisma.auth_users.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    const invitation = await prisma.admin_invitations.create({
      data: {
        email,
        roleId: parseInt(roleId),
        inviteTokenHash: tokenHash,
        inviteExpiresAt,
        status: 'pending',
        createdBy: adminUser?.name || session.user.email || 'Unknown',
        createdAt: getWIBDate(),
      },
    });

    const signupLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup/invite/${rawToken}`;

    // Send email and track emailSentAt
    try {
      await sendInviteEmail({
        recipientName: email,
        to: email,
        signupLink,
        expiryHours: 48,
      });
      const emailSentAt = getWIBDate();
      await prisma.admin_invitations.update({
        where: { id: invitation.id },
        data: { emailSentAt },
      });
    } catch (emailError) {
      console.error('Failed to send invitation email (invitation still created):', emailError);
    }

    const formattedExpiry = await prisma.$queryRaw`
      SELECT DATE_FORMAT(${inviteExpiresAt}, '%Y-%m-%dT%H:%i:%s') as formattedExpiry
    ` as any[];

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: role.name,
        expiresAt: formattedExpiry[0]?.formattedExpiry,
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