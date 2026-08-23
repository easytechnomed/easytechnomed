const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tests = await prisma.test.findMany({
    where: {
      name: { contains: "KIDNEY" }
    },
    include: {
      parameters: {
        include: { parameter: true },
        orderBy: { order: "asc" }
      },
      formulas: {
        include: { outputParameter: true }
      }
    }
  });

  console.log(`Found ${tests.length} Kidney tests:`);
  for (const t of tests) {
    console.log(`\nTest ID: ${t.id}, WorkspaceId: ${t.workspaceId}, Name: ${t.name}`);
    console.log("Parameters:");
    t.parameters.forEach(tp => {
      console.log(`  tpId=${tp.id}, paramId=${tp.parameterId}, code=${tp.parameter?.code}, name=${tp.parameter?.name}`);
    });
    console.log("Formulas:");
    t.formulas.forEach(f => {
      console.log(`  fId=${f.id}, outParamId=${f.outputParameterId} (${f.outputParameter?.name}), formula=${f.formula}`);
    });
  }
}

main().finally(() => prisma.$disconnect());
