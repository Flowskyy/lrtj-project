import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email-service';
import crypto from 'crypto';

// Hash a token using SHA-256
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Generate a random 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash OTP using SHA-256
function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// GET: Validate invitation token and generate OTP
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const rawToken = params.token;
    const tokenHash = hashToken(rawToken);

    // Find invitation by token hash
    const invitation = await prisma.admin_invitations.findUnique({
      where: { inviteTokenHash: tokenHash },
      include: {
        auth_roles: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (new Date() > new Date(invitation.inviteExpiresAt)) {
      // Mark as expired
      await prisma.admin_invitations.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
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

    // Calculate OTP expiry (10 minutes from now)
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);

    // Update invitation with OTP
    await prisma.admin_invitations.update({
      where: { id: invitation.id },
      data: {
        otpCodeHash: otpHash,
        otpSentAt: new Date(),
        otpExpiresAt,
        otpAttempts: 0,
        status: 'pending',
      },
    });

    // Send OTP email
    await sendOtpEmail({
      recipientName: invitation.email,
      otpCode: rawOtp,
      expiryMinutes: 10,
    });

    return NextResponse.json({
      success: true,
      email: invitation.email,
      role: invitation.auth_roles.name,
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

// POST: Verify OTP
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const rawToken = params.token;
    const tokenHash = hashToken(rawToken);
    const { otp } = await request.json();

    if (!otp) {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      );
    }

    // Find invitation by token hash
    const invitation = await prisma.admin_invitations.findUnique({
      where: { inviteTokenHash: tokenHash },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (invitation.status === 'expired') {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (invitation.otpExpiresAt && new Date() > new Date(invitation.otpExpiresAt)) {
      await prisma.admin_invitations.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
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
        await prisma.admin_invitations.update({
          where: { id: invitation.id },
          data: {
            otpAttempts: newAttempts,
            status: 'expired',
          },
        });
        return NextResponse.json(
          { error: 'Too many failed attempts. Please request a new invitation.' },
          { status: 400 }
        );
      }

      await prisma.admin_invitations.update({
        where: { id: invitation.id },
        data: { otpAttempts: newAttempts },
      });

      return NextResponse.json(
        { error: 'Invalid OTP', attemptsRemaining: 5 - newAttempts },
        { status: 400 }
      );
    }

    // OTP is correct - update status to otp_verified
    await prisma.admin_invitations.update({
      where: { id: invitation.id },
      data: { status: 'otp_verified' },
    });

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
