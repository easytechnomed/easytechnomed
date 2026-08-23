const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EGFR_FORMULA = "IF([gender] == 'Female' || [is_female] == 1, 142 * (MIN([CREAT] / 0.7, 1) ^ -0.241) * (MAX([CREAT] / 0.7, 1) ^ -1.200) * (0.9938 ^ [age]) * 1.012, 142 * (MIN([CREAT] / 0.9, 1) ^ -0.302) * (MAX([CREAT] / 0.9, 1) ^ -1.200) * (0.9938 ^ [age]))";
const EGFR_DESC = "CKD-EPI (2021) eGFR based on Creatinine, Age, and Gender.";

async function main() {
  console.log("=== Syncing KFT EGFR Formulas in Database ===");

  const kftTests = await prisma.test.findMany({
    where: {
      OR: [
        { name: { contains: "KIDNEY" } },
        { name: { contains: "KFT" } }
      ]
    },
    include: {
      parameters: {
        include: { parameter: true },
        where: { isDeleted: false }
      },
      formulas: {
        include: { outputParameter: true }
      }
    }
  });

  console.log(`Found ${kftTests.length} KFT tests.`);

  for (const test of kftTests) {
    console.log(`\nProcessing Test [${test.id}] "${test.name}" (Workspace: ${test.workspaceId ?? 'DEFAULT'})`);

    // Find EGFR parameter in this test
    const egfrTp = test.parameters.find(tp => {
      const c = (tp.parameter?.code || "").toUpperCase();
      const n = (tp.parameter?.name || "").toUpperCase();
      return c === "EGFR" || c === "GFR" || n.includes("GLOMERULAR") || n.includes("GLOMEERULAR") || n.includes("EGFR");
    });

    if (!egfrTp || !egfrTp.parameter) {
      console.log("  No EGFR parameter found in this test. Skipping.");
      continue;
    }

    console.log(`  Found EGFR TestParameter ID: ${egfrTp.id}, Parameter ID: ${egfrTp.parameterId} (${egfrTp.parameter.name})`);

    // 1. Update TestParameter to isCalculated: true
    await prisma.testParameter.update({
      where: { id: egfrTp.id },
      data: {
        isCalculated: true,
        editable: true,
        decimalPlace: 2
      }
    });
    console.log("  Updated TestParameter isCalculated = true");

    // 2. Check if TestFormula exists
    const existingFormula = test.formulas.find(f => f.outputParameterId === egfrTp.parameterId);
    if (existingFormula) {
      await prisma.testFormula.update({
        where: { id: existingFormula.id },
        data: {
          formula: EGFR_FORMULA,
          description: EGFR_DESC,
          isActive: true
        }
      });
      console.log(`  Updated existing TestFormula ID ${existingFormula.id}`);
    } else {
      const created = await prisma.testFormula.create({
        data: {
          testId: test.id,
          outputParameterId: egfrTp.parameterId,
          formula: EGFR_FORMULA,
          description: EGFR_DESC,
          workspaceId: test.workspaceId,
          isActive: true
        }
      });
      console.log(`  Created new TestFormula ID ${created.id}`);
    }
  }

  console.log("\n=== Finished Syncing KFT EGFR Formulas ===");
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
