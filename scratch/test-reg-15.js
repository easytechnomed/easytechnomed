import { prisma } from "../lib/db.js";
import { runFormulaEngine } from "../lib/formulaEngine.js";

async function main() {
  console.log("Running formula engine on registration 15...");
  await runFormulaEngine(15);
  console.log("Done. Checking results:");
  const results = await prisma.patientResult.findMany({
    where: { registrationId: 15 },
    include: {
      testParameter: {
        include: { parameter: true }
      }
    }
  });

  results.forEach(r => {
    console.log(`  [${r.testParameterId}] ${r.testParameter?.parameter?.name} (${r.testParameter?.parameter?.code}): "${r.value}" (flag: ${r.flag})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
