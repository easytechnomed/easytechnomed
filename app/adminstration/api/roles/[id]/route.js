import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function DELETE(req, { params }) {
  try {
    await verifySuperAdminAPI();
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
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function PUT(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json({ success: false, error: "Invalid role ID" }, { status: 400 });
    }

    if (roleId === 1) {
      return NextResponse.json({ success: false, error: "Cannot modify the system default Admin role." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const name = body.name?.trim();
    const permissions = body.permissions || [];

    if (!name) {
      return NextResponse.json({ success: false, error: "Role name is required." }, { status: 400 });
    }

    // Check if name is taken by another role
    const existing = await prisma.adminRole.findFirst({
      where: {
        name,
        isDeleted: false,
        id: { not: roleId }
      }
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "A role with this name already exists." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Update role name
      await tx.adminRole.update({
        where: { id: roleId },
        data: { name }
      });

      // Clear existing permissions
      await tx.adminRolePermission.deleteMany({
        where: { roleId }
      });

      // Add new permissions
      if (permissions.length > 0) {
        await tx.adminRolePermission.createMany({
          data: permissions.map((perm) => ({
            roleId,
            permission: perm,
          })),
        });
      }
    });

    return NextResponse.json({ success: true, message: "Role updated successfully!" });
  } catch (error) {
    console.error("SuperAdmin Role PUT Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
