import { PrismaClient } from '@prisma/client';
import { runFormulaEngine } from '../lib/formulaEngine.js';

const prisma = new PrismaClient();

async function main() {
  const regId = 1;

  // Let's delete existing results for regId 1 if any
  await prisma.patientResult.deleteMany({ where: { registrationId: regId } });

  // Let's find the test parameter IDs for complete blood count (CBC) test 228
  const testParameters = await prisma.testParameter.findMany({
    where: { testId: 228 },
    include: { parameter: true }
  });

  const getTPId = (name) => {
    const tp = testParameters.find(tp => tp.parameter.name === name);
    return tp ? tp.id : null;
  };

  // Define some manual inputs
  const inputs = {
    "Total W.B.C. Count": "8.0",
    "Haemoglobin": "14.0",
    "RBC Count (Red Blood Cells)": "4.5",
    "PCV (Haematocrit)": "42.0",
    "Polymorphs (Neutrophils)": "40.0",
    "Lymphocytes": "20.0",
    "Eosinophils": "1.0",
    "Monocytes": "2.0",
    // Basophils is left blank (no value)
  };

  console.log("Creating manual patient results...");
  for (const [name, val] of Object.entries(inputs)) {
    const tpId = getTPId(name);
    if (tpId) {
      await prisma.patientResult.create({
        data: {
          registrationId: regId,
          testParameterId: tpId,
          value: val
        }
      });
    } else {
      console.log(`Parameter not found: ${name}`);
    }
  }

  // Fetch current results
  let results = await prisma.patientResult.findMany({
    where: { registrationId: regId },
    include: {
      testParameter: {
        include: { parameter: true }
      }
    }
  });

  console.log("\nBEFORE FORMULA ENGINE RUN:");
  for (const r of results) {
    console.log(`- ${r.testParameter.parameter.name}: Value = ${r.value}, Flag = ${r.flag}`);
  }

  console.log("\nRunning Formula Engine...");
  await runFormulaEngine(regId);

  // Fetch results again
  results = await prisma.patientResult.findMany({
    where: { registrationId: regId },
    include: {
      testParameter: {
        include: { parameter: true }
      }
    }
  });

  console.log("\nAFTER FORMULA ENGINE RUN:");
  for (const r of results) {
    console.log(`- ${r.testParameter.parameter.name}: Value = ${r.value}, Flag = ${r.flag}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
