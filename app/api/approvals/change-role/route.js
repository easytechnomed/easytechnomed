import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req) {
  try {
    await requireAdmin("admin:approve");
    const body = await req.json().catch(() => ({}));
    const { userId, roleId } = body;
    const parsedRoleId = parseInt(roleId);

    const roleExists = await prisma.userRole.findUnique({ where: { id: parsedRoleId } });
    if (!roleExists) return NextResponse.json({ success: false, message: "Invalid role selected" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId: parsedRoleId },
      include: { role: true },
    });

    return NextResponse.json({
      success: true,
      message: `Updated role of ${updatedUser.name} to ${updatedUser.role?.name || "Customer"}.`,
      user: { id: updatedUser.id, roleId: updatedUser.roleId, role: updatedUser.role }
    });
  } catch (error) {
    console.error("Workspace Change Role POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
