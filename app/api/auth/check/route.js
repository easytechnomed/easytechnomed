import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session_token")?.value;
    if (!token) {
      return NextResponse.json({ success: true, isLoggedIn: false });
    }

    const session = await prisma.adminSession.findUnique({
      where: { token },
      include: {
        admin: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: true, isLoggedIn: false });
    }

    const admin = session.admin;
    if (!admin.isActive || (admin.workspace && !admin.workspace.isActive)) {
      return NextResponse.json({ success: true, isLoggedIn: false });
    }

    return NextResponse.json({ success: true, isLoggedIn: true });
  } catch (err) {
    console.error("Auth check API error:", err);
    return NextResponse.json({ success: true, isLoggedIn: false });
  }
}
