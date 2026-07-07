import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { success: false, message: "Missing Google ID token" },
        { status: 400 }
      );
    }

    // Verify token using Firebase Identity Toolkit API
    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!firebaseRes.ok) {
      return NextResponse.json(
        { success: false, message: "Invalid Google ID token" },
        { status: 400 }
      );
    }

    const firebaseData = await firebaseRes.json();
    const googleUser = firebaseData.users?.[0];

    if (!googleUser) {
      return NextResponse.json(
        { success: false, message: "Invalid Google user account data" },
        { status: 400 }
      );
    }

    const { email, localId: googleId, displayName: name } = googleUser;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email not provided by Google" },
        { status: 400 }
      );
    }

    // Check if user exists in standard Customer User table
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Register user as Customer (roleId: 2)
      user = await prisma.user.create({
        data: {
          name: name || email.split("@")[0],
          email,
          provider: "google",
          googleId,
          roleId: 2, // Customer role
          isEmailVerified: true,
          isApproved: false,
        },
      });

      return NextResponse.json({
        success: true,
        status: "registered_pending_approval",
        message: "Registration successful. Please wait until the admin approves your account.",
      });
    }

    // Update existing user with Google ID and provider if not already set
    if (user.provider !== "google") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: "google",
          googleId,
          isEmailVerified: true, // Google accounts are pre-verified
        },
      });
    }

    // Check approval
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

    // Create session in UserSession
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

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

    // Set Customer session_token cookie
    const response = NextResponse.json({
      success: true,
      redirect: "/dashboard",
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: false, // Set to false to support local HTTP network testing on mobile devices
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Google login API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
