const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const generateRandomSuffix = (length = 4) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

async function main() {
  console.log("Starting backfill for Workspace counters and Registration formatting (ETM-RANDOM-00001)...");
  
  const workspaces = await prisma.workspace.findMany();
  console.log(`Found ${workspaces.length} workspaces to process.`);

  let totalUpdatedRegs = 0;

  for (const w of workspaces) {
    // Get the first admin of the workspace to use as default adminId
    const firstAdmin = await prisma.admin.findFirst({
      where: { workspaceId: w.id }
    });
    const defaultAdminId = firstAdmin ? firstAdmin.id : 1;

    // Fetch all active registrations in this workspace sorted by date
    const registrations = await prisma.registration.findMany({
      where: { workspaceId: w.id, isDeleted: false },
      orderBy: { date: "asc" }
    });

    console.log(`Workspace ID ${w.id} (${w.name}): Found ${registrations.length} active registrations.`);

    let seq = 1;
    for (const reg of registrations) {
      const formattedLabId = String(seq).padStart(3, '0');
      const randomPart = generateRandomSuffix(4);
      const formattedRegNo = `ETM-${randomPart}-${String(seq).padStart(5, '0')}`;

      // Update registration with new standardized regNo, labId, and adminId
      await prisma.registration.update({
        where: { id: reg.id },
        data: {
          labId: formattedLabId,
          regNo: formattedRegNo,
          adminId: defaultAdminId
        }
      });
      seq++;
      totalUpdatedRegs++;
    }

    // Set the workspace's nextSequence to the next value in line
    await prisma.workspace.update({
      where: { id: w.id },
      data: {
        nextSequence: seq
      }
    });

    console.log(`Workspace ID ${w.id} (${w.name}): set nextSequence to ${seq}`);
  }

  console.log(`Successfully backfilled ${totalUpdatedRegs} registrations and aligned counters.`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
