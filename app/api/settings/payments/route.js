import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { encodePaymentUid } from "@/lib/saasInvoice";

export async function GET() {
  try {
    const admin = await requireAdmin("SETTINGS_READ");

    if (!admin.workspaceId) {
      return NextResponse.json({
        success: false,
        error: "No workspace associated with your account.",
      }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: admin.workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        expireAt: true,
        startAt: true,
        isActive: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({
        success: false,
        error: "Workspace not found.",
      }, { status: 404 });
    }

    const payments = await prisma.workspacePayment.findMany({
      where: { workspaceId: admin.workspaceId },
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

    const totalPaid = serializedPayments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      workspace,
      payments: serializedPayments,
      totalPaid,
    });
  } catch (error) {
    if (
      error.message === "NEXT_REDIRECT" ||
      (error.digest && error.digest.startsWith("NEXT_REDIRECT"))
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Workspace Customer Payments GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message, message: error.message },
      { status: 500 }
    );
  }
}
