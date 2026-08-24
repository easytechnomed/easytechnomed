import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";
import { encodePaymentUid } from "@/lib/saasInvoice";

export async function PUT(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const workspaceId = parseInt(id, 10);

    if (isNaN(workspaceId)) {
      return NextResponse.json({ success: false, error: "Invalid workspace ID." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const days = parseInt(body.days, 10);

    if (isNaN(days) || days <= 0) {
      return NextResponse.json({ success: false, error: "Please enter a valid number of days (greater than 0)." }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        admins: { select: { id: true, name: true, email: true, isActive: true } }
      }
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found." }, { status: 404 });
    }

    const now = new Date();
    // If workspace already has an active future expiry date, extend from that date; otherwise extend from now
    let baseDate = now;
    if (workspace.expireAt) {
      const currentExp = new Date(workspace.expireAt);
      if (!isNaN(currentExp.getTime()) && currentExp > now) {
        baseDate = currentExp;
      }
    }

    const newExpireAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    const paymentAmount = !isNaN(parseFloat(body.amount)) ? parseFloat(body.amount) : 0;
    const originalPrice = !isNaN(parseFloat(body.originalPrice)) && parseFloat(body.originalPrice) > 0
      ? parseFloat(body.originalPrice)
      : paymentAmount > 0 ? paymentAmount : 0;
    const discount = originalPrice > paymentAmount ? originalPrice - paymentAmount : 0;

    const paymentMode = body.paymentMode || "Cash";
    const referenceNo = body.referenceNo?.trim() || null;
    let notes = body.notes?.trim() || null;

    if (originalPrice > 0 && discount > 0) {
      const discountTag = `[MRP:₹${originalPrice}|DISC:₹${discount}]`;
      notes = notes ? `${notes} ${discountTag}` : discountTag;
    }

    const [updatedWorkspace, paymentRecord] = await prisma.$transaction([
      prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          expireAt: newExpireAt,
          isActive: true,
        },
        include: {
          admins: { select: { id: true, name: true, email: true, isActive: true } },
        },
      }),
      prisma.workspacePayment.create({
        data: {
          workspaceId,
          days,
          amount: paymentAmount,
          paymentMode,
          referenceNo,
          notes,
          paidAt: new Date(),
          startAt: baseDate,
          expireAt: newExpireAt,
        },
      }),
      prisma.admin.updateMany({
        where: { workspaceId },
        data: {
          isActive: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Plan renewed successfully! Extended by ${days} days until ${newExpireAt.toLocaleDateString("en-IN")}${
        paymentAmount > 0 ? ` with payment of ₹${paymentAmount.toLocaleString("en-IN")}` : ""
      }.`,
      workspace: {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        slug: updatedWorkspace.slug,
        isActive: updatedWorkspace.isActive,
        expireAt: updatedWorkspace.expireAt ? updatedWorkspace.expireAt.toISOString() : null,
        startAt: updatedWorkspace.startAt ? updatedWorkspace.startAt.toISOString() : null,
        admins: updatedWorkspace.admins,
      },
      payment: {
        id: paymentRecord.id,
        uid: encodePaymentUid(paymentRecord.id),
        amount: Number(paymentRecord.amount),
        days: paymentRecord.days,
        paymentMode: paymentRecord.paymentMode,
        referenceNo: paymentRecord.referenceNo,
        paidAt: paymentRecord.paidAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("SuperAdmin Workspace Renew Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
