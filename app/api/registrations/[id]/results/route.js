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
      // 1. Fetch testParameter configurations and existing patient results
      const testParamIds = resultsData.map(r => r.testParameterId);
      const [testParameters, existingPatientResults] = await Promise.all([
        tx.testParameter.findMany({
          where: { id: { in: testParamIds } },
          include: { parameter: true }
        }),
        tx.patientResult.findMany({
          where: { registrationId },
          select: { id: true, testParameterId: true }
        })
      ]);

      const resultMap = new Map(existingPatientResults.map(r => [r.testParameterId, r.id]));

      // 2. Perform direct update (by PK ID) or create to prevent MySQL InnoDB gap locks
      for (const res of resultsData) {
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

        const existingResultId = resultMap.get(res.testParameterId);
        if (existingResultId) {
          await tx.patientResult.update({
            where: { id: existingResultId },
            data: {
              value: String(res.value ?? ""),
              flag: flag
            }
          });
        } else {
          const created = await tx.patientResult.create({
            data: {
              registrationId,
              testParameterId: res.testParameterId,
              value: String(res.value ?? ""),
              flag: flag
            }
          });
          resultMap.set(res.testParameterId, created.id);
        }
      }

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
