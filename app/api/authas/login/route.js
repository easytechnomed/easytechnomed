import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid email or password" });
    }

    if (user.provider === "google" && !user.password) {
      return NextResponse.json({
        success: false,
        message: "This account was registered with Google. Please use Google Sign-In.",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password || "");
    if (!isPasswordMatch) {
      return NextResponse.json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: token,
          verificationTokenExpires: expires,
        },
      });

      try {
        await sendVerificationEmail(user.email, token);
      } catch (mailErr) {
        console.error("Resend verification email failed:", mailErr);
      }

      return NextResponse.json({
        success: false,
        status: "unverified",
        message: "Please verify your email. A new verification email has been sent.",
      });
    }

    if (user.rejected) {
      return NextResponse.json({
        success: false,
        message: "Your registration request has been rejected by the administrator.",
      });
    }

    if (!user.isApproved) {
      return NextResponse.json({
        success: false,
        status: "pending_approval",
        message: "Your account is waiting for admin approval.",
      });
    }

    const cookieStore = await cookies();
    const headerStore = await headers();
    const ipAddress = headerStore.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = headerStore.get("user-agent") || "unknown";
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const token = signToken({ id: user.id, email: user.email, roleId: user.roleId });

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Login successful!", redirect: "/dashboard" });
  } catch (error) {
    console.error("Customer Login API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
