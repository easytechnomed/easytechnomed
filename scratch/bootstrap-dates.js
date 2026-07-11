const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Bootstrapping defaultUpdatedAt timestamps for all workspaces...");

  // 1. Fetch all default tests with their updatedAt
  const defaultTests = await prisma.test.findMany({
    where: { workspaceId: null, isDeleted: false },
    select: { code: true, name: true, updatedAt: true }
  });

  const defaultMap = {};
  defaultTests.forEach(dt => {
    const key = dt.code ? dt.code.toLowerCase().trim() : dt.name.toLowerCase().trim();
    defaultMap[key] = dt.updatedAt;
  });

  // 2. Fetch all workspace tests
  const workspaceTests = await prisma.test.findMany({
    where: { workspaceId: { not: null }, isDeleted: false }
  });

  console.log(`Found ${workspaceTests.length} workspace tests to bootstrap.`);

  let count = 0;
  // Use parallel updates in batches
  const batchSize = 100;
  for (let i = 0; i < workspaceTests.length; i += batchSize) {
    const batch = workspaceTests.slice(i, i + batchSize);
    await Promise.all(batch.map(async (wt) => {
      const key = wt.code ? wt.code.toLowerCase().trim() : wt.name.toLowerCase().trim();
      const defaultUpdatedAt = defaultMap[key];
      if (defaultUpdatedAt && !wt.defaultUpdatedAt) {
        await prisma.test.update({
          where: { id: wt.id },
          data: { defaultUpdatedAt }
        });
        count++;
      }
    }));
  }

  console.log(`Successfully bootstrapped ${count} workspace tests!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
