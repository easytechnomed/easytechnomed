import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const adminId = parseInt(id);

    if (isNaN(adminId)) {
      return NextResponse.json({ success: false, error: "Invalid admin ID" }, { status: 400 });
    }

    const trackings = await prisma.adminTracking.findMany({
      where: { adminId },
      orderBy: { startUTC: "desc" },
    });

    return NextResponse.json({ success: true, trackings });
  } catch (error) {
    console.error("SuperAdmin Admin Tracking GET Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
