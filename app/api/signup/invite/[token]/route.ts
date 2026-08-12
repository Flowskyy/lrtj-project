import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email-service';
import { getWIBDate, formatWIB } from '@/lib/utils';
import crypto from 'crypto';

// Hash a token using SHA-256
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Generate a random 4-digit OTP
function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Hash OTP using SHA-256
function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// GET: Validate invitation token and generate OTP
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: rawToken } = await params;
    const tokenHash = hashToken(rawToken);

    // Find invitation by token hash using raw SQL to bypass Prisma's timezone conversion
    const invitations = await prisma.$queryRaw`
      SELECT
        id,
        email,
        roleId,
        inviteTokenHash,
        DATE_FORMAT(inviteExpiresAt, '%Y-%m-%dT%H:%i:%s') as inviteExpiresAt,
        status,
        otpCodeHash,
        DATE_FORMAT(otpSentAt, '%Y-%m-%dT%H:%i:%s') as otpSentAt,
        DATE_FORMAT(otpExpiresAt, '%Y-%m-%dT%H:%i:%s') as otpExpiresAt,
        otpAttempts,
        createdBy
      FROM admin_invitations
      WHERE inviteTokenHash = ${tokenHash}
    ` as any[];

    if (!invitations || invitations.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    const invitation = invitations[0];

    // Get role info
    const roles = await prisma.$queryRaw`
      SELECT id, name FROM auth_roles WHERE id = ${invitation.roleId}
    ` as any[];
    
    const roleInfo = roles[0] || { name: 'Unknown' };

    // Check if invitation is expired using WIB time
    const currentTime = await prisma.$queryRaw`
      SELECT DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') as currentTime
    ` as any[];
    
    if (currentTime[0]?.currentTime > invitation.inviteExpiresAt) {
      // Mark as expired
      await prisma.$queryRaw`
        UPDATE admin_invitations
        SET status = 'expired'
        WHERE id = ${invitation.id}
      `;
      return NextResponse.json(
        { error: 'Invitation link has expired' },
        { status: 400 }
      );
    }

    // Check if invitation is already completed
    if (invitation.status === 'completed') {
      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 400 }
      );
    }

    // Generate OTP
    const rawOtp = generateOtp();
    const otpHash = hashOtp(rawOtp);

    // Calculate OTP expiry (10 minutes from now) using raw SQL
    const otpExpiryResult = await prisma.$queryRaw`
      SELECT DATE_ADD(NOW(), INTERVAL 10 MINUTE) as otpExpiresAt
    ` as any[];
    
    const otpExpiresAt = otpExpiryResult[0]?.otpExpiresAt;

    // WIB literal timestamp for openedAt first-open tracking
    const openedAtLiteral = formatWIB(getWIBDate());

    // Update invitation with OTP using raw SQL
    await prisma.$queryRaw`
      UPDATE admin_invitations
      SET
        otpCodeHash = ${otpHash},
        otpSentAt = NOW(),
        otpExpiresAt = ${otpExpiresAt},
        otpAttempts = 0,
        openedAt = IFNULL(openedAt, ${openedAtLiteral}),
        status = 'pending'
      WHERE id = ${invitation.id}
    `;

    // Send OTP email
    await sendOtpEmail({
      recipientName: invitation.email,
      to: invitation.email,
      otpCode: rawOtp,
      expiryMinutes: 10,
    });

    return NextResponse.json({
      success: true,
      email: invitation.email,
      role: roleInfo.name,
      expiresAt: invitation.inviteExpiresAt,
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}

// PATCH: Report the invited user's current step in the signup flow (heartbeat)
// Unauthenticated by design - the invitee has no session until signup completes.
// Mirrors auth_users.currentAction tracking, but keyed to the invitation.
const VALID_ACTIVITY_STEPS = ['viewing', 'entering_otp', 'setting_password', 'submitting'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: rawToken } = await params;
    const { step } = await request.json();

    if (!VALID_ACTIVITY_STEPS.includes(step)) {
      return NextResponse.json(
        { error: 'Invalid activity step' },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(rawToken);
    const nowLiteral = formatWIB(getWIBDate());

    await prisma.$queryRaw`
      UPDATE admin_invitations
      SET activityStep = ${step}, lastActivityAt = ${nowLiteral}
      WHERE inviteTokenHash = ${tokenHash}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reporting invite activity:', error);
    return NextResponse.json(
      { error: 'Failed to report activity' },
      { status: 500 }
    );
  }
}

// POST: Verify OTP
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: rawToken } = await params;
    const tokenHash = hashToken(rawToken);
    const { otp } = await request.json();

    if (!otp) {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      );
    }

    // Find invitation by token hash using raw SQL
    const invitations = await prisma.$queryRaw`
      SELECT
        id,
        inviteTokenHash,
        status,
        DATE_FORMAT(otpExpiresAt, '%Y-%m-%dT%H:%i:%s') as otpExpiresAt,
        otpCodeHash,
        otpAttempts
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

    // Check if invitation is expired
    if (invitation.status === 'expired') {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if OTP has expired using WIB time
    const currentTime = await prisma.$queryRaw`
      SELECT DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s') as currentTime
    ` as any[];
    
    if (invitation.otpExpiresAt && currentTime[0]?.currentTime > invitation.otpExpiresAt) {
      await prisma.$queryRaw`
        UPDATE admin_invitations
        SET status = 'expired'
        WHERE id = ${invitation.id}
      `;
      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      );
    }

    // Check if already completed
    if (invitation.status === 'completed') {
      return NextResponse.json(
        { error: 'Invitation already completed' },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpHash = hashOtp(otp);
    if (otpHash !== invitation.otpCodeHash) {
      // Increment attempt counter
      const newAttempts = (invitation.otpAttempts || 0) + 1;
      
      // Check if max attempts reached
      if (newAttempts >= 5) {
        await prisma.$queryRaw`
          UPDATE admin_invitations
          SET otpAttempts = ${newAttempts}, status = 'expired'
          WHERE id = ${invitation.id}
        `;
        return NextResponse.json(
          { error: 'Too many failed attempts. Please request a new invitation.' },
          { status: 400 }
        );
      }

      await prisma.$queryRaw`
        UPDATE admin_invitations
        SET otpAttempts = ${newAttempts}
        WHERE id = ${invitation.id}
      `;

      return NextResponse.json(
        { error: 'Invalid OTP', attemptsRemaining: 5 - newAttempts },
        { status: 400 }
      );
    }

    // OTP is correct - update status to otp_verified using raw SQL
    await prisma.$queryRaw`
      UPDATE admin_invitations
      SET status = 'otp_verified'
      WHERE id = ${invitation.id}
    `;

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
