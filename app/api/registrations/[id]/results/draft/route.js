import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin("REGISTRATION_WRITE");
    const { id } = await params;
    const registrationId = parseInt(id);
    const body = await req.json().catch(() => ({}));
    const { resultsData = [], reportNotes } = body;

    if (isNaN(registrationId)) {
      return NextResponse.json({ success: false, error: "Invalid registration ID" }, { status: 400 });
    }

    const existing = await prisma.registration.findFirst({
      where: { id: registrationId, workspaceId: admin.workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Registration not found or unauthorized." }, { status: 404 });
    }

    const validResults = (resultsData || []).filter(
      (r) => r && r.testParameterId && !isNaN(parseInt(r.testParameterId)) && parseInt(r.testParameterId) > 0
    );

    // Prepare pure Prisma batch operations for draft values
    const operations = validResults.map((r) => {
      const paramIdInt = parseInt(r.testParameterId);
      return prisma.patientResult.upsert({
        where: {
          registrationId_testParameterId: {
            registrationId,
            testParameterId: paramIdInt,
          },
        },
        update: {
          value: String(r.value ?? ""),
        },
        create: {
          registrationId,
          testParameterId: paramIdInt,
          value: String(r.value ?? ""),
        },
      });
    });

    if (reportNotes !== undefined) {
      operations.push(
        prisma.registration.update({
          where: { id: registrationId },
          data: { remark: reportNotes || null },
        })
      );
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }

    return NextResponse.json({
      success: true,
      isDraft: true,
      message: "Draft saved successfully.",
    });
  } catch (error) {
    console.error("Workspace Registration Draft Save POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
