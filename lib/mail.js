import nodemailer from "nodemailer";

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://easytechnomed.com").trim().replace(/['"]/g, "");
}

function getPrimaryConfig() {
  const host = (process.env.SMTP_HOST || "smtp.hostinger.com").trim().replace(/['"]/g, "");
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = (process.env.SMTP_USER || process.env.SMTP_EMAIL || "").trim().replace(/['"]/g, "");
  const pass = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "").trim().replace(/['"]/g, "");

  return { host, port, user, pass };
}

function getFallbackConfig() {
  const user = (process.env.GOOGLE_SMTP_USER || "easytechnomed@gmail.com").trim().replace(/['"]/g, "");
  const pass = (process.env.GOOGLE_SMTP_PASS || "eyrjigtmqzsieuoj").trim().replace(/['"]/g, "");

  return {
    host: "smtp.gmail.com",
    port: 465,
    user,
    pass,
  };
}

function createTransporter({ host, port, user, pass }) {
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for port 465, false for 587
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Universal Mail Dispatcher with Primary (Hostinger) & Fallback (Google Gmail) Failover.
 */
export async function sendMailWithFallback({ to, subject, html, fromName = "EasyTechnoMed" }) {
  const primary = getPrimaryConfig();
  const fallback = getFallbackConfig();

  const isPrimaryConfigured =
    primary.user &&
    primary.pass &&
    !primary.user.includes("your-support") &&
    !primary.pass.includes("your-email-password");

  if (isPrimaryConfigured) {
    try {
      console.log(`[MAIL_DEBUG] Attempting Primary SMTP (${primary.host}:${primary.port}, user: ${primary.user}) for: ${to}`);
      const primaryTransporter = createTransporter(primary);
      const info = await primaryTransporter.sendMail({
        from: `"${fromName}" <${primary.user}>`,
        to,
        subject,
        html,
      });
      console.log(`[MAIL_DEBUG] Primary SMTP sent successfully to ${to}. MessageId: ${info.messageId}`);
      return info;
    } catch (primaryErr) {
      console.warn(`[MAIL_DEBUG_WARN] Primary SMTP failed for ${to} (${primaryErr.message}). Switching to Fallback Google SMTP...`);
    }
  } else {
    console.log(`[MAIL_DEBUG] Primary SMTP not fully configured or placeholder detected. Using Google Fallback SMTP directly for: ${to}`);
  }

  // Fallback to Google SMTP
  try {
    console.log(`[MAIL_DEBUG] Sending via Google Fallback SMTP (${fallback.user}) for: ${to}`);
    const fallbackTransporter = createTransporter(fallback);
    const info = await fallbackTransporter.sendMail({
      from: `"${fromName}" <${fallback.user}>`,
      to,
      subject,
      html,
    });
    console.log(`[MAIL_DEBUG] Google Fallback SMTP sent successfully to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (fallbackErr) {
    console.error(`[MAIL_DEBUG_ERROR] Both Primary & Google Fallback SMTP failed for ${to}:`, fallbackErr);
    throw fallbackErr;
  }
}

/**
 * Sends a password reset email to the admin.
 */
export async function sendPasswordResetEmail(email, token) {
  const appUrl = getAppUrl();
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

  return sendMailWithFallback({
    to: email,
    subject: "Reset Your Workspace Password - EasyTechnoMed",
    html,
    fromName: "EasyTechnoMed Security",
  });
}

/**
 * Sends a verification email to the user.
 */
export async function sendVerificationEmail(email, token) {
  const appUrl = getAppUrl();
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

  return sendMailWithFallback({
    to: email,
    subject: "Verify Your Email Address - EasyTechnoMed",
    html,
    fromName: "EasyTechnoMed Support",
  });
}

/**
 * Sends an email informing the user that their account is approved.
 */
export async function sendApprovalEmail(email) {
  const appUrl = getAppUrl();
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

  return sendMailWithFallback({
    to: email,
    subject: "Your Account Has Been Approved - EasyTechnoMed",
    html,
    fromName: "EasyTechnoMed Support",
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

  return sendMailWithFallback({
    to: email,
    subject: "Registration Rejected - EasyTechnoMed",
    html,
    fromName: "EasyTechnoMed Support",
  });
}

/**
 * Sends welcome / onboarding credentials email to the administrator.
 */
export async function sendOnboardingWelcomeEmail({ email, password, workspaceName }) {
  const appUrl = getAppUrl();
  const loginLink = `${appUrl}/auth/login`;
  const logoUrl = "https://www.easytechnomed.com/logo/logobg.png";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 2px solid #e2e8f0;">
          
          <!-- Logo & Header -->
          <div style="background-color: #ffffff; padding: 32px 24px 20px 24px; text-align: center; border-bottom: 1px solid #f1f5f9;">
            <div style="text-align: center; margin-bottom: 16px;">
              <img src="${logoUrl}" alt="EasyTechnoMed" style="height: 50px; max-width: 190px; margin: 0 auto; display: block; object-fit: contain;" />
            </div>
            <h1 style="margin: 0; text-align: center; color: #0f766e; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Account Created Successfully!</h1>
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

  return sendMailWithFallback({
    to: email,
    subject: "Congratulations! Your EasyTechnoMed Account is Ready",
    html,
    fromName: "EasyTechnoMed",
  });
}

/**
 * Sends a subscription plan renewal confirmation email to the workspace administrator/owner.
 */
export async function sendPlanRenewedEmail({
  email,
  adminName,
  workspaceName,
  days,
  startDate,
  expireAt,
  amount,
  paymentMode,
  referenceNo,
  invoiceUid,
}) {
  const appUrl = getAppUrl();
  const loginLink = `${appUrl}/auth/login`;
  const logoUrl = "https://www.easytechnomed.com/logo/logobg.png";

  const expDateObj = new Date(expireAt);
  const formattedExpiry = !isNaN(expDateObj.getTime())
    ? expDateObj.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : String(expireAt);

  const startDateObj = startDate ? new Date(startDate) : new Date();
  const formattedStart = !isNaN(startDateObj.getTime())
    ? startDateObj.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    : "Immediate";

  const formattedAmount =
    amount && Number(amount) > 0 ? `₹${Number(amount).toLocaleString("en-IN")}` : "Complimentary / Direct";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;">
        <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 2px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          
          <!-- Logo & Header -->
          <div style="background-color: #ffffff; padding: 32px 24px 20px 24px; text-align: center; border-bottom: 1px solid #f1f5f9;">
            <!-- Centered Logo -->
            <div style="text-align: center; margin-bottom: 16px;">
              <img src="${logoUrl}" alt="EasyTechnoMed" style="height: 48px; max-width: 190px; margin: 0 auto; display: block; object-fit: contain;" />
            </div>
            
            <!-- Centered Status Badge -->
            <div style="text-align: center; margin-bottom: 12px;">
              <span style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11.5px; font-weight: 800; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                ⚡ PLAN RENEWED & ACTIVE
              </span>
            </div>

            <!-- Centered Title -->
            <h1 style="margin: 0; text-align: center; color: #0f766e; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Subscription Plan Extended!</h1>
          </div>

          <!-- Body -->
          <div style="padding: 28px 28px 32px 28px; background-color: #ffffff;">
            <p style="font-size: 15px; line-height: 1.5; margin: 0 0 12px 0; font-weight: 700; color: #0f172a;">
              Hello ${adminName || "Admin"},
            </p>
            
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
              Your subscription plan for workspace <strong style="color: #0f766e;">${workspaceName || "Your Workspace"}</strong> has been successfully renewed and extended by <strong>${days} days</strong>.
            </p>

            <!-- Renewal Summary Box -->
            <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Workspace:</td>
                  <td style="padding: 6px 0; font-weight: 800; color: #0f172a; text-align: right;">${workspaceName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Validity Extended:</td>
                  <td style="padding: 6px 0; font-weight: 800; color: #0f766e; text-align: right;">+${days} Days</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Valid From:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #334155; text-align: right;">${formattedStart}</td>
                </tr>
                <tr style="border-top: 1px dashed #cbd5e1;">
                  <td style="padding: 8px 0 6px 0; color: #0f172a; font-weight: 700;">New Expiry Date:</td>
                  <td style="padding: 8px 0 6px 0; font-weight: 800; color: #0f766e; text-align: right; font-size: 14.5px;">${formattedExpiry}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payment Amount:</td>
                  <td style="padding: 6px 0; font-weight: 800; color: #0f172a; text-align: right;">${formattedAmount}</td>
                </tr>
                ${paymentMode
      ? `<tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payment Mode:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #334155; text-align: right;">${paymentMode}</td>
                </tr>`
      : ""
    }
                ${referenceNo
      ? `<tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Reference No:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #334155; text-align: right;">${referenceNo}</td>
                </tr>`
      : ""
    }
                ${invoiceUid
      ? `<tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Receipt UID:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #64748b; text-align: right; font-family: monospace;">${invoiceUid}</td>
                </tr>`
      : ""
    }
              </table>
            </div>

            <!-- Login CTA -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${loginLink}" style="background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 13px 34px; font-weight: 700; font-size: 14px; border-radius: 10px; display: inline-block;">Log In to Your Workspace</a>
            </div>

            <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0; text-align: center;">
              All features, test configurations, and diagnostic records are fully active and uninterrupted.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #fafafa; padding: 16px 24px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
              © ${new Date().getFullYear()} EasyTechnoMed. All rights reserved.
            </p>
          </div>

        </div>
      </body>
    </html>
  `;

  return sendMailWithFallback({
    to: email,
    subject: `Subscription Plan Renewed for ${workspaceName || "Your Workspace"} - EasyTechnoMed`,
    html,
    fromName: "EasyTechnoMed Billing",
  });
}
