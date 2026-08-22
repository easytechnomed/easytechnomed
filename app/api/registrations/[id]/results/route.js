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
    const { resultsData = [], reportNotes, isDraft = false, status } = body;

    if (isNaN(registrationId)) {
      return NextResponse.json({ success: false, error: "Invalid registration ID" }, { status: 400 });
    }

    const existing = await prisma.registration.findFirst({
      where: { id: registrationId, workspaceId: admin.workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Registration not found or unauthorized." }, { status: 404 });
    }

    let finalStatus = "Completed";

    await prisma.$transaction(async (tx) => {
      // 1. Fetch testParameter and Parameter configurations for incoming manual results
      const testParamIds = resultsData.map(r => r.testParameterId);
      const testParameters = await tx.testParameter.findMany({
        where: { id: { in: testParamIds } },
        include: { parameter: true }
      });

      // 2. Upsert manual results with computed flags in parallel
      const upsertPromises = resultsData.map((res) => {
        const testParam = testParameters.find(tp => tp.id === res.testParameterId);
        let flag = null;
        if (testParam && testParam.parameter && res.value !== null && res.value !== undefined && res.value !== "") {
          const mergedParam = {
            ...testParam.parameter,
            valueType: testParam.valueType || testParam.parameter.valueType || "NUMERIC",
            options: testParam.options || testParam.parameter.options || null,
          };
          const thresholds = getRangeAndCriticalThresholds(mergedParam, existing);
          flag = determineFlag(res.value, thresholds);
        }

        return tx.patientResult.upsert({
          where: {
            registrationId_testParameterId: {
              registrationId,
              testParameterId: res.testParameterId,
            },
          },
          update: {
            value: String(res.value ?? ""),
            flag: flag
          },
          create: {
            registrationId,
            testParameterId: res.testParameterId,
            value: String(res.value ?? ""),
            flag: flag
          },
        });
      });

      await Promise.all(upsertPromises);

      // 3. Update registration status (keep existing status or "Pending" if draft, else "Completed")
      finalStatus = isDraft
        ? (existing.status === "Completed" ? "Completed" : (status || "Pending"))
        : (status || "Completed");

      await tx.registration.update({
        where: { id: registrationId },
        data: {
          remark: reportNotes !== undefined ? (reportNotes || null) : existing.remark,
          status: finalStatus,
        },
      });
    }, { maxWait: 20000, timeout: 60000 });

    // 4. Run the LIMS formula engine to compute derived values
    await runFormulaEngine(registrationId);

    return NextResponse.json({
      success: true,
      isDraft: Boolean(isDraft),
      status: finalStatus,
      message: isDraft ? "Draft saved successfully." : "Test results saved and completed successfully."
    });
  } catch (error) {
    console.error("Workspace Registration Results POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
