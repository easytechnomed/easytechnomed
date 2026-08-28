import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, message: "Please enter your registered email address." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address." });
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json({
        success: false,
        message: "No workspace admin account found with this email.",
      });
    }

    if (!admin.isActive) {
      return NextResponse.json({
        success: false,
        message: "Your admin account is currently deactivated. Please contact support.",
      });
    }

    // Generate reset token (valid for 1 hour)
    const token = signToken(
      {
        id: admin.id,
        email: admin.email,
        type: "admin_password_reset",
      },
      "1h"
    );

    // Send reset email via SMTP
    await sendPasswordResetEmail(admin.email, token);

    return NextResponse.json({
      success: true,
      message: "Password reset link has been sent to your email!",
    });
  } catch (error) {
    console.error("Forgot Password API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
