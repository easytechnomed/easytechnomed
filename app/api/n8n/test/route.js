import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper to parse numeric floats safely, stripping accidental text/units
function parseNullableFloat(val) {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  // If string contains numbers, extract clean float (e.g., "< 150 mg/dL" -> 150, "13.5" -> 13.5)
  const cleaned = String(val).replace(/[^0-9.-]/g, "").trim();
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export async function GET(req) {
  try {
    return NextResponse.json({
      success: true,
      status: "n8n default tests sync API is active and ready.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    let rawText = await req.text().catch(() => "");
    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ success: false, error: "Empty request body." }, { status: 400 });
    }

    // Auto-strip markdown code fences (```json ... ```) if LLM returned raw text
    rawText = rawText.trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }

    let body;
    try {
      body = JSON.parse(rawText);
    } catch (parseErr) {
      return NextResponse.json(
        { success: false, error: `Invalid JSON format: ${parseErr.message}` },
        { status: 400 }
      );
    }

    // Support both a single test object and an array of test objects
    const testList = Array.isArray(body) ? body : [body];

    if (testList.length === 0) {
      return NextResponse.json(
        { success: false, error: "Payload array is empty." },
        { status: 400 }
      );
    }

    const results = [];

    for (const item of testList) {
      const testId = item.testId || item.id ? parseInt(item.testId || item.id, 10) : null;
      const rawTestName = item.testName || item.name;

      if (!testId && (!rawTestName || typeof rawTestName !== "string" || !rawTestName.trim())) {
        results.push({ success: false, error: "Neither testId nor valid testName was provided." });
        continue;
      }

      const testName = rawTestName ? rawTestName.trim() : null;
      const isProcessed = item.isProcessed !== undefined ? Boolean(item.isProcessed) : true;
      const departmentName = item.departmentName || item.department || null;
      const incomingParams = Array.isArray(item.parameters) ? item.parameters : [];

      // Execute in a transaction per test with safe timeout
      const processedTest = await prisma.$transaction(
        async (tx) => {
          // 1. Resolve Department if provided
          let deptId = null;
          if (departmentName && typeof departmentName === "string" && departmentName.trim()) {
            const cleanDept = departmentName.trim();
            const dept = await tx.testDepartment.upsert({
              where: { name: cleanDept },
              update: {},
              create: { name: cleanDept },
            });
            deptId = dept.id;
          }

          // 2. Find or create the default Test record (workspaceId: null)
          let testRecord = null;

          // Priority 1: Match by testId
          if (testId && !isNaN(testId)) {
            testRecord = await tx.test.findFirst({
              where: {
                id: testId,
                workspaceId: null,
                isDeleted: false,
              },
            });
          }

          // Priority 2: Match by exact or normalized testName
          if (!testRecord && testName) {
            testRecord = await tx.test.findFirst({
              where: {
                workspaceId: null,
                isDeleted: false,
                name: { equals: testName },
              },
            });
          }

          // Priority 3: Match by code
          if (!testRecord && item.code && typeof item.code === "string") {
            testRecord = await tx.test.findFirst({
              where: {
                workspaceId: null,
                isDeleted: false,
                code: item.code.trim().toUpperCase(),
              },
            });
          }

          // If still not found, create new default test with isProcessed = true (1)
          if (!testRecord) {
            testRecord = await tx.test.create({
              data: {
                name: testName || `Test ${Date.now()}`,
                code: item.code ? item.code.trim().toUpperCase() : null,
                price: item.price ? parseFloat(item.price) : 0.0,
                workspaceId: null,
                isProcessed: true,
                isDeleted: false,
                departmentId: deptId,
              },
            });
          } else {
            // Update existing test and guarantee isProcessed = true (1)
            testRecord = await tx.test.update({
              where: { id: testRecord.id },
              data: {
                isProcessed: true,
                ...(testName ? { name: testName } : {}),
                ...(item.code ? { code: item.code.trim().toUpperCase() } : {}),
                ...(item.price !== undefined ? { price: parseFloat(item.price) } : {}),
                ...(deptId ? { departmentId: deptId } : {}),
              },
            });
          }

          // 3. Fetch existing test parameters
          const existingTPs = await tx.testParameter.findMany({
            where: { testId: testRecord.id },
          });

          const activeTpIds = new Set();
          let lastHeaderTpId = null;

          // 4. Process incoming parameters in order
          for (let i = 0; i < incomingParams.length; i++) {
            const p = incomingParams[i];
            const paramName = (p.name || "").trim();
            if (!paramName) continue;

            const isHeader = Boolean(p.isHeader);
            const valueType = (p.valueType || (isHeader ? "OPTIONS" : "NUMERIC")).toUpperCase();
            const isNumeric = valueType === "NUMERIC";

            const minValMale = isNumeric ? parseNullableFloat(p.minValMale) : null;
            const maxValMale = isNumeric ? parseNullableFloat(p.maxValMale) : null;
            const minValFemale = isNumeric ? parseNullableFloat(p.minValFemale) : null;
            const maxValFemale = isNumeric ? parseNullableFloat(p.maxValFemale) : null;
            const minValBaby = isNumeric ? parseNullableFloat(p.minValBaby) : null;
            const maxValBaby = isNumeric ? parseNullableFloat(p.maxValBaby) : null;

            const paramData = {
              name: paramName,
              code: p.code ? p.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "") : null,
              unit: p.unit !== undefined && p.unit !== null ? p.unit.trim() : null,
              valueType: valueType,
              options: p.options ? p.options.trim() : null,
              minValMale,
              maxValMale,
              normalRangeMale: p.normalRangeMale ? p.normalRangeMale.trim() : null,
              minValFemale,
              maxValFemale,
              normalRangeFemale: p.normalRangeFemale ? p.normalRangeFemale.trim() : null,
              minValBaby,
              maxValBaby,
              normalRangeBaby: p.normalRangeBaby ? p.normalRangeBaby.trim() : null,
              normalRangeDefault: p.normalRangeDefault ? p.normalRangeDefault.trim() : null,
            };

            // Upsert master parameter dictionary record (workspaceId: null)
            let parameter = await tx.parameter.findFirst({
              where: {
                workspaceId: null,
                name: { equals: paramName },
              },
            });

            if (!parameter) {
              parameter = await tx.parameter.create({
                data: {
                  ...paramData,
                  workspaceId: null,
                },
              });
            } else {
              parameter = await tx.parameter.update({
                where: { id: parameter.id },
                data: paramData,
              });
            }

            // Link in TestParameter table
            const order = p.order !== undefined && !isNaN(parseInt(p.order, 10)) ? parseInt(p.order, 10) : i + 1;
            const parentId = isHeader ? null : (p.parentId !== undefined ? p.parentId : lastHeaderTpId);

            let tp = existingTPs.find((x) => x.parameterId === parameter.id);

            const tpData = {
              order: order,
              isHeader: isHeader,
              parentId: parentId,
              unit: p.unit !== undefined && p.unit !== null ? p.unit.trim() : null,
              valueType: valueType,
              options: p.options ? p.options.trim() : null,
              isDeleted: false,
              deletedAt: null,
              workspaceId: null,
            };

            if (tp) {
              tp = await tx.testParameter.update({
                where: { id: tp.id },
                data: tpData,
              });
            } else {
              tp = await tx.testParameter.create({
                data: {
                  testId: testRecord.id,
                  parameterId: parameter.id,
                  ...tpData,
                },
              });
            }

            activeTpIds.add(tp.id);

            if (isHeader) {
              lastHeaderTpId = tp.id;
            }
          }

          // 5. Soft-delete old parameters not in the incoming payload
          const toDeleteIds = existingTPs
            .filter((x) => !activeTpIds.has(x.id) && !x.isDeleted)
            .map((x) => x.id);

          if (toDeleteIds.length > 0) {
            await tx.testParameter.updateMany({
              where: { id: { in: toDeleteIds } },
              data: {
                isDeleted: true,
                deletedAt: new Date(),
              },
            });
          }

          return {
            id: testRecord.id,
            name: testRecord.name,
            code: testRecord.code,
            isProcessed: testRecord.isProcessed,
            parametersCount: activeTpIds.size,
          };
        },
        {
          maxWait: 15000,
          timeout: 45000,
        }
      );

      results.push({ success: true, test: processedTest });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.filter((r) => r.success).length} of ${testList.length} test(s) successfully.`,
      results,
    });
  } catch (error) {
    console.error("n8n Open API Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
