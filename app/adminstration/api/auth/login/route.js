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

    const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });
    if (!superAdmin) {
      return NextResponse.json({ success: false, message: "Invalid email or password." });
    }

    const isPasswordMatch = await bcrypt.compare(password, superAdmin.password || "");
    if (!isPasswordMatch) {
      return NextResponse.json({ success: false, message: "Invalid email or password." });
    }

    const cookieStore = await cookies();
    const headerStore = await headers();
    const ipAddress = headerStore.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = headerStore.get("user-agent") || "unknown";
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const token = signToken({ id: superAdmin.id, email: superAdmin.email, isSuper: true });

    await prisma.superAdminSession.create({
      data: {
        superAdminId: superAdmin.id,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    cookieStore.set("super_admin_session_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 2 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Login successful!", redirect: "/adminstration/dashboard" });
  } catch (error) {
    console.error("SuperAdmin Login API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
