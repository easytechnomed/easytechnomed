import nodemailer from "nodemailer";

function getTransporter() {
  const user = (process.env.SMTP_USER || "easytechnomed@gmail.com").trim().replace(/['"]/g, "");
  const pass = (process.env.SMTP_PASS || "ckwgjuegmhljreio").trim().replace(/['"]/g, "");

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for port 465 (SSL)
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://easytechnomed.com").trim().replace(/['"]/g, "");
}

function getSmtpUser() {
  return (process.env.SMTP_USER || "easytechnomed@gmail.com").trim().replace(/['"]/g, "");
}

/**
 * Sends a password reset email to the admin.
 */
export async function sendPasswordResetEmail(email, token) {
  const appUrl = getAppUrl();
  const smtpUser = getSmtpUser();
  const transporter = getTransporter();
  const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

  console.log(`[MAIL_DEBUG] Sending password reset email to: ${email}`);

  const html = `
    <div style="font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #0f172a;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 2px solid #e2e8f0;">
        <div style="background-color: #0f766e; padding: 28px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Reset Your Workspace Password</h1>
          <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; font-weight: 600;">EasyTechnoMed Laboratory Portal</p>
        </div>
        <div style="padding: 32px 28px;">
          <p style="font-size: 15px; line-height: 1.6; margin-top: 0; font-weight: 600; color: #1e293b;">Hello,</p>
          <p style="font-size: 15px; line-height: 1.6; color: #475569;">We received a request to reset the password for your Workspace Admin account. Click the button below to choose a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 13px 32px; font-weight: 700; font-size: 15px; border-radius: 8px; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-bottom: 0;">⏱️ This reset link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; line-height: 1.6; color: #94a3b8; word-break: break-all; margin: 0;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${resetLink}" style="color: #0f766e; text-decoration: underline;">${resetLink}</a></p>
        </div>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"EasyTechnoMed Security" <${smtpUser}>`,
      to: email,
      subject: "Reset Your Workspace Password - EasyTechnoMed",
      html,
    });
    console.log(`[MAIL_DEBUG] Password reset email sent to ${email}. ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[MAIL_DEBUG_ERROR] Password reset email failed for ${email}:`, err);
    throw err;
  }
}

/**
 * Sends a verification email to the user.
 */
export async function sendVerificationEmail(email, token) {
  const appUrl = getAppUrl();
  const smtpUser = getSmtpUser();
  const transporter = getTransporter();
  const verificationLink = `${appUrl}/api/auth/verify-email?token=${token}`;

  console.log(`[MAIL_DEBUG] Sending verification email to: ${email}`);

  const html = `
    <div style="font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
        <div style="background-color: #0f766e; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Verify Your Email</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">Welcome to EasyTechnoMed Portal</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Hi,</p>
          <p style="font-size: 16px; line-height: 1.6;">Thank you for registering. Please verify your email address to continue with your registration process.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationLink}" style="background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 30px; font-weight: 600; font-size: 15px; border-radius: 8px; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">If you did not request this email, you can safely ignore it.</p>
          <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
          <p style="font-size: 12px; line-height: 1.6; color: #9ca3af; word-break: break-all; margin: 0;">Or copy and paste this URL into your browser:<br/>${verificationLink}</p>
        </div>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"EasyTechnoMed Support" <${smtpUser}>`,
      to: email,
      subject: "Verify Your Email Address - EasyTechnoMed",
      html,
    });
    console.log(`[MAIL_DEBUG] Verification email sent to ${email}. ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[MAIL_DEBUG_ERROR] Verification email failed for ${email}:`, err);
    throw err;
  }
}

/**
 * Sends an email informing the user that their account is approved.
 */
export async function sendApprovalEmail(email) {
  const appUrl = getAppUrl();
  const smtpUser = getSmtpUser();
  const transporter = getTransporter();
  const loginLink = `${appUrl}/auth/login`;

  console.log(`[MAIL_DEBUG] Sending approval email to: ${email}`);

  const html = `
    <div style="font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
        <div style="background-color: #0f766e; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Account Approved!</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">Your EasyTechnoMed Account is Ready</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Hi,</p>
          <p style="font-size: 16px; line-height: 1.6;">Good news! Your registration has been approved by the administrator. You can now log in and access your dashboard.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginLink}" style="background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 30px; font-weight: 600; font-size: 15px; border-radius: 8px; display: inline-block;">Log In to Your Account</a>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">Welcome to our platform!</p>
        </div>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"EasyTechnoMed Support" <${smtpUser}>`,
      to: email,
      subject: "Your Account Has Been Approved - EasyTechnoMed",
      html,
    });
    console.log(`[MAIL_DEBUG] Approval email sent to ${email}. ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[MAIL_DEBUG_ERROR] Approval email failed for ${email}:`, err);
    throw err;
  }
}

