import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function POST(req, { params }) {
  try {
    await verifySuperAdminAPI();
    const { id } = await params;
    const workspaceId = parseInt(id);

    if (isNaN(workspaceId)) {
      return NextResponse.json({ success: false, error: "Invalid workspace ID" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, isDeleted: false }
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
    }

    // 1. Fetch all active default tests with parameters and formulas
    const defaultTests = await prisma.test.findMany({
      where: { workspaceId: null, isDeleted: false },
      include: {
        parameters: {
          where: { isDeleted: false },
          include: { parameter: true }
        },
        formulas: {
          where: { isActive: true },
          include: { outputParameter: true }
        }
      }
    });

    // 2. Fetch all active workspace tests with parameters and formulas
    const workspaceTests = await prisma.test.findMany({
      where: { workspaceId, isDeleted: false },
      include: {
        parameters: {
          where: { isDeleted: false },
          include: { parameter: true }
        },
        formulas: {
          where: { isActive: true }
        }
      }
    });

    // 3. Create helper mappings of workspace parameters to find parameter IDs by name
    const workspaceParams = await prisma.parameter.findMany({
      where: { workspaceId }
    });
    const workspaceParamNameToIdMap = {};
    workspaceParams.forEach(p => {
      workspaceParamNameToIdMap[p.name.toLowerCase().trim()] = p.id;
    });

    // 4. Pre-create missing parameters in the workspace in a single bulk operation
    const missingParamsToCreate = [];
    const seenParamNames = new Set();
    
    for (const dt of defaultTests) {
      for (const dp of dt.parameters) {
        if (dp.parameter) {
          const nameNorm = dp.parameter.name.toLowerCase().trim();
          if (!workspaceParamNameToIdMap[nameNorm] && !seenParamNames.has(nameNorm)) {
            seenParamNames.add(nameNorm);
            missingParamsToCreate.push({
              name: dp.parameter.name,
              code: dp.parameter.code,
              unit: dp.parameter.unit,
              minValMale: dp.parameter.minValMale,
              maxValMale: dp.parameter.maxValMale,
              normalRangeMale: dp.parameter.normalRangeMale,
              minValFemale: dp.parameter.minValFemale,
              maxValFemale: dp.parameter.maxValFemale,
              normalRangeFemale: dp.parameter.normalRangeFemale,
              minValBaby: dp.parameter.minValBaby,
              maxValBaby: dp.parameter.maxValBaby,
              normalRangeBaby: dp.parameter.normalRangeBaby,
              normalRangeDefault: dp.parameter.normalRangeDefault,
              workspaceId
            });
          }
        }
      }
    }

    if (missingParamsToCreate.length > 0) {
      await prisma.parameter.createMany({
        data: missingParamsToCreate
      });
      // Refresh parameter map
      const updatedParams = await prisma.parameter.findMany({
        where: { workspaceId }
      });
      updatedParams.forEach(p => {
        workspaceParamNameToIdMap[p.name.toLowerCase().trim()] = p.id;
      });
    }

    let syncedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;

    // Batch process tests in parallel to prevent connection hanging and timeout (pending)
    const batchSize = 30;
    for (let i = 0; i < defaultTests.length; i += batchSize) {
      const batch = defaultTests.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (dt) => {
        const dtCode = (dt.code || "").toLowerCase().trim();
        const dtNameNorm = dt.name.toLowerCase().trim();

        const match = workspaceTests.find(wt => {
          if (dtCode && wt.code) {
            return wt.code.toLowerCase().trim() === dtCode;
          }
          return wt.name.toLowerCase().trim() === dtNameNorm;
        });

        if (match) {
          if (match.isCustomized) {
            skippedCount++;
            return;
          }

          // Optimize: compare default test's updatedAt to skip completely if identical
          const dtUpdatedTime = dt.updatedAt.getTime();
          const matchDefaultUpdatedTime = match.defaultUpdatedAt ? match.defaultUpdatedAt.getTime() : null;

          if (matchDefaultUpdatedTime === dtUpdatedTime) {
            syncedCount++;
            return;
          }

          // Compare test details
          const needsMetadataUpdate = 
            match.name !== dt.name ||
            match.code !== dt.code ||
            parseFloat(match.price) !== parseFloat(dt.price) ||
            match.isProcessed !== dt.isProcessed ||
            matchDefaultUpdatedTime === null;

          if (needsMetadataUpdate) {
            await prisma.test.update({
              where: { id: match.id },
              data: {
                name: dt.name,
                code: dt.code,
                price: dt.price,
                isProcessed: dt.isProcessed,
                defaultUpdatedAt: dt.updatedAt // Save default test's updatedAt timestamp
              }
            });
          }

          // Compare Parameter Mappings
          const incomingParams = dt.parameters || [];
          const existingParams = match.parameters || [];

          // Soft delete mappings that are no longer in the defaults list
          const incomingParamNames = incomingParams.map(ip => ip.parameter.name.toLowerCase().trim());
          const paramsToDelete = existingParams.filter(ep => !incomingParamNames.includes(ep.parameter.name.toLowerCase().trim()));
          
          if (paramsToDelete.length > 0) {
            await prisma.testParameter.updateMany({
              where: { id: { in: paramsToDelete.map(p => p.id) } },
              data: { isDeleted: true, deletedAt: new Date() }
            });
          }

          // Map to track: defaultTestParameterId -> workspaceTestParameterId
          const defaultToWorkspaceTpIdMap = {};

          // Pass 1: Add or update isHeader mappings first to establish parent DB IDs
          for (const dp of incomingParams) {
            if (!dp.isHeader) continue;
            const normName = dp.parameter.name.toLowerCase().trim();
            const wParamId = workspaceParamNameToIdMap[normName];
            if (!wParamId) continue;

            const allMatchingMappings = existingParams.filter(ep => ep.parameter.name.toLowerCase().trim() === normName);
            let workspaceTpId = null;

            if (allMatchingMappings.length > 0) {
              const existingMapping = allMatchingMappings[0];
              workspaceTpId = existingMapping.id;

              // Compare parameter details (ranges, unit) before updating to save DB writes
              const needsParamDetailUpdate = 
                existingMapping.parameter.code !== dp.parameter.code ||
                existingMapping.parameter.unit !== dp.parameter.unit ||
                existingMapping.parameter.minValMale !== dp.parameter.minValMale ||
                existingMapping.parameter.maxValMale !== dp.parameter.maxValMale ||
                existingMapping.parameter.normalRangeMale !== dp.parameter.normalRangeMale ||
                existingMapping.parameter.minValFemale !== dp.parameter.minValFemale ||
                existingMapping.parameter.maxValFemale !== dp.parameter.maxValFemale ||
                existingMapping.parameter.normalRangeFemale !== dp.parameter.normalRangeFemale ||
                existingMapping.parameter.minValBaby !== dp.parameter.minValBaby ||
                existingMapping.parameter.maxValBaby !== dp.parameter.maxValBaby ||
                existingMapping.parameter.normalRangeBaby !== dp.parameter.normalRangeBaby ||
                existingMapping.parameter.normalRangeDefault !== dp.parameter.normalRangeDefault;

              if (needsParamDetailUpdate) {
                await prisma.parameter.update({
                  where: { id: wParamId },
                  data: {
                    code: dp.parameter.code,
                    unit: dp.parameter.unit,
                    minValMale: dp.parameter.minValMale,
                    maxValMale: dp.parameter.maxValMale,
                    normalRangeMale: dp.parameter.normalRangeMale,
                    minValFemale: dp.parameter.minValFemale,
                    maxValFemale: dp.parameter.maxValFemale,
                    normalRangeFemale: dp.parameter.normalRangeFemale,
                    minValBaby: dp.parameter.minValBaby,
                    maxValBaby: dp.parameter.maxValBaby,
                    normalRangeBaby: dp.parameter.normalRangeBaby,
                    normalRangeDefault: dp.parameter.normalRangeDefault,
                  }
                });
              }

              const needsParamMappingUpdate = 
                existingMapping.order !== dp.order ||
                existingMapping.isHeader !== dp.isHeader ||
                existingMapping.parentId !== null ||
                existingMapping.isDeleted === true;

              if (needsParamMappingUpdate) {
                await prisma.testParameter.update({
                  where: { id: existingMapping.id },
                  data: {
                    order: dp.order,
                    isHeader: dp.isHeader,
                    parentId: null, // Headers have no parentId
                    isDeleted: false,
                    deletedAt: null
                  }
                });
              }

              // Clean up duplicate mappings
              if (allMatchingMappings.length > 1) {
                const duplicatesToDelete = allMatchingMappings.slice(1);
                await prisma.testParameter.updateMany({
                  where: { id: { in: duplicatesToDelete.map(d => d.id) } },
                  data: { isDeleted: true, deletedAt: new Date() }
                });
              }
            } else {
              const newTp = await prisma.testParameter.create({
                data: {
                  testId: match.id,
                  parameterId: wParamId,
                  order: dp.order,
                  isHeader: dp.isHeader,
                  parentId: null,
                  workspaceId
                }
              });
              workspaceTpId = newTp.id;
            }

            if (workspaceTpId) {
              defaultToWorkspaceTpIdMap[dp.id] = workspaceTpId;
            }
          }

          // Pass 2: Add or update child parameters, linking parentId correctly
          for (const dp of incomingParams) {
            if (dp.isHeader) continue;
            const normName = dp.parameter.name.toLowerCase().trim();
            const wParamId = workspaceParamNameToIdMap[normName];
            if (!wParamId) continue;

            const resolvedParentId = dp.parentId ? (defaultToWorkspaceTpIdMap[dp.parentId] || null) : null;
            const allMatchingMappings = existingParams.filter(ep => ep.parameter.name.toLowerCase().trim() === normName);

            if (allMatchingMappings.length > 0) {
              const existingMapping = allMatchingMappings[0];

              // Compare parameter details (ranges, unit) before updating to save DB writes
              const needsParamDetailUpdate = 
                existingMapping.parameter.code !== dp.parameter.code ||
                existingMapping.parameter.unit !== dp.parameter.unit ||
                existingMapping.parameter.minValMale !== dp.parameter.minValMale ||
                existingMapping.parameter.maxValMale !== dp.parameter.maxValMale ||
                existingMapping.parameter.normalRangeMale !== dp.parameter.normalRangeMale ||
                existingMapping.parameter.minValFemale !== dp.parameter.minValFemale ||
                existingMapping.parameter.maxValFemale !== dp.parameter.maxValFemale ||
                existingMapping.parameter.normalRangeFemale !== dp.parameter.normalRangeFemale ||
                existingMapping.parameter.minValBaby !== dp.parameter.minValBaby ||
                existingMapping.parameter.maxValBaby !== dp.parameter.maxValBaby ||
                existingMapping.parameter.normalRangeBaby !== dp.parameter.normalRangeBaby ||
                existingMapping.parameter.normalRangeDefault !== dp.parameter.normalRangeDefault;

              if (needsParamDetailUpdate) {
                await prisma.parameter.update({
                  where: { id: wParamId },
                  data: {
                    code: dp.parameter.code,
                    unit: dp.parameter.unit,
                    minValMale: dp.parameter.minValMale,
                    maxValMale: dp.parameter.maxValMale,
                    normalRangeMale: dp.parameter.normalRangeMale,
                    minValFemale: dp.parameter.minValFemale,
                    maxValFemale: dp.parameter.maxValFemale,
                    normalRangeFemale: dp.parameter.normalRangeFemale,
                    minValBaby: dp.parameter.minValBaby,
                    maxValBaby: dp.parameter.maxValBaby,
                    normalRangeBaby: dp.parameter.normalRangeBaby,
                    normalRangeDefault: dp.parameter.normalRangeDefault,
                  }
                });
              }

              const needsParamMappingUpdate = 
                existingMapping.order !== dp.order ||
                existingMapping.isHeader !== dp.isHeader ||
                existingMapping.parentId !== resolvedParentId ||
                existingMapping.isDeleted === true;

              if (needsParamMappingUpdate) {
                await prisma.testParameter.update({
                  where: { id: existingMapping.id },
                  data: {
                    order: dp.order,
                    isHeader: dp.isHeader,
                    parentId: resolvedParentId,
                    isDeleted: false,
                    deletedAt: null
                  }
                });
              }

              // Clean up duplicate mappings
              if (allMatchingMappings.length > 1) {
                const duplicatesToDelete = allMatchingMappings.slice(1);
                await prisma.testParameter.updateMany({
                  where: { id: { in: duplicatesToDelete.map(d => d.id) } },
                  data: { isDeleted: true, deletedAt: new Date() }
                });
              }
            } else {
              await prisma.testParameter.create({
                data: {
                  testId: match.id,
                  parameterId: wParamId,
                  order: dp.order,
                  isHeader: dp.isHeader,
                  parentId: resolvedParentId,
                  workspaceId
                }
              });
            }
          }


          // Compare Formulas selectively
          const incomingFormulas = dt.formulas || [];
          const existingFormulas = match.formulas || [];

          const incomingFormulasMapped = [];
          const seenIncomingKeys = new Set();

          incomingFormulas.forEach(df => {
            const outName = df.outputParameter.name.toLowerCase().trim();
            const wOutParamId = workspaceParamNameToIdMap[outName];
            if (wOutParamId && !seenIncomingKeys.has(wOutParamId)) {
              seenIncomingKeys.add(wOutParamId);
              incomingFormulasMapped.push({
                outputParameterId: wOutParamId,
                formula: df.formula
              });
            }
          });

          const incomingOutputParamIds = incomingFormulasMapped.map(f => f.outputParameterId);
          const formulasToDelete = existingFormulas.filter(ef => !incomingOutputParamIds.includes(ef.outputParameterId));
          if (formulasToDelete.length > 0) {
            await prisma.testFormula.deleteMany({
              where: { id: { in: formulasToDelete.map(f => f.id) } }
            });
          }

          for (const df of incomingFormulasMapped) {
            const existingFormula = existingFormulas.find(ef => ef.outputParameterId === df.outputParameterId);
            if (existingFormula) {
              if (existingFormula.formula !== df.formula || !existingFormula.isActive) {
                await prisma.testFormula.update({
                  where: { id: existingFormula.id },
                  data: {
                    formula: df.formula,
                    isActive: true
                  }
                });
              }
            } else {
              await prisma.testFormula.create({
                data: {
                  testId: match.id,
                  outputParameterId: df.outputParameterId,
                  formula: df.formula,
                  workspaceId,
                  isActive: true
                }
              });
            }
          }

          syncedCount++;
        } else {
          // Clone test directly
          const newTest = await prisma.test.create({
            data: {
              name: dt.name,
              code: dt.code,
              price: dt.price,
              isProcessed: dt.isProcessed,
              workspaceId,
              isCustomized: false,
              defaultUpdatedAt: dt.updatedAt
            }
          });

          // Track: defaultTestParameterId -> workspaceTestParameterId
          const defaultToWorkspaceTpIdMap = {};

          // Pass 1: Clone headers first
          const headersToCreate = dt.parameters.filter(dp => dp.isHeader);
          for (const dp of headersToCreate) {
            const normName = dp.parameter.name.toLowerCase().trim();
            const wParamId = workspaceParamNameToIdMap[normName];
            if (!wParamId) continue;

            const newTp = await prisma.testParameter.create({
              data: {
                testId: newTest.id,
                parameterId: wParamId,
                order: dp.order,
                isHeader: true,
                parentId: null,
                workspaceId
              }
            });
            defaultToWorkspaceTpIdMap[dp.id] = newTp.id;
          }

          // Pass 2: Clone child parameters
          const childrenToCreate = dt.parameters.filter(dp => !dp.isHeader);
          for (const dp of childrenToCreate) {
            const normName = dp.parameter.name.toLowerCase().trim();
            const wParamId = workspaceParamNameToIdMap[normName];
            if (!wParamId) continue;

            const resolvedParentId = dp.parentId ? (defaultToWorkspaceTpIdMap[dp.parentId] || null) : null;
            await prisma.testParameter.create({
              data: {
                testId: newTest.id,
                parameterId: wParamId,
                order: dp.order,
                isHeader: false,
                parentId: resolvedParentId,
                workspaceId
              }
            });
          }

          const addedFormulaKeys = new Set();
          const testFormulasToCreate = [];
          for (const df of dt.formulas) {
            const outName = df.outputParameter.name.toLowerCase().trim();
            const wOutParamId = workspaceParamNameToIdMap[outName];
            if (wOutParamId) {
              const formulaKey = `${newTest.id}_${wOutParamId}`;
              if (addedFormulaKeys.has(formulaKey)) continue;
              addedFormulaKeys.add(formulaKey);

              testFormulasToCreate.push({
                testId: newTest.id,
                outputParameterId: wOutParamId,
                formula: df.formula,
                workspaceId,
                isActive: true
              });
            }
          }

          if (testFormulasToCreate.length > 0) {
            await prisma.testFormula.createMany({
              data: testFormulasToCreate
            });
          }

          createdCount++;
        }
      }));
    }

    return NextResponse.json({
      success: true,
      message: `Workspace synced successfully! Synced: ${syncedCount}, Added: ${createdCount}, Skipped (Customized by Admin): ${skippedCount}`
    });

  } catch (error) {
    console.error("SuperAdmin Workspace Sync Defaults Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
