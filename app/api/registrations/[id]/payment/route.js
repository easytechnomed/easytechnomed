import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin("admin:write");
    const { id } = await params;
    const regId = parseInt(id);
    const body = await req.json().catch(() => ({}));

    if (isNaN(regId)) {
      return NextResponse.json({ success: false, error: "Invalid registration ID" }, { status: 400 });
    }

    const { received, discountPercent, discountAmount, paymentMode, paymentRefNo, remark } = body;

    const existing = await prisma.registration.findFirst({
      where: { id: regId, workspaceId: admin.workspaceId, isDeleted: false },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Registration not found or unauthorized." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create a payment chunk if received amount is positive
      if (received && parseFloat(received) > 0) {
        await tx.registrationPayment.create({
          data: {
            registrationId: regId,
            amount: parseFloat(received),
            paymentMode: paymentMode || "Cash",
            paymentRefNo: paymentRefNo || null,
            remark: remark || "Chunk Payment",
          },
        });
      }

      // 2. Fetch the sum of all payments for this registration
      const paymentsSum = await tx.registrationPayment.aggregate({
        where: { registrationId: regId },
        _sum: { amount: true },
      });

      const totalReceived = parseFloat(paymentsSum._sum.amount || 0);
      const totalAmountVal = parseFloat(existing.totalAmount);
      const discAmtVal = parseFloat(discountAmount || 0);
      const newDue = Math.max(0, totalAmountVal - discAmtVal - totalReceived);

      // 3. Update the main registration record
      const updatedRegistration = await tx.registration.update({
        where: { id: regId },
        data: {
          discountPercent: discountPercent ? parseFloat(discountPercent) : 0,
          discountAmount: discAmtVal,
          receivedAmount: totalReceived,
          dueAmount: newDue,
          paymentMode: paymentMode || "Cash",
          paymentRefNo: paymentRefNo || null,
          remark: remark || null,
          status: newDue > 0 ? "Pending" : "Completed",
        },
      });

      return updatedRegistration;
    });

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully!",
      registration: result,
    });
  } catch (error) {
    console.error("Workspace Registration Payment POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
