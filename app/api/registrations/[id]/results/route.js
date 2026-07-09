import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin("REGISTRATION_WRITE");
    const { id } = await params;
    const registrationId = parseInt(id);
    const body = await req.json().catch(() => ({}));
    const { resultsData, reportNotes } = body;

    if (isNaN(registrationId)) {
      return NextResponse.json({ success: false, error: "Invalid registration ID" }, { status: 400 });
    }

    const existing = await prisma.registration.findFirst({
      where: { id: registrationId, workspaceId: admin.workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Registration not found or unauthorized." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      for (const res of resultsData) {
        await tx.patientResult.upsert({
          where: {
            registrationId_testParameterId: {
              registrationId,
              testParameterId: res.testParameterId,
            },
          },
          update: { value: String(res.value) },
          create: {
            registrationId,
            testParameterId: res.testParameterId,
            value: String(res.value),
          },
        });
      }

      await tx.registration.update({
        where: { id: registrationId },
        data: {
          remark: reportNotes || null,
          status: "Completed",
        },
      });
    });

    return NextResponse.json({ success: true, message: "Test results saved successfully." });
  } catch (error) {
    console.error("Workspace Registration Results POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