/**
 * Sends an email informing the user that their account is rejected.
 */
export async function sendRejectionEmail(email) {
  const smtpUser = getSmtpUser();
  const transporter = getTransporter();

  console.log(`[MAIL_DEBUG] Sending rejection email to: ${email}`);

  const html = `
    <div style="font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
        <div style="background-color: #ef4444; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Registration Rejected</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">EasyTechnoMed Registration Update</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Hi,</p>
          <p style="font-size: 16px; line-height: 1.6;">We regret to inform you that your registration request has been rejected by the administrator.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">If you believe this was in error, please contact us for support.</p>
        </div>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"EasyTechnoMed Support" <${smtpUser}>`,
      to: email,
      subject: "Registration Rejected - EasyTechnoMed",
      html,
    });
    console.log(`[MAIL_DEBUG] Rejection email sent to ${email}. ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[MAIL_DEBUG_ERROR] Rejection email failed for ${email}:`, err);
    throw err;
  }
}

/**
 * Sends welcome / onboarding credentials email to the administrator.
 */
export async function sendOnboardingWelcomeEmail({ email, password, workspaceName, companyName }) {
  const appUrl = getAppUrl();
  const smtpUser = getSmtpUser();
  const transporter = getTransporter();
  const loginLink = `${appUrl}/auth/login`;
  const logoUrl = "https://www.easytechnomed.com/logo/logobg.png";

  console.log(`[MAIL_DEBUG] Initiating sendOnboardingWelcomeEmail to: ${email}, workspace: "${workspaceName}", smtpUser: "${smtpUser}"`);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 2px solid #e2e8f0;">
          
          <!-- Logo & Header (White background with Primary #0f766e Title) -->
          <div style="background-color: #ffffff; padding: 32px 24px 20px 24px; text-align: center; border-bottom: 1px solid #f1f5f9;">
            <img src="${logoUrl}" alt="EasyTechnoMed" style="height: 52px; max-width: 190px; margin-bottom: 16px; display: inline-block; object-fit: contain;" />
            <h1 style="margin: 0; color: #0f766e; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Account Created Successfully!</h1>
          </div>

          <!-- Body -->
          <div style="padding: 28px 28px 32px 28px; background-color: #ffffff;">
            <p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px 0; font-weight: 700; color: #0f172a;">
              Congratulations! Your account is created successfully.
            </p>
            
            <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 20px 0;">
              Here are your login credentials:
            </p>

            <!-- Credentials Box -->
            <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
              ${workspaceName ? `<div style="margin-bottom: 10px; font-size: 14px;"><span style="color: #64748b; font-weight: 600;">Workspace:</span> <strong style="color: #0f172a;">${workspaceName}</strong></div>` : ""}
              <div style="margin-bottom: 10px; font-size: 14px;"><span style="color: #64748b; font-weight: 600;">Email:</span> <strong style="color: #0f766e;">${email}</strong></div>
              <div style="font-size: 14px;"><span style="color: #64748b; font-weight: 600;">Password:</span> <strong style="color: #0f172a; font-family: monospace; font-size: 15px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${password}</strong></div>
            </div>

            <!-- Login CTA -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${loginLink}" style="background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 32px; font-weight: 700; font-size: 14px; border-radius: 10px; display: inline-block;">Log In to Workspace</a>
            </div>

            <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0; font-weight: 600; text-align: center;">
              Thank you for choosing EasyTechnoMed!
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #fafafa; padding: 14px 24px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
              © ${new Date().getFullYear()} EasyTechnoMed. All rights reserved.
            </p>
          </div>

        </div>
      </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"EasyTechnoMed" <${smtpUser}>`,
      to: email,
      subject: "Congratulations! Your EasyTechnoMed Account is Ready",
      html,
    });
    console.log(`[MAIL_DEBUG] Onboarding welcome email successfully sent to: ${email}! MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[MAIL_DEBUG_ERROR] Error sending onboarding email to ${email}:`, err);
    throw err;
  }
}
