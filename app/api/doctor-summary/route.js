import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Helper to serialize Decimal and Dates
function serializeData(data) {
  return JSON.parse(JSON.stringify(data));
}

export async function GET(req) {
  try {
    const admin = await requireAdmin("DOCTOR_READ");
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const regDateFilter = {};
    if (startDate) regDateFilter.gte = new Date(startDate);
    if (endDate) regDateFilter.lte = new Date(endDate);
    const hasDateFilter = startDate || endDate;

    const doctors = await prisma.doctor.findMany({
      where: { workspaceId: admin.workspaceId },
      orderBy: { name: "asc" },
    });

    const summary = [];
    for (const doc of doctors) {
      const whereClause = {
        refById: doc.id,
        workspaceId: admin.workspaceId,
        isDeleted: false,
        status: "Completed",
        dueAmount: { lte: 0 },
      };
      if (hasDateFilter) whereClause.date = regDateFilter;

      const regs = await prisma.registration.findMany({
        where: whereClause,
        include: {
          tests: {
            include: {
              test: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  price: true,
                },
              },
            },
          },
        },
        orderBy: { date: "desc" },
      });
      if (regs.length === 0 && hasDateFilter) continue;

      const count = regs.length;
      const totalAmount = regs.reduce((sum, r) => sum + Number(r.totalAmount), 0);
      const totalDiscount = regs.reduce((sum, r) => sum + Number(r.discountAmount), 0);
      const netAmount = totalAmount - totalDiscount;
      const collection = regs.reduce((sum, r) => sum + Number(r.receivedAmount), 0);
      const incentivePercent = Number(doc.incentivePercent) || 0;

      let totalIncentiveAmount = 0;
      const registrations = regs.map((r) => {
        const total = Number(r.totalAmount) || 0;
        const discount = Number(r.discountAmount) || 0;
        const net = total - discount;
        const pct =
          r.refByIncentivePercent !== null && r.refByIncentivePercent !== undefined
            ? Number(r.refByIncentivePercent)
            : incentivePercent;
        const incentive = (net * pct) / 100;
        totalIncentiveAmount += incentive;
        const received = Number(r.receivedAmount) || 0;
        const due = Number(r.dueAmount) || 0;

        return {
          id: r.id,
          regNo: r.regNo,
          labId: r.labId,
          date: r.date ? r.date.toISOString() : null,
          title: r.title || "",
          name: r.name || "",
          fullName: `${r.title ? r.title + " " : ""}${r.name || ""}`.trim(),
          age: r.age,
          ageUnit: r.ageUnit || "Year",
          gender: r.gender,
          mobileNo: r.mobileNo,
          status: r.status,
          totalAmount: total,
          discountAmount: discount,
          discountPercent: Number(r.discountPercent) || 0,
          netAmount: net,
          receivedAmount: received,
          dueAmount: due,
          incentivePercent: pct,
          incentiveAmount: incentive,
          tests: (r.tests || []).map((t) => ({
            testId: t.testId,
            name: t.test?.name || "Test",
            code: t.test?.code || "",
            price: Number(t.price) || 0,
          })),
        };
      });

      summary.push({
        id: doc.id,
        name: doc.name,
        code: doc.code || String(doc.id),
        incentivePercent,
        incentiveAmount: totalIncentiveAmount,
        lastPaid: doc.lastPaid ? doc.lastPaid.toISOString() : null,
        count,
        amount: totalAmount,
        discount: totalDiscount,
        netAmount,
        collection,
        registrations,
      });
    }

    return NextResponse.json({ success: true, summary: serializeData(summary) });
  } catch (error) {
    console.error("Workspace Doctor Summary GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
