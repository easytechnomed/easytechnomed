const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Find global CBC test
  const globalCbc = await prisma.test.findFirst({
    where: { workspaceId: null, code: "CBC001", isDeleted: false },
    include: {
      parameters: {
        where: { isDeleted: false },
        include: { parameter: true }
      }
    }
  });

  console.log("=== GLOBAL CBC TEST PARAMETERS ===");
  if (!globalCbc) {
    console.log("Global CBC test not found!");
  } else {
    for (const p of globalCbc.parameters) {
      console.log(`ID: ${p.id}, ParamID: ${p.parameterId}, Name: ${p.parameter.name}, Code: ${p.parameter.code}, isHeader: ${p.isHeader}, Order: ${p.order}`);
    }
  }

  // Find workspace 26 CBC test
  const wsCbc = await prisma.test.findFirst({
    where: { workspaceId: 26, code: "CBC001", isDeleted: false },
    include: {
      parameters: {
        where: { isDeleted: false },
        include: { parameter: true }
      }
    }
  });

  console.log("\n=== WORKSPACE 26 CBC TEST PARAMETERS ===");
  if (!wsCbc) {
    console.log("Workspace 26 CBC test not found!");
  } else {
    for (const p of wsCbc.parameters) {
      console.log(`ID: ${p.id}, ParamID: ${p.parameterId}, Name: ${p.parameter.name}, Code: ${p.parameter.code}, isHeader: ${p.isHeader}, Order: ${p.order}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
