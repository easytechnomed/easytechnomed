import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER || "your-email@gmail.com";
const smtpPass = process.env.SMTP_PASS || "nccy ljuu ioiz ocvj";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

/**
 * Sends a verification email to the user.
 */
export async function sendVerificationEmail(email, token) {
  const verificationLink = `${appUrl}/api/auth/verify-email?token=${token}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Verify Your Email</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">Welcome to Pathlab Auth System</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Hi,</p>
          <p style="font-size: 16px; line-height: 1.6;">Thank you for registering. Please verify your email address to continue with your registration process.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationLink}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 30px; font-weight: 600; font-size: 15px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Verify Email Address</a>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">If you did not request this email, you can safely ignore it.</p>
          <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
          <p style="font-size: 12px; line-height: 1.6; color: #9ca3af; word-break: break-all; margin: 0;">Or copy and paste this URL into your browser:<br/>${verificationLink}</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Pathlab Admin" <${smtpUser}>`,
    to: email,
    subject: "Verify Your Email Address - Pathlab",
    html,
  });
}

/**
 * Sends an email informing the user that their account is approved.
 */
export async function sendApprovalEmail(email) {
  const loginLink = `${appUrl}/auth/login`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Account Approved!</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">Your Pathlab Account is Ready</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Hi,</p>
          <p style="font-size: 16px; line-height: 1.6;">Good news! Your registration has been approved by the administrator. You can now log in and access your dashboard.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginLink}" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 30px; font-weight: 600; font-size: 15px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">Log In to Your Account</a>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">Welcome to our platform!</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Pathlab Admin" <${smtpUser}>`,
    to: email,
    subject: "Your Account Has Been Approved - Pathlab",
    html,
  });
}

/**
 * Sends an email informing the user that their account is rejected.
 */
export async function sendRejectionEmail(email) {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #1f2937;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Registration Rejected</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">Pathlab Registration Update</p>
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
    from: `"Pathlab Admin" <${smtpUser}>`,
    to: email,
    subject: "Registration Rejected - Pathlab",
    html,
  });
}
