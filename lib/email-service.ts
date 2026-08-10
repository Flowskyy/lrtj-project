import nodemailer from 'nodemailer';

// LRT Jakarta brand colors
const BRAND_COLOR = '#E5262C'; // LRT Jakarta red (matching login/signup pages)
const BRAND_COLOR_LIGHT = '#FDE8EB';
const TEXT_COLOR = '#333333';
const LIGHT_TEXT = '#666666';

interface EmailConfig {
  to: string;
  subject: string;
  html: string;
}

interface InviteEmailData {
  recipientName?: string;
  to: string;
  signupLink: string;
  expiryHours: number;
}

interface OtpEmailData {
  recipientName?: string;
  to: string;
  otpCode: string;
  expiryMinutes: number;
}

// HTML Template for EMAIL A - Invitation with signup link
function generateInviteEmailHtml(data: InviteEmailData): string {
  const { recipientName = 'Admin', signupLink, expiryHours } = data;
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Invitation - LRT Jakarta</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: ${TEXT_COLOR};
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px !important;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 auto; padding: 20px;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Branded Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #c91e24 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Admin Invitation</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">LRT Jakarta Team</p>
            </td>
          </tr>
          <!-- Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo-lrtj.png" alt="LRT Jakarta" width="160" height="52" style="display: block; margin: 0 auto; max-width: 160px; height: auto;" onerror="this.style.display='none';">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; margin: 0 0 20px 0; color: ${TEXT_COLOR};">Hello ${recipientName},</p>
              <p style="font-size: 14px; margin: 0 0 30px 0; color: ${LIGHT_TEXT}; line-height: 1.7;">
                You have been invited to join the LRT Jakarta Admin Team. Click the button below to complete your registration and set up your admin account.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${signupLink}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Complete Registration</a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; margin: 0 0 15px 0; color: ${LIGHT_TEXT}; line-height: 1.7;">
                If the button above doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="word-break: break-all; color: ${BRAND_COLOR}; font-size: 13px; margin: 0 0 25px 0;">
                ${signupLink}
              </p>
              
              <!-- Expiry Notice -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0 0 0;">
                <tr>
                  <td style="background-color: ${BRAND_COLOR_LIGHT}; padding: 15px; border-radius: 6px; font-size: 14px; color: ${BRAND_COLOR};">
                    <strong>Important:</strong> This invitation link will expire in ${expiryHours} hours.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Branded Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #f0f0f0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 16px;">
                    <p style="font-size: 14px; font-weight: 600; color: ${TEXT_COLOR}; margin: 0;">LRT Jakarta</p>
                    <p style="font-size: 12px; color: ${LIGHT_TEXT}; margin: 4px 0 0 0;">MRT Jakarta Administration System</p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-top: 16px; border-top: 1px solid #e0e0e0;">
                    <p style="font-size: 11px; margin: 0 0 8px 0; color: ${LIGHT_TEXT};">If you didn't expect this invitation, you can safely ignore this email.</p>
                    <p style="font-size: 11px; margin: 0; color: ${LIGHT_TEXT};">&copy; ${currentYear} LRT Jakarta. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// HTML Template for EMAIL B - OTP code
function generateOtpEmailHtml(data: OtpEmailData): string {
  const { recipientName = 'Admin', otpCode, expiryMinutes } = data;
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code - LRT Jakarta</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: ${TEXT_COLOR};
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px !important;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 auto; padding: 20px;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Branded Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #c91e24 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Verification Code</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">LRT Jakarta Admin Registration</p>
            </td>
          </tr>
          <!-- Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo-lrtj.png" alt="LRT Jakarta" width="160" height="52" style="display: block; margin: 0 auto; max-width: 160px; height: auto;" onerror="this.style.display='none';">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; margin: 0 0 16px 0; color: ${TEXT_COLOR};">Hello ${recipientName},</p>
              <p style="font-size: 14px; margin: 0 0 24px 0; color: ${LIGHT_TEXT}; line-height: 1.6;">
                Your verification code is ready. Use this one-time code to complete your admin registration.
              </p>

              <!-- OTP Code Container -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: ${BRAND_COLOR_LIGHT}; padding: 30px; border-radius: 12px; text-align: center; border: 2px solid ${BRAND_COLOR};">
                    <p style="font-size: 42px; font-weight: 700; color: ${BRAND_COLOR}; letter-spacing: 12px; margin: 0;">${otpCode}</p>
                    <p style="font-size: 13px; color: ${LIGHT_TEXT}; margin: 12px 0 0 0;">This code will expire in ${expiryMinutes} minutes.</p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; margin: 24px 0 0 0; color: ${LIGHT_TEXT}; line-height: 1.6;">
                <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code.
              </p>
            </td>
          </tr>

          <!-- Branded Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #f0f0f0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 16px;">
                    <p style="font-size: 14px; font-weight: 600; color: ${TEXT_COLOR}; margin: 0;">LRT Jakarta</p>
                    <p style="font-size: 12px; color: ${LIGHT_TEXT}; margin: 4px 0 0 0;">MRT Jakarta Administration System</p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-top: 16px; border-top: 1px solid #e0e0e0;">
                    <p style="font-size: 11px; margin: 0 0 8px 0; color: ${LIGHT_TEXT};">If you didn't request this code, you can safely ignore this email.</p>
                    <p style="font-size: 11px; margin: 0; color: ${LIGHT_TEXT};">&copy; ${currentYear} LRT Jakarta. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Create transporter (will be initialized lazily)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  // Check if SMTP is configured
  const smtpConfigured =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD;

  if (smtpConfigured) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT || '587') === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Console logging fallback for development/testing
    transporter = {
      sendMail: async (mailOptions: any) => {
        console.log('=== EMAIL LOG (SMTP not configured - would be sent if configured) ===');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('From:', mailOptions.from);
        console.log('--- HTML Content ---');
        console.log(mailOptions.html);
        console.log('=== END EMAIL LOG ===');
        return { messageId: 'console-log-' + Date.now() };
      },
    } as unknown as nodemailer.Transporter;
  }

  return transporter;
}

export async function sendInviteEmail(data: InviteEmailData): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || 'noreply@lrtj.co.id';
  const fromName = process.env.SMTP_FROM_NAME || 'LRT Jakarta';

  const html = generateInviteEmailHtml(data);

  await transporter.sendMail({
    from: `"${fromName}" <${from}>`,
    to: data.to,
    subject: 'You\'re Invited to Join LRT Jakarta Admin Team',
    html,
  });
}

export async function sendOtpEmail(data: OtpEmailData): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || 'noreply@lrtj.co.id';
  const fromName = process.env.SMTP_FROM_NAME || 'LRT Jakarta';

  const html = generateOtpEmailHtml(data);

  await transporter.sendMail({
    from: `"${fromName}" <${from}>`,
    to: data.to,
    subject: 'Your LRT Jakarta Verification Code',
    html,
  });
}
