import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function PUT(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const adminId = parseInt(id, 10);

    if (isNaN(adminId)) {
      return NextResponse.json({ success: false, error: "Invalid admin ID." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const days = parseInt(body.days, 10);

    if (isNaN(days) || days <= 0) {
      return NextResponse.json({ success: false, error: "Please enter a valid number of days (greater than 0)." }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      include: {
        workspace: true,
        role: { select: { id: true, name: true } },
      },
    });

    if (!admin) {
      return NextResponse.json({ success: false, error: "Admin account not found." }, { status: 404 });
    }

    const now = new Date();
    // If workspace already has an active future expiry date, extend from that date; otherwise extend from now
    let baseDate = now;
    if (admin.workspace?.expireAt && new Date(admin.workspace.expireAt) > now) {
      baseDate = new Date(admin.workspace.expireAt);
    }

    const newExpireAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    if (admin.workspaceId) {
      await prisma.workspace.update({
        where: { id: admin.workspaceId },
        data: {
          expireAt: newExpireAt,
          isActive: true,
        },
      });
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: {
        isActive: true, // Automatically ensure admin is active on renewal
      },
      include: {
        workspace: { select: { id: true, name: true, expireAt: true, isActive: true } },
        role: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Plan renewed successfully! Workspace extended by ${days} days until ${newExpireAt.toLocaleDateString("en-IN")}.`,
      admin: {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        mobileNumber: updatedAdmin.mobileNumber || "",
        isActive: updatedAdmin.isActive,
        isApproved: updatedAdmin.isApproved,
        expireAt: newExpireAt.toISOString(),
        role: updatedAdmin.role,
        workspace: updatedAdmin.workspace,
      },
    });
  } catch (error) {
    console.error("SuperAdmin Admin Renew Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
