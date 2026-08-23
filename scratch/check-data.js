const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const regs = await prisma.registration.findMany({
    take: 5,
    select: {
      id: true,
      regNo: true,
      date: true,
      status: true,
      totalAmount: true,
      collectionCharge: true,
      receivedAmount: true,
      dueAmount: true,
      payments: true,
    }
  });
  console.log("Sample Registrations:", JSON.stringify(regs, null, 2));

  const paymentCount = await prisma.registrationPayment.count();
  const regCount = await prisma.registration.count();
  console.log({ paymentCount, regCount });
}

main().catch(console.error).finally(() => prisma.$disconnect());
