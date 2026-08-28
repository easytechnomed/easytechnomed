import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token;
    const newPassword = body.newPassword;
    const confirmPassword = body.confirmPassword;

    if (!token) {
      return NextResponse.json({ success: false, message: "Reset token is missing or invalid." });
    }

    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: "New password and confirmation are required." });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: "Passwords do not match." });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, message: "Password must be at least 8 characters long." });
    }

    // Verify JWT Token
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== "admin_password_reset" || !decoded.id) {
      return NextResponse.json({
        success: false,
        message: "Invalid or expired password reset link. Please request a new one.",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
    });

    if (!admin) {
      return NextResponse.json({ success: false, message: "Admin account not found." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update Admin password
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });

    // Invalidate previous sessions for security
    await prisma.adminSession.deleteMany({
      where: { adminId: admin.id },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! Please sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset Password API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
