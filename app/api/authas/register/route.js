import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const confirmPassword = body.confirmPassword;

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ success: false, message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, message: "Passwords do not match" });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, message: "Password must be at least 8 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Invalid email address" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days free trial

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        provider: "credentials",
        roleId: 2,
        isEmailVerified: false,
        isApproved: false,
        verificationToken: token,
        verificationTokenExpires: expires,
        startAt: now,
        expireAt: trialEnd,
      },
    });

    try {
      await sendVerificationEmail(email, token);
    } catch (mailError) {
      console.error("Failed to send verification email:", mailError);
      return NextResponse.json({
        success: true,
        message: "Registration successful! (Warning: Verification email could not be sent. Please check SMTP config).",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful! A verification link has been sent to your email.",
    });
  } catch (error) {
    console.error("Customer Register API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
