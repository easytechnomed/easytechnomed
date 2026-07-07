import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireSuperAdmin();

    const roles = await prisma.adminRole.findMany({
      where: { isDeleted: false },
      include: {
        permissions: true,
      },
      orderBy: { id: "asc" },
    });

    const serializedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      permissions: role.permissions.map((p) => p.permission),
    }));

    return NextResponse.json({ success: true, roles: serializedRoles });
  } catch (error) {
    console.error("SuperAdmin Roles GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await requireSuperAdmin();
    const body = await req.json().catch(() => ({}));

    const name = body.name?.trim();
    const permissions = body.permissions || [];

    if (!name) {
      return NextResponse.json({ success: false, error: "Role name is required." });
    }

    const existing = await prisma.adminRole.findFirst({ where: { name, isDeleted: false } });
    if (existing) {
      return NextResponse.json({ success: false, error: "A role with this name already exists." });
    }

    await prisma.$transaction(async (tx) => {
      const role = await tx.adminRole.create({ data: { name } });
      if (permissions.length > 0) {
        await tx.adminRolePermission.createMany({
          data: permissions.map((perm) => ({
            roleId: role.id,
            permission: perm,
          })),
        });
      }
    });

    return NextResponse.json({ success: true, message: "Role created successfully!" });
  } catch (error) {
    console.error("SuperAdmin Roles POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
