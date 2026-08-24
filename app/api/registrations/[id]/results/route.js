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
    const { resultsData = [], reportNotes, status } = body;

    if (isNaN(registrationId)) {
      return NextResponse.json({ success: false, error: "Invalid registration ID" }, { status: 400 });
    }

    const existing = await prisma.registration.findFirst({
      where: { id: registrationId, workspaceId: admin.workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Registration not found or unauthorized." }, { status: 404 });
    }

    // Deduplicate validResults by testParameterId (taking the latest value)
    const uniqueResultsMap = new Map();
    (resultsData || []).forEach((r) => {
      if (r && r.testParameterId && !isNaN(parseInt(r.testParameterId)) && parseInt(r.testParameterId) > 0) {
        uniqueResultsMap.set(parseInt(r.testParameterId), r);
      }
    });
    const validResults = Array.from(uniqueResultsMap.values());

    // 1. Fetch test parameter configurations to evaluate thresholds and flags
    const testParamIds = validResults.map((r) => parseInt(r.testParameterId));
    const testParameters = await prisma.testParameter.findMany({
      where: { id: { in: testParamIds } },
      include: { parameter: true },
    });

    // 2. Prepare batch upsert operations with evaluated flags
    const operations = validResults.map((res) => {
      const paramIdInt = parseInt(res.testParameterId);
      const testParam = testParameters.find((tp) => tp.id === paramIdInt);
      let flag = null;
      if (testParam && testParam.parameter && res.value !== null && res.value !== undefined && String(res.value).trim() !== "") {
        const mergedParam = {
          ...testParam.parameter,
          valueType: testParam.valueType || testParam.parameter.valueType || "NUMERIC",
          options: testParam.options || testParam.parameter.options || null,
        };
        const thresholds = getRangeAndCriticalThresholds(mergedParam, existing);
        flag = determineFlag(res.value, thresholds);
      }

      return prisma.patientResult.upsert({
        where: {
          registrationId_testParameterId: {
            registrationId,
            testParameterId: paramIdInt,
          },
        },
        update: {
          value: String(res.value ?? ""),
          flag: flag,
        },
        create: {
          registrationId,
          testParameterId: paramIdInt,
          value: String(res.value ?? ""),
          flag: flag,
        },
      });
    });

    const finalStatus = status || "Completed";
    const reportedAtVal = finalStatus === "Completed" ? (existing.reportedAt || new Date()) : existing.reportedAt;
    operations.push(
      prisma.registration.update({
        where: { id: registrationId },
        data: {
          remark: reportNotes !== undefined ? (reportNotes || null) : existing.remark,
          status: finalStatus,
          reportedAt: reportedAtVal,
        },
      })
    );

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }

    // 3. Run LIMS formula engine to compute derived values
    await runFormulaEngine(registrationId);

    return NextResponse.json({
      success: true,
      status: finalStatus,
      message: "Test results saved and completed successfully.",
    });
  } catch (error) {
    console.error("Workspace Registration Results POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
