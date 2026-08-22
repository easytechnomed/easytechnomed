const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const allTests = await prisma.test.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true, code: true, workspaceId: true }
  });
  console.log("Total tests:", allTests.length);
  const cbcMatches = allTests.filter(t => t.name.toLowerCase().includes("blood") || t.name.toLowerCase().includes("cbc") || t.id === 962);
  console.log("CBC Matches:", cbcMatches);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
