import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function PUT(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const workspaceId = parseInt(id);
    const body = await req.json().catch(() => ({}));
    const { isActive } = body;

    if (isNaN(workspaceId) || isActive === undefined) {
      return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
    }

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { isActive },
    });

    return NextResponse.json({ success: true, message: `Workspace ${isActive ? "enabled" : "disabled"} successfully.` });
  } catch (error) {
    console.error("SuperAdmin Workspace Toggle Status Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
