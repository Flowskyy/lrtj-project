import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email-service';
import { getWIBDate, formatWIB } from '@/lib/utils';
import crypto from 'crypto';

// Generate a random 4-digit OTP
function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Hash OTP using SHA-256
function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimiter = new Map<string, { lastRequest: number; requestCount: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(userId);
  
  if (!record) {
    rateLimiter.set(userId, { lastRequest: now, requestCount: 1 });
    return true;
  }
  
  // 60-second cooldown
  if (now - record.lastRequest < 60000) {
    return false;
  }
  
  // Reset after cooldown
  rateLimiter.set(userId, { lastRequest: now, requestCount: 1 });
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting check
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Please wait before requesting another verification code' },
        { status: 429 }
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

    // Delete any existing password change OTP for this user
    await prisma.$queryRaw`
      DELETE FROM auth_verifications 
      WHERE identifier = ${`password-change:${session.user.id}`}
    `;

    // Store OTP in auth_verifications table
    await prisma.$queryRaw`
      INSERT INTO auth_verifications (id, identifier, value, expiresAt, createdAt, updatedAt)
      VALUES (
        ${crypto.randomUUID()},
        ${`password-change:${session.user.id}`},
        ${otpHash},
        ${otpExpiresAt},
        NOW(),
        NOW()
      )
    `;

    // Send OTP email
    await sendOtpEmail({
      recipientName: session.user.email,
      to: session.user.email,
      otpCode: rawOtp,
      expiryMinutes: 10,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('Error sending password change OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}