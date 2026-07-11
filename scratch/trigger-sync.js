const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const workspaceId = 26;
  console.log(`Running sync defaults for Workspace ID: ${workspaceId}...`);

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
    console.log(`Pre-creating ${missingParamsToCreate.length} missing parameters in workspace...`);
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

  for (const dt of defaultTests) {
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
        continue;
      }

      // Update Test details directly
      const needsMetadataUpdate = 
        match.name !== dt.name ||
        match.code !== dt.code ||
        parseFloat(match.price) !== parseFloat(dt.price) ||
        match.isProcessed !== dt.isProcessed;

      if (needsMetadataUpdate) {
        await prisma.test.update({
          where: { id: match.id },
          data: {
            name: dt.name,
            code: dt.code,
            price: dt.price,
            isProcessed: dt.isProcessed,
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

      // Add or update parameter mappings selectively
      for (const dp of incomingParams) {
        const normName = dp.parameter.name.toLowerCase().trim();
        const wParamId = workspaceParamNameToIdMap[normName];
        if (!wParamId) continue;

        const allMatchingMappings = existingParams.filter(ep => ep.parameter.name.toLowerCase().trim() === normName);
        if (allMatchingMappings.length > 0) {
          const existingMapping = allMatchingMappings[0];
          const needsParamUpdate = 
            existingMapping.order !== dp.order ||
            existingMapping.isHeader !== dp.isHeader ||
            existingMapping.isDeleted === true;

          if (needsParamUpdate) {
            await prisma.testParameter.update({
              where: { id: existingMapping.id },
              data: {
                order: dp.order,
                isHeader: dp.isHeader,
                isDeleted: false,
                deletedAt: null
              }
            });
          }

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
          isCustomized: false
        }
      });

      const testParamsToCreate = dt.parameters.map(dp => {
        const normName = dp.parameter.name.toLowerCase().trim();
        const wParamId = workspaceParamNameToIdMap[normName];
        return {
          testId: newTest.id,
          parameterId: wParamId,
          order: dp.order,
          isHeader: dp.isHeader,
          workspaceId
        };
      }).filter(p => p.parameterId);

      if (testParamsToCreate.length > 0) {
        await prisma.testParameter.createMany({
          data: testParamsToCreate
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
  }

  console.log(`Sync completed! Synced: ${syncedCount}, Added: ${createdCount}, Skipped: ${skippedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
