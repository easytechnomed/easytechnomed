import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin("MEMBER_READ");
    const roles = await prisma.adminRole.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ success: true, roles });
  } catch (error) {
    console.error("Workspace Roles GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
