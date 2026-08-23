const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const ws = await prisma.workspace.findFirst();
  console.log("Workspace:", ws);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
