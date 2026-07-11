import { prisma } from "../lib/db.js";

async function main() {
  const p1 = await prisma.parameter.findUnique({ where: { id: 5142 } });
  const p2 = await prisma.parameter.findUnique({ where: { id: 5143 } });
  console.log("PARAMETER 5142:", p1);
  console.log("PARAMETER 5143:", p2);
}

main().catch(console.error);
