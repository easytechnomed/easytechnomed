const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const formulas = await prisma.testFormula.findMany({
    include: {
      test: true,
      outputParameter: true
    }
  });
  console.log("=== All Formulas ===");
  formulas.forEach(f => {
    console.log(`Test: [${f.test?.name}] | Output: [${f.outputParameter?.name}] (${f.outputParameter?.code}) | Formula: ${f.formula}`);
  });
}

main().finally(() => prisma.$disconnect());
