const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.$queryRawUnsafe(`SELECT id, name, workspaceId, expireAt, startAt FROM User WHERE expireAt IS NOT NULL`);
  console.log("Users with expireAt:", users);
  for (const u of users) {
    if (u.workspaceId && u.expireAt) {
      await prisma.$executeRawUnsafe(`UPDATE Workspace SET expireAt = ?, startAt = ? WHERE id = ?`, u.expireAt, u.startAt, u.workspaceId);
      console.log(`Updated Workspace ID ${u.workspaceId} from User ${u.name} with expiry ${u.expireAt}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
