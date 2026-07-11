import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { runFormulaEngine, getRangeAndCriticalThresholds, determineFlag } from "@/lib/formulaEngine";

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
      // 1. Fetch testParameter and Parameter configurations for incoming manual results
      const testParamIds = resultsData.map(r => r.testParameterId);
      const testParameters = await tx.testParameter.findMany({
        where: { id: { in: testParamIds } },
        include: { parameter: true }
      });

      // 2. Upsert manual results with computed flags
      for (const res of resultsData) {
        const testParam = testParameters.find(tp => tp.id === res.testParameterId);
        let flag = null;
        if (testParam && testParam.parameter && res.value !== null && res.value !== undefined && res.value !== "") {
          const thresholds = getRangeAndCriticalThresholds(testParam.parameter, existing);
          flag = determineFlag(res.value, thresholds);
        }

        await tx.patientResult.upsert({
          where: {
            registrationId_testParameterId: {
              registrationId,
              testParameterId: res.testParameterId,
            },
          },
          update: {
            value: String(res.value),
            flag: flag
          },
          create: {
            registrationId,
            testParameterId: res.testParameterId,
            value: String(res.value),
            flag: flag
          },
        });
      }

      // 3. Update registration status
      await tx.registration.update({
        where: { id: registrationId },
        data: {
          remark: reportNotes || null,
          status: "Completed",
        },
      });
    }, { maxWait: 10000, timeout: 20000 });

    // 4. Run the LIMS formula engine to compute derived values
    await runFormulaEngine(registrationId);

    return NextResponse.json({ success: true, message: "Test results saved successfully." });
  } catch (error) {
    console.error("Workspace Registration Results POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
