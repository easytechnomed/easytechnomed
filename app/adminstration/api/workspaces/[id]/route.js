import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function DELETE(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const workspaceId = parseInt(id);

    if (isNaN(workspaceId)) {
      return NextResponse.json({ success: false, error: "Invalid workspace ID" }, { status: 400 });
    }

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return NextResponse.json({ success: true, message: "Workspace deleted successfully." });
  } catch (error) {
    console.error("SuperAdmin Workspace DELETE Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
