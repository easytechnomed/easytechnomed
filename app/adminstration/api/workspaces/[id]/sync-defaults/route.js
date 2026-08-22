import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

// Helpers for safe, field-by-field value comparisons
function isNumEqual(a, b) {
  if ((a === null || a === undefined) && (b === null || b === undefined)) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return Number(a) === Number(b);
}

function isStrEqual(a, b) {
  const sA = a === null || a === undefined ? null : String(a).trim();
  const sB = b === null || b === undefined ? null : String(b).trim();
  if (sA === "" && sB === null) return true;
  if (sB === "" && sA === null) return true;
  return sA === sB;
}

function isBoolEqual(a, b) {
  return Boolean(a) === Boolean(b);
}

// 1. Parameter field comparison & data extraction (30+ fields)
function hasParameterChanged(existing, defaultP) {
  return (
    !isStrEqual(existing.code, defaultP.code) ||
    !isStrEqual(existing.unit, defaultP.unit) ||
    !isStrEqual(existing.valueType, defaultP.valueType) ||
    !isStrEqual(existing.options, defaultP.options) ||
    !isNumEqual(existing.minValMale, defaultP.minValMale) ||
    !isNumEqual(existing.maxValMale, defaultP.maxValMale) ||
    !isStrEqual(existing.normalRangeMale, defaultP.normalRangeMale) ||
    !isNumEqual(existing.minValFemale, defaultP.minValFemale) ||
    !isNumEqual(existing.maxValFemale, defaultP.maxValFemale) ||
    !isStrEqual(existing.normalRangeFemale, defaultP.normalRangeFemale) ||
    !isNumEqual(existing.minValBaby, defaultP.minValBaby) ||
    !isNumEqual(existing.maxValBaby, defaultP.maxValBaby) ||
    !isStrEqual(existing.normalRangeBaby, defaultP.normalRangeBaby) ||
    !isStrEqual(existing.normalRangeDefault, defaultP.normalRangeDefault) ||
    !isNumEqual(existing.criticalMinValMale, defaultP.criticalMinValMale) ||
    !isNumEqual(existing.criticalMaxValMale, defaultP.criticalMaxValMale) ||
    !isNumEqual(existing.criticalMinValFemale, defaultP.criticalMinValFemale) ||
    !isNumEqual(existing.criticalMaxValFemale, defaultP.criticalMaxValFemale) ||
    !isNumEqual(existing.criticalMinValBaby, defaultP.criticalMinValBaby) ||
    !isNumEqual(existing.criticalMaxValBaby, defaultP.criticalMaxValBaby) ||
    !isNumEqual(existing.criticalMinValDefault, defaultP.criticalMinValDefault) ||
    !isNumEqual(existing.criticalMaxValDefault, defaultP.criticalMaxValDefault) ||
    !isNumEqual(existing.borderlineMinValMale, defaultP.borderlineMinValMale) ||
    !isNumEqual(existing.borderlineMaxValMale, defaultP.borderlineMaxValMale) ||
    !isNumEqual(existing.borderlineMinValFemale, defaultP.borderlineMinValFemale) ||
    !isNumEqual(existing.borderlineMaxValFemale, defaultP.borderlineMaxValFemale) ||
    !isNumEqual(existing.borderlineMinValBaby, defaultP.borderlineMinValBaby) ||
    !isNumEqual(existing.borderlineMaxValBaby, defaultP.borderlineMaxValBaby) ||
    !isNumEqual(existing.borderlineMinValDefault, defaultP.borderlineMinValDefault) ||
    !isNumEqual(existing.borderlineMaxValDefault, defaultP.borderlineMaxValDefault)
  );
}

