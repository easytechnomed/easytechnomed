import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER || "your-email@gmail.com";
const smtpPass = process.env.SMTP_PASS || "ckwgjuegmhljreio";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://easytechnomed.com";

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

/**
 * Sends a password reset email to the admin.
 */
export async function sendPasswordResetEmail(email, token) {
  const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

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

  await transporter.sendMail({
    from: `"EasyTechnoMed Security" <${smtpUser}>`,
    to: email,
    subject: "Reset Your Workspace Password - EasyTechnoMed",
    html,
  });
}

/**
 * Sends a verification email to the user.
 */
export async function sendVerificationEmail(email, token) {
  const verificationLink = `${appUrl}/api/auth/verify-email?token=${token}`;

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

  await transporter.sendMail({
    from: `"EasyTechnoMed Support" <${smtpUser}>`,
    to: email,
    subject: "Verify Your Email Address - EasyTechnoMed",
    html,
  });
}

/**
 * Sends an email informing the user that their account is approved.
 */
export async function sendApprovalEmail(email) {
  const loginLink = `${appUrl}/auth/login`;

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

  await transporter.sendMail({
    from: `"EasyTechnoMed Support" <${smtpUser}>`,
    to: email,
    subject: "Your Account Has Been Approved - EasyTechnoMed",
    html,
  });
}

/**
 * Sends an email informing the user that their account is rejected.
 */
export async function sendRejectionEmail(email) {
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

  await transporter.sendMail({
    from: `"EasyTechnoMed Support" <${smtpUser}>`,
    to: email,
    subject: "Registration Rejected - EasyTechnoMed",
    html,
  });
}
