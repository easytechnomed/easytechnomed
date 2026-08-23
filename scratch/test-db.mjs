import { prisma } from "../lib/db.js";

async function main() {
  console.log("Checking prisma models...");
  console.log("workspacePdf available in prisma?:", Boolean(prisma.workspacePdf));
  if (prisma.workspacePdf) {
    const count = await prisma.workspacePdf.count();
    console.log("workspacePdf count:", count);
  }
}

main().catch(console.error).finally(() => process.exit(0));