function extractParameterData(p, workspaceId) {
  return {
    name: p.name,
    code: p.code ?? null,
    unit: p.unit ?? null,
    valueType: p.valueType ?? "NUMERIC",
    options: p.options ?? null,
    minValMale: p.minValMale ?? null,
    maxValMale: p.maxValMale ?? null,
    normalRangeMale: p.normalRangeMale ?? null,
    minValFemale: p.minValFemale ?? null,
    maxValFemale: p.maxValFemale ?? null,
    normalRangeFemale: p.normalRangeFemale ?? null,
    minValBaby: p.minValBaby ?? null,
    maxValBaby: p.maxValBaby ?? null,
    normalRangeBaby: p.normalRangeBaby ?? null,
    normalRangeDefault: p.normalRangeDefault ?? null,
    criticalMinValMale: p.criticalMinValMale ?? null,
    criticalMaxValMale: p.criticalMaxValMale ?? null,
    criticalMinValFemale: p.criticalMinValFemale ?? null,
    criticalMaxValFemale: p.criticalMaxValFemale ?? null,
    criticalMinValBaby: p.criticalMinValBaby ?? null,
    criticalMaxValBaby: p.criticalMaxValBaby ?? null,
    criticalMinValDefault: p.criticalMinValDefault ?? null,
    criticalMaxValDefault: p.criticalMaxValDefault ?? null,
    borderlineMinValMale: p.borderlineMinValMale ?? null,
    borderlineMaxValMale: p.borderlineMaxValMale ?? null,
    borderlineMinValFemale: p.borderlineMinValFemale ?? null,
    borderlineMaxValFemale: p.borderlineMaxValFemale ?? null,
    borderlineMinValBaby: p.borderlineMinValBaby ?? null,
    borderlineMaxValBaby: p.borderlineMaxValBaby ?? null,
    borderlineMinValDefault: p.borderlineMinValDefault ?? null,
    borderlineMaxValDefault: p.borderlineMaxValDefault ?? null,
    ...(workspaceId !== undefined ? { workspaceId } : {}),
  };
}

// 2. Test field comparison & data extraction
function hasTestChanged(existing, defaultT) {
  return (
    !isStrEqual(existing.name, defaultT.name) ||
    !isStrEqual(existing.code, defaultT.code) ||
    !isNumEqual(existing.price, defaultT.price) ||
    !isNumEqual(existing.baseRate, defaultT.baseRate) ||
    !isNumEqual(existing.curRate, defaultT.curRate) ||
    !isNumEqual(existing.rate, defaultT.rate) ||
    !isNumEqual(existing.collectionCenterRate, defaultT.collectionCenterRate) ||
    !isNumEqual(existing.franchiseRate, defaultT.franchiseRate) ||
    !isNumEqual(existing.superFranchiseRate, defaultT.superFranchiseRate) ||
    !isNumEqual(existing.labRate, defaultT.labRate) ||
    !isNumEqual(existing.offerPrice, defaultT.offerPrice) ||
    !isBoolEqual(existing.isProcessed, defaultT.isProcessed) ||
    !isNumEqual(existing.departmentId, defaultT.departmentId) ||
    existing.isDeleted === true
  );
}

function extractTestData(t, workspaceId, defaultUpdatedAt) {
  return {
    name: t.name,
    code: t.code ?? null,
    price: t.price ?? 0.0,
    baseRate: t.baseRate ?? null,
    curRate: t.curRate ?? null,
    rate: t.rate ?? null,
    collectionCenterRate: t.collectionCenterRate ?? null,
    franchiseRate: t.franchiseRate ?? null,
    superFranchiseRate: t.superFranchiseRate ?? null,
    labRate: t.labRate ?? null,
    offerPrice: t.offerPrice ?? null,
    isProcessed: Boolean(t.isProcessed),
    departmentId: t.departmentId ?? null,
    isDeleted: false,
    deletedAt: null,
    ...(workspaceId !== undefined ? { workspaceId } : {}),
    ...(defaultUpdatedAt !== undefined ? { defaultUpdatedAt } : {}),
  };
}

