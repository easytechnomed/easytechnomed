const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill for RegistrationTest prices...");
  
  const regTests = await prisma.registrationTest.findMany({
    include: {
      test: true
    }
  });

  console.log(`Found ${regTests.length} RegistrationTest records to process.`);

  let updatedCount = 0;
  for (const rt of regTests) {
    if (rt.test) {
      await prisma.registrationTest.update({
        where: {
          registrationId_testId: {
            registrationId: rt.registrationId,
            testId: rt.testId
          }
        },
        data: {
          price: rt.test.price
        }
      });
      updatedCount++;
    }
  }

  console.log(`Successfully backfilled ${updatedCount} RegistrationTest records with their historical/current prices.`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
