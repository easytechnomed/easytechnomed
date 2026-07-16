import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const admin = await requireAdmin("MEMBER_READ");
    const members = await prisma.admin.findMany({
      where: { workspaceId: admin.workspaceId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        isApproved: true,
        isEmailVerified: true,
        createdAt: true,
        role: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const mapped = members.map((m) => ({
      ...m,
      roleName: m.role?.name || "Admin",
    }));
    return NextResponse.json({ success: true, members: mapped });
  } catch (error) {
    console.error("Workspace Members GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin("MEMBER_WRITE");
    const body = await req.json().catch(() => ({}));

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const roleId = parseInt(body.roleId) || 1;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "All fields are required." });
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      return NextResponse.json({ success: false, error: "Email is already in use by another admin." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        workspaceId: admin.workspaceId,
        roleId,
        isEmailVerified: true,
        isApproved: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, message: "Member added successfully!" });
  } catch (error) {
    console.error("Workspace Members POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const admin = await requireAdmin("MEMBER_WRITE");
    const body = await req.json().catch(() => ({}));

    const memberId = parseInt(body.memberId);
    const isActive = body.isActive === true;

    if (isNaN(memberId)) {
      return NextResponse.json({ success: false, error: "Invalid or missing Member ID." });
    }

    // make sure admin itself can't activate/deactivate themselves
    if (memberId === admin.id) {
      return NextResponse.json({ success: false, error: "You cannot change your own active status." });
    }

    // find the member to make sure they belong to the same workspace
    const member = await prisma.admin.findFirst({
      where: { id: memberId, workspaceId: admin.workspaceId }
    });

    if (!member) {
      return NextResponse.json({ success: false, error: "Member not found in your workspace." });
    }

    // update active status
    await prisma.admin.update({
      where: { id: memberId },
      data: { isActive }
    });

    // If changing active to inactive, instantly expire/delete all sessions for this user
    if (!isActive) {
      await prisma.adminSession.deleteMany({
        where: { adminId: memberId }
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: `Member status updated to ${isActive ? "Active" : "Disabled"}.`
    });
  } catch (error) {
    console.error("Workspace Members PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
