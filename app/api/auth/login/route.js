import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required." });
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
      include: { workspace: true },
    });

    if (!admin) {
      return NextResponse.json({ success: false, message: "Invalid email or password." });
    }

    const isPasswordMatch = await bcrypt.compare(password, admin.password || "");
    if (!isPasswordMatch) {
      return NextResponse.json({ success: false, message: "Invalid email or password." });
    }

    if (!admin.isActive) {
      return NextResponse.json({ success: false, message: "Your account is deactivated." });
    }

    if (admin.workspace && !admin.workspace.isActive) {
      return NextResponse.json({ success: false, message: "Your laboratory workspace has been deactivated." });
    }

    if (!admin.isEmailVerified) {
      return NextResponse.json({ success: false, message: "Admin email must be verified first." });
    }

    if (!admin.isApproved) {
      return NextResponse.json({ success: false, message: "Admin account is waiting for approval." });
    }

    const cookieStore = await cookies();
    const headerStore = await headers();
    const ipAddress = headerStore.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = headerStore.get("user-agent") || "unknown";
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const token = signToken({ id: admin.id, email: admin.email, roleId: admin.roleId });

    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    cookieStore.set("admin_session_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Login successful!", redirect: "/admin/dashboard" });
  } catch (error) {
    console.error("Admin Login API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
