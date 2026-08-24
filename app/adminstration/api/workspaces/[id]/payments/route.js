import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";
import { encodePaymentUid } from "@/lib/saasInvoice";

export async function GET(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const workspaceId = parseInt(id, 10);

    if (isNaN(workspaceId)) {
      return NextResponse.json({ success: false, error: "Invalid workspace ID." }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        expireAt: true,
        isActive: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found." }, { status: 404 });
    }

    const payments = await prisma.workspacePayment.findMany({
      where: { workspaceId },
      orderBy: { paidAt: "desc" },
    });

    const serializedPayments = payments.map((p) => ({
      id: p.id,
      uid: encodePaymentUid(p.id),
      amount: Number(p.amount),
      days: p.days,
      paymentMode: p.paymentMode,
      referenceNo: p.referenceNo || "—",
      notes: p.notes || "—",
      paidAt: p.paidAt.toISOString(),
      startAt: p.startAt ? p.startAt.toISOString() : null,
      expireAt: p.expireAt ? p.expireAt.toISOString() : null,
    }));

    return NextResponse.json({
      success: true,
      workspace,
      payments: serializedPayments,
      totalPaid: serializedPayments.reduce((sum, p) => sum + p.amount, 0),
    });
  } catch (error) {
    console.error("SuperAdmin Workspace Payments GET Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
