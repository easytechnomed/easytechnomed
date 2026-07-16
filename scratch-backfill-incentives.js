const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill for Doctor incentives...");
  
  // 1. Backfill DoctorIncentive history for all active doctors
  const doctors = await prisma.doctor.findMany({
    where: { isDeleted: false }
  });
  console.log(`Found ${doctors.length} doctors to insert incentive history for.`);
  
  let docsIncentiveCount = 0;
  for (const doc of doctors) {
    const existingHistory = await prisma.doctorIncentive.findFirst({
      where: { doctorId: doc.id }
    });
    if (!existingHistory) {
      await prisma.doctorIncentive.create({
        data: {
          doctorId: doc.id,
          incentivePercent: doc.incentivePercent,
          createdAt: doc.createdAt
        }
      });
      docsIncentiveCount++;
    }
  }
  console.log(`Successfully created ${docsIncentiveCount} DoctorIncentive history records.`);

  // 2. Backfill Registration snapshot incentives
  const registrations = await prisma.registration.findMany({
    where: {
      isDeleted: false
    },
    include: {
      refBy: true,
      secondRef: true
    }
  });

  console.log(`Found ${registrations.length} registrations to process.`);

  let updatedRegsCount = 0;
  for (const reg of registrations) {
    const data = {};
    if (reg.refBy) {
      data.refByIncentivePercent = reg.refBy.incentivePercent;
    }
    if (reg.secondRef) {
      data.secondRefIncentivePercent = reg.secondRef.incentivePercent;
    }

    if (Object.keys(data).length > 0) {
      await prisma.registration.update({
        where: { id: reg.id },
        data
      });
      updatedRegsCount++;
    }
  }

  console.log(`Successfully backfilled ${updatedRegsCount} registrations with doctor incentives.`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