// 3. TestParameter mapping field comparison & data extraction
function hasTestParameterChanged(existing, defaultTp, resolvedParentId) {
  return (
    existing.order !== defaultTp.order ||
    !isBoolEqual(existing.isHeader, defaultTp.isHeader) ||
    existing.parentId !== resolvedParentId ||
    !isStrEqual(existing.unit, defaultTp.unit) ||
    !isStrEqual(existing.valueType, defaultTp.valueType) ||
    !isStrEqual(existing.options, defaultTp.options) ||
    !isBoolEqual(existing.editable, defaultTp.editable) ||
    !isBoolEqual(existing.isCalculated, defaultTp.isCalculated) ||
    (existing.decimalPlace ?? 2) !== (defaultTp.decimalPlace ?? 2) ||
    !isStrEqual(existing.roundingMethod || "HALF_UP", defaultTp.roundingMethod || "HALF_UP") ||
    !isStrEqual(existing.section, defaultTp.section) ||
    existing.isDeleted === true
  );
}

function extractTestParameterData(tp, testId, parameterId, resolvedParentId, workspaceId) {
  return {
    ...(testId ? { testId } : {}),
    ...(parameterId ? { parameterId } : {}),
    order: tp.order ?? 1,
    isHeader: Boolean(tp.isHeader),
    parentId: resolvedParentId,
    unit: tp.unit ?? null,
    valueType: tp.valueType ?? null,
    options: tp.options ?? null,
    editable: tp.editable !== undefined ? Boolean(tp.editable) : true,
    isCalculated: Boolean(tp.isCalculated),
    decimalPlace: tp.decimalPlace !== undefined ? Number(tp.decimalPlace) : 2,
    roundingMethod: tp.roundingMethod || "HALF_UP",
    section: tp.section ?? null,
    isDeleted: false,
    deletedAt: null,
    ...(workspaceId !== undefined ? { workspaceId } : {}),
  };
}

