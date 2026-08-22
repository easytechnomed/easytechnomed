import { prisma } from "../lib/db.js";

async function main() {
  const reg = await prisma.registration.findUnique({
    where: { id: 14 },
    include: {
      tests: {
        include: {
          test: {
            include: {
              parameters: {
                include: { parameter: true }
              },
              formulas: {
                include: { outputParameter: true }
              }
            }
          }
        }
      },
      results: {
        include: {
          testParameter: {
            include: { parameter: true }
          }
        }
      }
    }
  });

  console.log("Registration 14 Results:");
  reg?.results.forEach(r => {
    console.log(`ParamID: ${r.testParameterId}, Name: ${r.testParameter?.parameter?.name}, Value: ${r.value}, Flag: ${r.flag}`);
  });

  console.log("\nFormulas in Tests:");
  reg?.tests.forEach(t => {
    console.log(`Test: ${t.test.name}`);
    t.test.formulas.forEach(f => {
      console.log(`Formula ID: ${f.id}, Output: ${f.outputParameter?.name}, Formula: ${f.formula}`);
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
