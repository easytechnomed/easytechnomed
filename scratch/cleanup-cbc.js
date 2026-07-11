const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Delete the incorrect duplicate Absolute Neutrophil Count mapping
  const deleteId = 13418;
  const exists = await prisma.testParameter.findUnique({ where: { id: deleteId } });
  
  if (exists) {
    console.log(`Found duplicate parameter mapping (ID: ${deleteId}). Deleting...`);
    await prisma.testParameter.delete({ where: { id: deleteId } });
    console.log("Successfully deleted!");
  } else {
    console.log(`Parameter mapping with ID ${deleteId} not found.`);
  }

  // Find any other duplicate mappings on global tests
  const globalTestParameters = await prisma.testParameter.findMany({
    where: { workspaceId: null, isDeleted: false },
    include: { test: true, parameter: true }
  });

  const seen = new Set();
  const duplicates = [];

  for (const tp of globalTestParameters) {
    const key = `${tp.testId}_${tp.parameterId}`;
    if (seen.has(key)) {
      duplicates.push(tp);
    } else {
      seen.add(key);
    }
  }

  console.log(`\nFound ${duplicates.length} duplicate parameter mappings in global tests.`);
  for (const dup of duplicates) {
    console.log(`Duplicate: Test: ${dup.test.name} (${dup.test.code}), Parameter: ${dup.parameter.name}, ID: ${dup.id}, isHeader: ${dup.isHeader}`);
    // Clean them up too
    await prisma.testParameter.delete({ where: { id: dup.id } });
    console.log(`Deleted duplicate ID: ${dup.id}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
