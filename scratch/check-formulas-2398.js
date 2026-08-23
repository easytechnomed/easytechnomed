const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const formulas = await prisma.testFormula.findMany({
    where: { testId: 2398 },
    include: {
      outputParameter: true
    }
  });

  console.log("=== Formulas for Test 2398 ===");
  formulas.forEach(f => {
    console.log(`ID: ${f.id} | OutputParamID: ${f.outputParameterId} | Name: [${f.outputParameter?.name}] | Code: ${f.outputParameter?.code} | Formula: "${f.formula}" | Unit: ${f.outputParameter?.unit}`);
  });

  const testParams = await prisma.testParameter.findMany({
    where: { testId: 2398 },
    include: {
      parameter: true
    }
  });

  console.log("\n=== Test Parameters for Test 2398 ===");
  testParams.forEach(tp => {
    console.log(`TP_ID: ${tp.id} | ParamID: ${tp.parameterId} | Name: [${tp.name}] | Code: ${tp.code} | Unit: ${tp.unit}`);
  });
}

main().finally(() => prisma.$disconnect());
