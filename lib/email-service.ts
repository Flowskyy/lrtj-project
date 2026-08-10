import nodemailer from 'nodemailer';

// LRT Jakarta brand colors
const BRAND_COLOR = '#E31837'; // LRT Jakarta red
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
  signupLink: string;
  expiryHours: number;
}

interface OtpEmailData {
  recipientName?: string;
  otpCode: string;
  expiryMinutes: number;
}

// HTML Template for EMAIL A - Invitation with signup link
function generateInviteEmailHtml(data: InviteEmailData): string {
  const { recipientName = 'Admin', signupLink, expiryHours } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Invitation - LRT Jakarta</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: ${TEXT_COLOR};
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background-color: ${BRAND_COLOR};
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .message {
      margin-bottom: 30px;
      color: ${LIGHT_TEXT};
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: ${BRAND_COLOR};
      color: #ffffff;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #c4122f;
    }
    .expiry {
      background-color: ${BRAND_COLOR_LIGHT};
      padding: 15px;
      border-radius: 6px;
      margin-top: 25px;
      font-size: 14px;
      color: ${BRAND_COLOR};
    }
    .footer {
      background-color: #f8f8f8;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: ${LIGHT_TEXT};
    }
    .footer a {
      color: ${BRAND_COLOR};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LRT Jakarta</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${recipientName},</p>
      <p class="message">
        You have been invited to join the LRT Jakarta Admin Team. Click the button below to complete your registration and set up your admin account.
      </p>
      <div class="button-container">
        <a href="${signupLink}" class="button">Complete Registration</a>
      </div>
      <p class="message">
        If the button above doesn't work, you can copy and paste this link into your browser:
      </p>
      <p style="word-break: break-all; color: ${BRAND_COLOR}; font-size: 14px;">
        ${signupLink}
      </p>
      <div class="expiry">
        <strong>⚠️ Important:</strong> This invitation link will expire in ${expiryHours} hours.
      </div>
    </div>
    <div class="footer">
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      <p>&copy; ${new Date().getFullYear()} LRT Jakarta. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// HTML Template for EMAIL B - OTP code
function generateOtpEmailHtml(data: OtpEmailData): string {
  const { recipientName = 'Admin', otpCode, expiryMinutes } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code - LRT Jakarta</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: ${TEXT_COLOR};
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background-color: ${BRAND_COLOR};
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .message {
      margin-bottom: 30px;
      color: ${LIGHT_TEXT};
    }
    .otp-container {
      background-color: ${BRAND_COLOR_LIGHT};
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-code {
      font-size: 36px;
      font-weight: 700;
      color: ${BRAND_COLOR};
      letter-spacing: 8px;
      margin: 0;
    }
    .expiry {
      font-size: 14px;
      color: ${LIGHT_TEXT};
      margin-top: 15px;
    }
    .footer {
      background-color: #f8f8f8;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: ${LIGHT_TEXT};
    }
    .footer a {
      color: ${BRAND_COLOR};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LRT Jakarta</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${recipientName},</p>
      <p class="message">
        Your verification code is ready. Use this one-time code to complete your admin registration.
      </p>
      <div class="otp-container">
        <p class="otp-code">${otpCode}</p>
        <p class="expiry">This code will expire in ${expiryMinutes} minutes.</p>
      </div>
      <p class="message">
        <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code.
      </p>
    </div>
    <div class="footer">
      <p>If you didn't request this code, you can safely ignore this email.</p>
      <p>&copy; ${new Date().getFullYear()} LRT Jakarta. All rights reserved.</p>
    </div>
  </div>
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
    } as any;
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
    to: data.recipientName ? `"${data.recipientName}" <${data.recipientName}>` : data.recipientName,
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
    to: data.recipientName ? `"${data.recipientName}" <${data.recipientName}>` : data.recipientName,
    subject: 'Your LRT Jakarta Verification Code',
    html,
  });
}
