import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/login?error=missing_token", request.url)
      );
    }

    // Find user with verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/login?error=invalid_token", request.url)
      );
    }

    // Check expiration
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      return NextResponse.redirect(
        new URL("/auth/login?error=expired_token", request.url)
      );
    }

    // Update user: set verified to true
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    return NextResponse.redirect(
      new URL("/auth/login?verified=true", request.url)
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=server_error", request.url)
    );
  }
}
