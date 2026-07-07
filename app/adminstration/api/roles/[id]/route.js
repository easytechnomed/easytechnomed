import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";

export async function DELETE(req, { params }) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json({ success: false, error: "Invalid role ID" }, { status: 400 });
    }

    if (roleId === 1) {
      return NextResponse.json({ success: false, error: "Cannot delete the default Admin role." }, { status: 400 });
    }

    await prisma.adminRole.update({
      where: { id: roleId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return NextResponse.json({ success: true, message: "Role deleted successfully." });
  } catch (error) {
    console.error("SuperAdmin Role DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
