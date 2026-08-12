import nodemailer from 'nodemailer';

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
export function generateInviteEmailHtml(data: InviteEmailData): string {
  const { signupLink } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Invitation - LRT Jakarta</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4; margin: 0 auto;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; max-width: 600px; width: 100%;">
          
          <!-- Hero Header with Station Photo Background -->
          <tr>
            <td align="center" style="background-color: #1a1a1a; background-image: url('cid:bg-image'); background-size: cover; background-position: center; height: 620px; position: relative;">
              <!--[if gte mso 9]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:620px;">
                <v:fill type="frame" src="cid:bg-image" color="#1a1a1a" />
                <v:textbox inset="0,0,0,0">
              <![endif]-->
              
              <!-- No dark overlay - direct bg image -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" height="620" style="height: 620px;">
                <tr>
                  <td align="center" valign="top" style="padding-top: 36px;">
                    <!-- Logo -->
                    <img src="cid:logo" alt="LRT Jakarta" width="150" style="display: block; margin: 0 auto; max-width: 150px;">
                    
                    <!-- Glass Panel (glassmorphism with backdrop blur simulation) -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 40px auto 0 auto; width: 540px; background-color: rgba(0, 0, 0, 0.5); border-radius: 18px; border: 1px solid rgba(255, 255, 255, 0.18); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); color-scheme: light; -webkit-color-scheme: light;">
                      <tr>
                        <td style="padding: 36px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);">
                          <!-- Panel Title -->
                          <h1 style="color: #ffffff; font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 24px; font-weight: bold; margin: 0 0 24px 0; text-align: center;">You're Invited to Join LRT Jakarta Dashboard</h1>
                          
                          <!-- Greeting -->
                          <p style="color: #ffffff; font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 15px; margin: 0 0 18px 0;">Hello <span style="text-decoration: underline;">${data.to}</span>,</p>
                          
                          <!-- Body Paragraph -->
                          <p style="color: #ffffff; font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; margin: 0 0 26px 0;">
                            You have been invited to join the LRT Jakarta Admin Team. Click the button below to complete your registration and set up your admin account.
                          </p>
                          
                          <!-- CTA Button -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td align="center">
                                <a href="${signupLink}" style="display: inline-block; background-color: #E5262C; color: #ffffff; font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 8px; padding: 16px 32px; letter-spacing: 0.5px;">COMPLETE REGISTRATION</a>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Fallback Link -->
                          <p style="color: rgba(255, 255, 255, 0.8); font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 13px; margin: 20px 0 0 0; text-align: center;">
                            Or copy this link: <a href="${signupLink}" style="color: #ffffff; text-decoration: underline; word-break: break-all;">${signupLink}</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!--[if gte mso 9]>
                </v:textbox>
              </v:rect>
              <![endif]-->
            </td>
          </tr>
          
          <!-- Branded Footer -->
          <tr>
            <td style="background-color: #25262B; padding: 44px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 22px;">
                    <p style="font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 13.5px; color: #a3a3a3; margin: 0; line-height: 1.5;">
                      Butuh bantuan silahkan hubungi <a href="mailto:carla@lrtjakarta.co.id" style="color: #3b82f6; text-decoration: none;">carla@lrtjakarta.co.id</a> atau kunjungi website kami <a href="http://www.lrtjakarta.co.id" style="color: #3b82f6; text-decoration: none;">www.lrtjakarta.co.id</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="85%" style="border-top: 1px solid rgba(255, 255, 255, 0.1);">
                      <tr><td></td></tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-top: 22px;">
                    <p style="font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold; color: #ffffff; margin: 0 0 10px 0;">PT LRT Jakarta</p>
                    <p style="font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 12.5px; color: #a3a3a3; margin: 0 0 22px 0; line-height: 1.5; max-width: 480px;">
                      GEDUNG MCC - DEPO LRT JAKARTA Jl. Raya Kelapa Nias, RW025, Pegangsaan Dua, Kelapa Gading, Kota Jakata Utara, Daerah Khusus Ibu Kota Jakarta, 14250. Tel. +6221 8061 7490 // 021-508 999 09.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td align="center">
                    <p style="font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 11.5px; color: #a3a3a3; margin: 0;">Copyright &copy; 2024 PT LRT Jakarta. All rights reserved.</p>
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
export function generateOtpEmailHtml(data: OtpEmailData): string {
  const { otpCode } = data;
  
  // Format OTP with spacing (e.g. "4 3 0 2")
  const spacedCode = otpCode.split('').join(' ');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code - LRT Jakarta</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4; margin: 0 auto;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; max-width: 600px; width: 100%;">
          
          <!-- Hero Header with Station Photo Background -->
          <tr>
            <td align="center" style="background-color: #1a1a1a; background-image: url('cid:bg-image'); background-size: cover; background-position: center; height: 620px; position: relative;">
              <!--[if gte mso 9]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:620px;">
                <v:fill type="frame" src="cid:bg-image" color="#1a1a1a" />
                <v:textbox inset="0,0,0,0">
              <![endif]-->
              
              <!-- No dark overlay - direct bg image -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" height="620" style="height: 620px;">
                <tr>
                  <td align="center" valign="top" style="padding-top: 36px;">
                    <!-- Logo -->
                    <img src="cid:logo" alt="LRT Jakarta" width="150" style="display: block; margin: 0 auto; max-width: 150px;">
                    
                    <!-- Glass Panel (glassmorphism with backdrop blur simulation) -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 36px auto 0 auto; width: 540px; background-color: rgba(0, 0, 0, 0.5); border-radius: 18px; border: 1px solid rgba(255, 255, 255, 0.18); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); color-scheme: light; -webkit-color-scheme: light;">
                      <tr>
                        <td style="padding: 36px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);">
                          <!-- Panel Title & Subtitle -->
                          <h1 style="color: #ffffff; font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 24px; font-weight: bold; margin: 0 0 6px 0; text-align: center;">Verification Code</h1>
                          <p style="color: #ffffff; font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 15.5px; margin: 0 0 22px 0; text-align: center;">Complete Your Registration</p>
                          
                          <!-- Greeting -->
                          <p style="color: #ffffff; font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 15px; margin: 0 0 18px 0;">Hello <span style="text-decoration: underline;">${data.to}</span>,</p>
                          
                          <!-- Body Paragraph -->
                          <p style="color: #ffffff; font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; margin: 0 0 26px 0;">
                            Your verification code is ready. Use this one-time code to complete your admin registration.
                          </p>
                          
                          <!-- OTP Code Pill -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td align="center">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background-color: #E5262C; border-radius: 32px; padding: 0 36px; height: 60px;">
                                  <tr>
                                    <td align="center" valign="middle" style="height: 60px;">
                                      <p style="color: #ffffff; font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 30px; font-weight: bold; letter-spacing: 6px; margin: 0; padding: 0; line-height: 1;">${spacedCode}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!--[if gte mso 9]>
                </v:textbox>
              </v:rect>
              <![endif]-->
            </td>
          </tr>
          
          <!-- Branded Footer -->
          <tr>
            <td style="background-color: #25262B; padding: 44px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 22px;">
                    <p style="font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 13.5px; color: #a3a3a3; margin: 0; line-height: 1.5;">
                      Butuh bantuan silahkan hubungi <a href="mailto:carla@lrtjakarta.co.id" style="color: #3b82f6; text-decoration: none;">carla@lrtjakarta.co.id</a> atau kunjungi website kami <a href="http://www.lrtjakarta.co.id" style="color: #3b82f6; text-decoration: none;">www.lrtjakarta.co.id</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="85%" style="border-top: 1px solid rgba(255, 255, 255, 0.1);">
                      <tr><td></td></tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-top: 22px;">
                    <p style="font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold; color: #ffffff; margin: 0 0 10px 0;">PT LRT Jakarta</p>
                    <p style="font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 12.5px; color: #a3a3a3; margin: 0 0 22px 0; line-height: 1.5; max-width: 480px;">
                      GEDUNG MCC - DEPO LRT JAKARTA Jl. Raya Kelapa Nias, RW025, Pegangsaan Dua, Kelapa Gading, Kota Jakata Utara, Daerah Khusus Ibu Kota Jakarta, 14250. Tel. +6221 8061 7490 // 021-508 999 09.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td align="center">
                    <p style="font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size: 11.5px; color: #a3a3a3; margin: 0;">Copyright &copy; 2024 PT LRT Jakarta. All rights reserved.</p>
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
      sendMail: async (mailOptions: { to: string; subject: string; from: string; html: string }) => {
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
  const basePath = process.cwd();

  await transporter.sendMail({
    from: `"${fromName}" <${from}>`,
    to: data.to,
    subject: 'You\'re Invited to Join LRT Jakarta Admin Team',
    html,
    attachments: [
      {
        filename: 'lrt-train.jpeg',
        path: `${basePath}/public/lrt-train.jpeg`,
        cid: 'bg-image'
      },
      {
        filename: 'logo-lrtj.png',
        path: `${basePath}/public/logo-lrtj.png`,
        cid: 'logo'
      }
    ]
  });
}

export async function sendOtpEmail(data: OtpEmailData): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || 'noreply@lrtj.co.id';
  const fromName = process.env.SMTP_FROM_NAME || 'LRT Jakarta';

  const html = generateOtpEmailHtml(data);
  const basePath = process.cwd();

  await transporter.sendMail({
    from: `"${fromName}" <${from}>`,
    to: data.to,
    subject: 'Your LRT Jakarta Verification Code',
    html,
    attachments: [
      {
        filename: 'lrt-train.jpeg',
        path: `${basePath}/public/lrt-train.jpeg`,
        cid: 'bg-image'
      },
      {
        filename: 'logo-lrtj.png',
        path: `${basePath}/public/logo-lrtj.png`,
        cid: 'logo'
      }
    ]
  });
}
