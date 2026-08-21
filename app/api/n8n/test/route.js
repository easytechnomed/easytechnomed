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

// Helper to safely parse strings from strings/numbers/arrays
function parseNullableString(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(val)) {
    const list = val.map((x) => (x !== null && x !== undefined ? String(x).trim() : "")).filter(Boolean);
    return list.length > 0 ? list.join(", ") : null;
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return String(val).trim();
  }
  return null;
}

// Helper to safely format options list (array of strings or comma-separated string)
function parseNullableOptions(val) {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) {
    const list = val.map((x) => (x !== null && x !== undefined ? String(x).trim() : "")).filter(Boolean);
    return list.length > 0 ? list.join(", ") : null;
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return String(val).trim();
  }
  return null;
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

      const testName = rawTestName ? String(rawTestName).trim() : null;
      const isProcessed = item.isProcessed !== undefined ? Boolean(item.isProcessed) : true;
      const departmentName = parseNullableString(item.departmentName || item.department);
      const incomingParams = Array.isArray(item.parameters) ? item.parameters : [];

      // Execute in a transaction per test with safe timeout
      const processedTest = await prisma.$transaction(
        async (tx) => {
          // 1. Resolve Department if provided
          let deptId = null;
          if (departmentName) {
            const cleanDept = departmentName;
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
                code: item.code ? String(item.code).trim().toUpperCase() : null,
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
                ...(item.code ? { code: String(item.code).trim().toUpperCase() } : {}),
                ...(item.price !== undefined ? { price: parseFloat(item.price) } : {}),
                ...(deptId ? { departmentId: deptId } : {}),
              },
            });
          }

          // 3. Fetch existing test parameters & formulas
          const existingTPs = await tx.testParameter.findMany({
            where: { testId: testRecord.id },
          });

          const activeTpIds = new Set();
          const headerTpMapByName = new Map();
          const headerTpMapByCode = new Map();
          const headerTpMapByOrder = new Map();
          let currentSectionHeaderTpId = null;

          const paramNameToId = new Map();
          const paramCodeToId = new Map();
          const inlineFormulas = [];
          const resolvedParamsList = [];

          // 4. Upsert Parameter master records and parse incoming data
          for (let i = 0; i < incomingParams.length; i++) {
            const p = incomingParams[i];
            const paramName = parseNullableString(p.name);
            if (!paramName) continue;

            const isHeader = Boolean(p.isHeader);
            const rawValueType = parseNullableString(p.valueType);
            const valueType = (rawValueType || (isHeader ? "OPTIONS" : "NUMERIC")).toUpperCase();
            const isNumeric = valueType === "NUMERIC";

            const minValMale = isNumeric ? parseNullableFloat(p.minValMale) : null;
            const maxValMale = isNumeric ? parseNullableFloat(p.maxValMale) : null;
            const minValFemale = isNumeric ? parseNullableFloat(p.minValFemale) : null;
            const maxValFemale = isNumeric ? parseNullableFloat(p.maxValFemale) : null;
            const minValBaby = isNumeric ? parseNullableFloat(p.minValBaby) : null;
            const maxValBaby = isNumeric ? parseNullableFloat(p.maxValBaby) : null;

            const optionsVal = parseNullableOptions(p.options);
            const unitVal = parseNullableString(p.unit);
            const isCalculated = Boolean(p.isCalculated || p.formula || p.calculationFormula);
            const decimalPlace = p.decimalPlace !== undefined && !isNaN(parseInt(p.decimalPlace, 10)) ? parseInt(p.decimalPlace, 10) : 2;
            const roundingMethod = parseNullableString(p.roundingMethod) || "HALF_UP";
            const section = parseNullableString(p.section);

            const paramCode = p.code ? String(p.code).trim().toUpperCase().replace(/[^A-Z0-9_]/g, "") : null;

            const paramData = {
              name: paramName,
              code: paramCode,
              unit: unitVal,
              valueType: valueType,
              options: optionsVal,
              minValMale,
              maxValMale,
              normalRangeMale: parseNullableString(p.normalRangeMale),
              minValFemale,
              maxValFemale,
              normalRangeFemale: parseNullableString(p.normalRangeFemale),
              minValBaby,
              maxValBaby,
              normalRangeBaby: parseNullableString(p.normalRangeBaby),
              normalRangeDefault: parseNullableString(p.normalRangeDefault),
              criticalMinValMale: isNumeric ? parseNullableFloat(p.criticalMinValMale) : null,
              criticalMaxValMale: isNumeric ? parseNullableFloat(p.criticalMaxValMale) : null,
              criticalMinValFemale: isNumeric ? parseNullableFloat(p.criticalMinValFemale) : null,
              criticalMaxValFemale: isNumeric ? parseNullableFloat(p.criticalMaxValFemale) : null,
              criticalMinValBaby: isNumeric ? parseNullableFloat(p.criticalMinValBaby) : null,
              criticalMaxValBaby: isNumeric ? parseNullableFloat(p.criticalMaxValBaby) : null,
              criticalMinValDefault: isNumeric ? parseNullableFloat(p.criticalMinValDefault) : null,
              criticalMaxValDefault: isNumeric ? parseNullableFloat(p.criticalMaxValDefault) : null,
              borderlineMinValMale: isNumeric ? parseNullableFloat(p.borderlineMinValMale) : null,
              borderlineMaxValMale: isNumeric ? parseNullableFloat(p.borderlineMaxValMale) : null,
              borderlineMinValFemale: isNumeric ? parseNullableFloat(p.borderlineMinValFemale) : null,
              borderlineMaxValFemale: isNumeric ? parseNullableFloat(p.borderlineMaxValFemale) : null,
              borderlineMinValBaby: isNumeric ? parseNullableFloat(p.borderlineMinValBaby) : null,
              borderlineMaxValBaby: isNumeric ? parseNullableFloat(p.borderlineMaxValBaby) : null,
              borderlineMinValDefault: isNumeric ? parseNullableFloat(p.borderlineMinValDefault) : null,
              borderlineMaxValDefault: isNumeric ? parseNullableFloat(p.borderlineMaxValDefault) : null,
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

            paramNameToId.set(paramName.toLowerCase(), parameter.id);
            if (paramCode) {
              paramCodeToId.set(paramCode.toUpperCase(), parameter.id);
            }

            const order = p.order !== undefined && !isNaN(parseInt(p.order, 10)) ? parseInt(p.order, 10) : i + 1;

            // Check if inline formula is defined on the parameter
            const inlineFormulaExpr = parseNullableString(p.formula || p.calculationFormula);
            if (inlineFormulaExpr) {
              inlineFormulas.push({
                outputParameterId: parameter.id,
                formula: inlineFormulaExpr,
                name: parseNullableString(p.formulaName),
                description: parseNullableString(p.formulaDescription),
              });
            }

            resolvedParamsList.push({
              raw: p,
              parameter,
              paramName,
              paramCode,
              order,
              isHeader,
              unitVal,
              valueType,
              optionsVal,
              isCalculated,
              decimalPlace,
              roundingMethod,
              section,
            });
          }

          // Step 4A: Upsert Headers first to obtain their TestParameter IDs
          for (const itemP of resolvedParamsList) {
            if (!itemP.isHeader) continue;

            let tp = existingTPs.find((x) => x.parameterId === itemP.parameter.id);
            const tpData = {
              order: itemP.order,
              isHeader: true,
              parentId: null,
              unit: itemP.unitVal,
              valueType: itemP.valueType,
              options: itemP.optionsVal,
              isCalculated: itemP.isCalculated,
              decimalPlace: itemP.decimalPlace,
              roundingMethod: itemP.roundingMethod,
              section: itemP.section,
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
                  parameterId: itemP.parameter.id,
                  ...tpData,
                },
              });
            }

            activeTpIds.add(tp.id);
            headerTpMapByName.set(itemP.paramName.toLowerCase(), tp.id);
            if (itemP.paramCode) {
              headerTpMapByCode.set(itemP.paramCode.toUpperCase(), tp.id);
            }
            headerTpMapByOrder.set(itemP.order, tp.id);
          }

          // Step 4B: Upsert Children and link parentId
          for (const itemP of resolvedParamsList) {
            if (itemP.isHeader) {
              currentSectionHeaderTpId = headerTpMapByName.get(itemP.paramName.toLowerCase()) || null;
              continue;
            }

            const p = itemP.raw;
            let resolvedParentId = null;

            // 1. Explicit parent header name
            const parentHeaderName = parseNullableString(p.parentHeaderName || p.parentHeader || p.parentSection || (typeof p.parentId === "string" ? p.parentId : null));
            if (parentHeaderName && headerTpMapByName.has(parentHeaderName.toLowerCase())) {
              resolvedParentId = headerTpMapByName.get(parentHeaderName.toLowerCase());
            }

            // 2. Explicit parent order
            if (!resolvedParentId && (p.parentOrder !== undefined || (typeof p.parentId === "number" && !isNaN(p.parentId)))) {
              const pOrder = p.parentOrder !== undefined ? parseInt(p.parentOrder, 10) : parseInt(p.parentId, 10);
              if (headerTpMapByOrder.has(pOrder)) {
                resolvedParentId = headerTpMapByOrder.get(pOrder);
              }
            }

            // 3. Explicit parent code
            if (!resolvedParentId) {
              const parentCode = parseNullableString(p.parentHeaderCode || p.parentCode);
              if (parentCode && headerTpMapByCode.has(parentCode.toUpperCase())) {
                resolvedParentId = headerTpMapByCode.get(parentCode.toUpperCase());
              }
            }

            // 4. Fallback: If no explicit parent specified and not standalone, use preceding header
            if (!resolvedParentId && p.parentId === undefined && p.parentHeaderName === undefined && !p.isStandalone) {
              resolvedParentId = currentSectionHeaderTpId;
            }

            // 5. Explicitly standalone or explicitly null
            if (p.parentId === null || p.parentHeaderName === null || p.isStandalone === true) {
              resolvedParentId = null;
              currentSectionHeaderTpId = null;
            }

            let tp = existingTPs.find((x) => x.parameterId === itemP.parameter.id);
            const tpData = {
              order: itemP.order,
              isHeader: false,
              parentId: resolvedParentId,
              unit: itemP.unitVal,
              valueType: itemP.valueType,
              options: itemP.optionsVal,
              isCalculated: itemP.isCalculated,
              decimalPlace: itemP.decimalPlace,
              roundingMethod: itemP.roundingMethod,
              section: itemP.section,
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
                  parameterId: itemP.parameter.id,
                  ...tpData,
                },
              });
            }

            activeTpIds.add(tp.id);
          }

          // 5. Process Formulas (both inline parameter formulas and top-level item.formulas)
          const incomingFormulas = Array.isArray(item.formulas) ? item.formulas : [];
          const allFormulasToProcess = [...inlineFormulas];

          for (const f of incomingFormulas) {
            if (!f) continue;
            const formulaStr = parseNullableString(f.formula || f.expression || f.calculationFormula);
            if (!formulaStr) continue;

            let targetParamId = null;

            if (f.outputParameterId && !isNaN(parseInt(f.outputParameterId, 10))) {
              targetParamId = parseInt(f.outputParameterId, 10);
            } else if (f.parameterId && !isNaN(parseInt(f.parameterId, 10))) {
              targetParamId = parseInt(f.parameterId, 10);
            }

            if (!targetParamId) {
              const outName = parseNullableString(f.outputParameter || f.outputParameterName || f.parameterName || f.name);
              if (outName && paramNameToId.has(outName.toLowerCase())) {
                targetParamId = paramNameToId.get(outName.toLowerCase());
              } else if (outName) {
                const dbParam = await tx.parameter.findFirst({
                  where: { workspaceId: null, name: { equals: outName } },
                });
                if (dbParam) targetParamId = dbParam.id;
              }
            }

            if (!targetParamId) {
              const outCode = parseNullableString(f.outputParameterCode || f.parameterCode || f.code);
              if (outCode && paramCodeToId.has(outCode.toUpperCase())) {
                targetParamId = paramCodeToId.get(outCode.toUpperCase());
              } else if (outCode) {
                const dbParam = await tx.parameter.findFirst({
                  where: { workspaceId: null, code: outCode.toUpperCase() },
                });
                if (dbParam) targetParamId = dbParam.id;
              }
            }

            if (targetParamId) {
              allFormulasToProcess.push({
                outputParameterId: targetParamId,
                formula: formulaStr,
                name: parseNullableString(f.name || f.formulaName),
                description: parseNullableString(f.description || f.formulaDescription),
                isActive: f.isActive !== undefined ? Boolean(f.isActive) : true,
              });
            }
          }

          const processedFormulaIds = new Set();
          for (const form of allFormulasToProcess) {
            // Guarantee isCalculated is true on the testParameter mapping
            await tx.testParameter.updateMany({
              where: {
                testId: testRecord.id,
                parameterId: form.outputParameterId,
              },
              data: { isCalculated: true },
            });

            const existingFormula = await tx.testFormula.findFirst({
              where: {
                workspaceId: null,
                testId: testRecord.id,
                outputParameterId: form.outputParameterId,
              },
            });

            let tf;
            if (existingFormula) {
              tf = await tx.testFormula.update({
                where: { id: existingFormula.id },
                data: {
                  formula: form.formula,
                  name: form.name || existingFormula.name || null,
                  description: form.description || existingFormula.description || null,
                  isActive: form.isActive !== undefined ? form.isActive : true,
                  version: (existingFormula.version || 1) + 1,
                },
              });
            } else {
              tf = await tx.testFormula.create({
                data: {
                  workspaceId: null,
                  testId: testRecord.id,
                  outputParameterId: form.outputParameterId,
                  formula: form.formula,
                  name: form.name || null,
                  description: form.description || null,
                  isActive: form.isActive !== undefined ? form.isActive : true,
                  version: 1,
                },
              });
            }

            processedFormulaIds.add(tf.id);
          }

          // 6. Soft-delete old parameters not in the incoming payload
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
            formulasCount: processedFormulaIds.size,
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
