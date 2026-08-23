import { PrismaClient } from '@prisma/client';
import { runFormulaEngine } from '../lib/formulaEngine.js';

const prisma = new PrismaClient();

async function main() {
  const reg = await prisma.registration.findUnique({
    where: { id: 17 },
    include: {
      results: {
        include: {
          testParameter: {
            include: { parameter: true }
          }
        }
      }
    }
  });

  console.log("=== Registration 17 Current Results ===");
  console.log(reg?.results?.map(r => ({
    tpId: r.testParameterId,
    name: r.testParameter?.parameter?.name,
    code: r.testParameter?.parameter?.code,
    value: r.value,
    flag: r.flag
  })));
}

main().finally(() => prisma.$disconnect());
