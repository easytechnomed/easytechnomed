import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    const userToken = cookieStore.get("session_token")?.value;
    if (userToken) {
      await prisma.userSession.delete({ where: { token: userToken } }).catch(() => {});
      cookieStore.delete("session_token");
    }

    const adminToken = cookieStore.get("admin_session_token")?.value;
    if (adminToken) {
      await prisma.adminSession.delete({ where: { token: adminToken } }).catch(() => {});
      cookieStore.delete("admin_session_token");
    }

    return NextResponse.json({ success: true, redirect: "/auth/login" });
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