export async function POST(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const workspaceId = parseInt(id, 10);

    if (isNaN(workspaceId)) {
      return NextResponse.json({ success: false, error: "Invalid workspace ID" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, isDeleted: false },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
    }

    // 1. Fetch all active default tests with department, parameters, formulas, and interpretation rules
    const defaultTests = await prisma.test.findMany({
      where: { workspaceId: null, isDeleted: false },
      include: {
        department: true,
        parameters: {
          where: { isDeleted: false },
          include: { parameter: true },
        },
        formulas: {
          where: { isActive: true },
          include: { outputParameter: true },
        },
        interpretationRules: {
          include: { parameter: true },
        },
      },
    });

    // 2. Fetch all workspace tests (active and soft-deleted) with department, parameters, formulas, and interpretation rules
    const workspaceTests = await prisma.test.findMany({
      where: { workspaceId },
      include: {
        department: true,
        parameters: {
          include: { parameter: true },
        },
        formulas: true,
        interpretationRules: true,
      },
    });

    // 3. Collect all default parameters and sync workspace parameters dictionary first
    const defaultParamMap = new Map();
    for (const dt of defaultTests) {
      for (const dp of dt.parameters) {
        if (dp.parameter && dp.parameter.name) {
          const norm = dp.parameter.name.toLowerCase().trim();
          if (!defaultParamMap.has(norm)) {
            defaultParamMap.set(norm, dp.parameter);
          }
        }
      }
    }

    // Fetch existing workspace parameters
    let workspaceParams = await prisma.parameter.findMany({
      where: { workspaceId },
    });
    const workspaceParamMap = new Map();
    workspaceParams.forEach((p) => {
      workspaceParamMap.set(p.name.toLowerCase().trim(), p);
    });

    // A. Pre-create missing parameters in workspace with all 30+ fields
    const missingParamsToCreate = [];
    for (const [normName, defaultP] of defaultParamMap.entries()) {
      if (!workspaceParamMap.has(normName)) {
        missingParamsToCreate.push(extractParameterData(defaultP, workspaceId));
      }
    }

    if (missingParamsToCreate.length > 0) {
      await prisma.parameter.createMany({
        data: missingParamsToCreate,
      });
      // Refresh workspace parameter map
      workspaceParams = await prisma.parameter.findMany({
        where: { workspaceId },
      });
      workspaceParams.forEach((p) => {
        workspaceParamMap.set(p.name.toLowerCase().trim(), p);
      });
    }

    // B. Compare every single field of existing parameters and update if any field changed
    let updatedParamsCount = 0;
    for (const [normName, defaultP] of defaultParamMap.entries()) {
      const existingP = workspaceParamMap.get(normName);
      if (existingP && hasParameterChanged(existingP, defaultP)) {
        await prisma.parameter.update({
          where: { id: existingP.id },
          data: extractParameterData(defaultP),
        });
        updatedParamsCount++;
      }
    }

    let syncedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;
    let updatedTestsCount = 0;

    // 4. Batch process tests in parallel
    const batchSize = 25;
    for (let i = 0; i < defaultTests.length; i += batchSize) {
      const batch = defaultTests.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (dt) => {
          const dtCode = (dt.code || "").toLowerCase().trim();
          const dtNameNorm = dt.name.toLowerCase().trim();

          const match = workspaceTests.find((wt) => {
            if (dtCode && wt.code) {
              return wt.code.toLowerCase().trim() === dtCode;
            }
            return wt.name.toLowerCase().trim() === dtNameNorm;
          });

          if (match) {
            // If the workspace administrator customized this test specifically, check departmentId sync
            if (match.isCustomized) {
              if (!isNumEqual(match.departmentId, dt.departmentId)) {
                await prisma.test.update({
                  where: { id: match.id },
                  data: { departmentId: dt.departmentId ?? null },
                });
                updatedTestsCount++;
              }
              skippedCount++;
              return;
            }

            // Compare each field of Test record
            if (hasTestChanged(match, dt)) {
              await prisma.test.update({
                where: { id: match.id },
                data: {
                  ...extractTestData(dt),
                  defaultUpdatedAt: dt.updatedAt,
                },
              });
              updatedTestsCount++;
            }

            // Map incoming default parameters and existing workspace mappings
            const incomingParams = dt.parameters || [];
            const existingMappings = match.parameters || [];

            // Soft-delete workspace mappings that no longer exist in default test
            const incomingParamNormNames = new Set(
              incomingParams
                .filter((ip) => ip.parameter)
                .map((ip) => ip.parameter.name.toLowerCase().trim())
            );

            const mappingsToDelete = existingMappings.filter(
              (ep) => ep.parameter && !incomingParamNormNames.has(ep.parameter.name.toLowerCase().trim()) && !ep.isDeleted
            );

            if (mappingsToDelete.length > 0) {
              await prisma.testParameter.updateMany({
                where: { id: { in: mappingsToDelete.map((m) => m.id) } },
                data: { isDeleted: true, deletedAt: new Date() },
              });
            }

            // Map to track: defaultTestParameter.id -> workspaceTestParameter.id
            const defaultToWorkspaceTpIdMap = {};

            // Pass 1: Add or update isHeader mappings first to establish parent DB IDs
            const headers = incomingParams.filter((dp) => dp.isHeader && dp.parameter);
            for (const dp of headers) {
              const normName = dp.parameter.name.toLowerCase().trim();
              const wParam = workspaceParamMap.get(normName);
              if (!wParam) continue;

              const allMatching = existingMappings.filter(
                (ep) => ep.parameter && ep.parameter.name.toLowerCase().trim() === normName
              );

              let workspaceTpId = null;

              if (allMatching.length > 0) {
                const existingMapping = allMatching[0];
                workspaceTpId = existingMapping.id;

                if (hasTestParameterChanged(existingMapping, dp, null)) {
                  await prisma.testParameter.update({
                    where: { id: existingMapping.id },
                    data: extractTestParameterData(dp, null, null, null),
                  });
                }

                // Clean up any duplicate mapping rows if they exist
                if (allMatching.length > 1) {
                  const dupes = allMatching.slice(1);
                  await prisma.testParameter.updateMany({
                    where: { id: { in: dupes.map((d) => d.id) } },
                    data: { isDeleted: true, deletedAt: new Date() },
                  });
                }
              } else {
                const newTp = await prisma.testParameter.create({
                  data: extractTestParameterData(dp, match.id, wParam.id, null, workspaceId),
                });
                workspaceTpId = newTp.id;
              }

              if (workspaceTpId) {
                defaultToWorkspaceTpIdMap[dp.id] = workspaceTpId;
              }
            }

            // Pass 2: Add or update child parameters, linking parentId correctly
            const children = incomingParams.filter((dp) => !dp.isHeader && dp.parameter);
            for (const dp of children) {
              const normName = dp.parameter.name.toLowerCase().trim();
              const wParam = workspaceParamMap.get(normName);
              if (!wParam) continue;

              const resolvedParentId = dp.parentId ? defaultToWorkspaceTpIdMap[dp.parentId] || null : null;
              const allMatching = existingMappings.filter(
                (ep) => ep.parameter && ep.parameter.name.toLowerCase().trim() === normName
              );

              if (allMatching.length > 0) {
                const existingMapping = allMatching[0];

                if (hasTestParameterChanged(existingMapping, dp, resolvedParentId)) {
                  await prisma.testParameter.update({
                    where: { id: existingMapping.id },
                    data: extractTestParameterData(dp, null, null, resolvedParentId),
                  });
                }

                // Clean up any duplicate mapping rows if they exist
                if (allMatching.length > 1) {
                  const dupes = allMatching.slice(1);
                  await prisma.testParameter.updateMany({
                    where: { id: { in: dupes.map((d) => d.id) } },
                    data: { isDeleted: true, deletedAt: new Date() },
                  });
                }
              } else {
                await prisma.testParameter.create({
                  data: extractTestParameterData(dp, match.id, wParam.id, resolvedParentId, workspaceId),
                });
              }
            }

            // Formulas comparison
            const incomingFormulas = dt.formulas || [];
            const existingFormulas = match.formulas || [];

            const incomingFormulasMapped = [];
            const seenIncomingFormulaKeys = new Set();

            incomingFormulas.forEach((df) => {
              if (df.outputParameter) {
                const outName = df.outputParameter.name.toLowerCase().trim();
                const wParam = workspaceParamMap.get(outName);
                if (wParam && !seenIncomingFormulaKeys.has(wParam.id)) {
                  seenIncomingFormulaKeys.add(wParam.id);
                  incomingFormulasMapped.push({
                    outputParameterId: wParam.id,
                    formula: df.formula,
                  });
                }
              }
            });

            const incomingOutputParamIds = incomingFormulasMapped.map((f) => f.outputParameterId);
            const formulasToDelete = existingFormulas.filter(
              (ef) => !incomingOutputParamIds.includes(ef.outputParameterId)
            );
            if (formulasToDelete.length > 0) {
              await prisma.testFormula.deleteMany({
                where: { id: { in: formulasToDelete.map((f) => f.id) } },
              });
            }

            for (const df of incomingFormulasMapped) {
              const existingFormula = existingFormulas.find(
                (ef) => ef.outputParameterId === df.outputParameterId
              );
              if (existingFormula) {
                if (existingFormula.formula !== df.formula || !existingFormula.isActive) {
                  await prisma.testFormula.update({
                    where: { id: existingFormula.id },
                    data: { formula: df.formula, isActive: true },
                  });
                }
              } else {
                await prisma.testFormula.create({
                  data: {
                    testId: match.id,
                    outputParameterId: df.outputParameterId,
                    formula: df.formula,
                    workspaceId,
                    isActive: true,
                  },
                });
              }
            }

            // Interpretation rules comparison
            const incomingRules = dt.interpretationRules || [];
            const existingRules = match.interpretationRules || [];

            const incomingRulesMapped = [];
            incomingRules.forEach((dr) => {
              if (dr.parameter) {
                const pName = dr.parameter.name.toLowerCase().trim();
                const wParam = workspaceParamMap.get(pName);
                if (wParam) {
                  incomingRulesMapped.push({
                    parameterId: wParam.id,
                    condition: dr.condition,
                    interpretation: dr.interpretation,
                  });
                }
              }
            });

            // Clean up rules not in default test
            for (const er of existingRules) {
              const stillExists = incomingRulesMapped.some(
                (ir) => ir.parameterId === er.parameterId && ir.condition === er.condition
              );
              if (!stillExists) {
                await prisma.interpretationRule.delete({ where: { id: er.id } });
              }
            }

            for (const ir of incomingRulesMapped) {
              const existingRule = existingRules.find(
                (er) => er.parameterId === ir.parameterId && er.condition === ir.condition
              );
              if (existingRule) {
                if (existingRule.interpretation !== ir.interpretation) {
                  await prisma.interpretationRule.update({
                    where: { id: existingRule.id },
                    data: { interpretation: ir.interpretation },
                  });
                }
              } else {
                await prisma.interpretationRule.create({
                  data: {
                    testId: match.id,
                    parameterId: ir.parameterId,
                    condition: ir.condition,
                    interpretation: ir.interpretation,
                    workspaceId,
                  },
                });
              }
            }

            syncedCount++;
          } else {
            // New Test creation
            const newTest = await prisma.test.create({
              data: {
                ...extractTestData(dt, workspaceId, dt.updatedAt),
                isCustomized: false,
              },
            });

            const defaultToWorkspaceTpIdMap = {};

            // Pass 1: Clone headers first
            const headers = (dt.parameters || []).filter((dp) => dp.isHeader && dp.parameter);
            for (const dp of headers) {
              const normName = dp.parameter.name.toLowerCase().trim();
              const wParam = workspaceParamMap.get(normName);
              if (!wParam) continue;

              const newTp = await prisma.testParameter.create({
                data: extractTestParameterData(dp, newTest.id, wParam.id, null, workspaceId),
              });
              defaultToWorkspaceTpIdMap[dp.id] = newTp.id;
            }

            // Pass 2: Clone children
            const children = (dt.parameters || []).filter((dp) => !dp.isHeader && dp.parameter);
            for (const dp of children) {
              const normName = dp.parameter.name.toLowerCase().trim();
              const wParam = workspaceParamMap.get(normName);
              if (!wParam) continue;

              const resolvedParentId = dp.parentId ? defaultToWorkspaceTpIdMap[dp.parentId] || null : null;
              await prisma.testParameter.create({
                data: extractTestParameterData(dp, newTest.id, wParam.id, resolvedParentId, workspaceId),
              });
            }

            // Clone formulas
            const addedFormulaKeys = new Set();
            const formulasToCreate = [];
            for (const df of dt.formulas || []) {
              if (df.outputParameter) {
                const outName = df.outputParameter.name.toLowerCase().trim();
                const wParam = workspaceParamMap.get(outName);
                if (wParam && !addedFormulaKeys.has(wParam.id)) {
                  addedFormulaKeys.add(wParam.id);
                  formulasToCreate.push({
                    testId: newTest.id,
                    outputParameterId: wParam.id,
                    formula: df.formula,
                    workspaceId,
                    isActive: true,
                  });
                }
              }
            }

            if (formulasToCreate.length > 0) {
              await prisma.testFormula.createMany({ data: formulasToCreate });
            }

            // Clone interpretation rules
            const rulesToCreate = [];
            for (const dr of dt.interpretationRules || []) {
              if (dr.parameter) {
                const pName = dr.parameter.name.toLowerCase().trim();
                const wParam = workspaceParamMap.get(pName);
                if (wParam) {
                  rulesToCreate.push({
                    testId: newTest.id,
                    parameterId: wParam.id,
                    condition: dr.condition,
                    interpretation: dr.interpretation,
                    workspaceId,
                  });
                }
              }
            }

            if (rulesToCreate.length > 0) {
              await prisma.interpretationRule.createMany({ data: rulesToCreate });
            }

            createdCount++;
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      message: `Workspace synced successfully! Synced: ${syncedCount}, Added: ${createdCount}, Updated Params: ${updatedParamsCount}, Updated Tests: ${updatedTestsCount}, Skipped (Customized): ${skippedCount}`,
    });
  } catch (error) {
    console.error("SuperAdmin Workspace Sync Defaults Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

