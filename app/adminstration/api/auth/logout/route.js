import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("super_admin_session_token")?.value;
    if (token) {
      await prisma.superAdminSession.delete({ where: { token } }).catch(() => {});
      cookieStore.delete("super_admin_session_token");
    }
    return NextResponse.json({ success: true, redirect: "/adminstration/login" });
  } catch (error) {
    console.error("SuperAdmin Logout API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
