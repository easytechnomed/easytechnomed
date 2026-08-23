const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tests = await prisma.test.findMany({
    where: {
      OR: [
        { name: { contains: 'KIDNEY' } },
        { name: { contains: 'KFT' } },
        { name: { contains: 'RENAL' } },
        { name: { contains: 'RFT' } }
      ]
    },
    include: {
      parameters: {
        include: { parameter: true },
        orderBy: { order: 'asc' }
      },
      formulas: {
        include: { outputParameter: true }
      }
    }
  });

  console.log(`Found ${tests.length} tests matching KFT / KIDNEY / RENAL:`);
  tests.forEach(t => {
    console.log(`\n--- Test ID: ${t.id}, Name: ${t.name} ---`);
    console.log("Parameters:");
    t.parameters.forEach(tp => {
      console.log(`  [${tp.id}] paramId=${tp.parameterId}, code=${tp.parameter?.code}, name=${tp.parameter?.name}, isCalculated=${tp.parameter?.isCalculated}, formula=${tp.parameter?.formula}`);
    });
    console.log("Formulas in Test:");
    t.formulas.forEach(f => {
      console.log(`  [${f.id}] outputParamId=${f.outputParameterId} (${f.outputParameter?.name} / ${f.outputParameter?.code}), formula=${f.formula}`);
    });
  });
}

main().finally(() => prisma.$disconnect());
