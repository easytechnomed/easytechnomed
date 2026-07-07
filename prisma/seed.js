const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

async function main() {
  console.log("Seeding database with workspaces and superadmin...");

  // 1. Create/Seed Default Workspace
  const defaultWorkspace = await prisma.workspace.upsert({
    where: { slug: "default-lab" },
    update: {},
    create: {
      name: "Default Lab",
      slug: "default-lab",
      isActive: true,
    },
  });
  console.log("Default Workspace seeded.");

  // 2. Create/Seed Default SuperAdmin
  const superAdminEmail = "superadmin@pathlab.com";
  const superAdminHashedPassword = await bcrypt.hash("Password123", 10);
  await prisma.superAdmin.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      name: "Super Admin",
      email: superAdminEmail,
      password: superAdminHashedPassword,
    },
  });
  console.log("Default SuperAdmin seeded.");

  // 3. Backfill Workspace ID for existing records
  await prisma.admin.updateMany({
    where: { workspaceId: null },
    data: { workspaceId: defaultWorkspace.id },
  });
  await prisma.doctor.updateMany({
    where: { workspaceId: null },
    data: { workspaceId: defaultWorkspace.id },
  });
  await prisma.registration.updateMany({
    where: { workspaceId: null },
    data: { workspaceId: defaultWorkspace.id },
  });
  await prisma.user.updateMany({
    where: { workspaceId: null },
    data: { workspaceId: defaultWorkspace.id },
  });
  console.log("Workspace backfilled for existing data.");

  // 4. Seed Customer Roles (UserRole)
  await prisma.userRole.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "Customer",
    },
  });

  // Seed Customer Permissions (UserRolePermission)
  const customerPermissions = ["customer:view"];
  for (const perm of customerPermissions) {
    await prisma.userRolePermission.upsert({
      where: {
        roleId_permission: {
          roleId: 2,
          permission: perm,
        },
      },
      update: {},
      create: {
        roleId: 2,
        permission: perm,
      },
    });
  }
  console.log("Customer roles & permissions seeded.");

  // 5. Seed Admin Roles (AdminRole)
  await prisma.adminRole.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Admin",
    },
  });

  // Seed Admin Permissions (AdminRolePermission)
  const adminPermissions = [
    "admin:approve", 
    "admin:reject", 
    "admin:view", 
    "customer:view", 
    "admin:create", 
    "admin:write", 
    "admin:delete"
  ];
  for (const perm of adminPermissions) {
    await prisma.adminRolePermission.upsert({
      where: {
        roleId_permission: {
          roleId: 1,
          permission: perm,
        },
      },
      update: {},
      create: {
        roleId: 1,
        permission: perm,
      },
    });
  }
  console.log("Admin roles & permissions seeded.");

  // 6. Seed Default Admin User associated with Default Workspace
  const adminEmail = "admin@pathlab.com";
  const hashedPassword = await bcrypt.hash("Password123", 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      workspaceId: defaultWorkspace.id,
    },
    create: {
      name: "System Admin",
      email: adminEmail,
      password: hashedPassword,
      provider: "credentials",
      roleId: 1, // Admin Role
      isEmailVerified: true,
      isApproved: true,
      workspaceId: defaultWorkspace.id,
    },
  });
  console.log("Default Admin user seeded.");

  // 7. Seed Default Doctors
  const doctors = [
    { name: "Ahmadi", code: "1" },
    { name: "ANAND KUMAR", code: "2" },
    { name: "Dr. Sarah Khan", code: "3" },
    { name: "Dr. Rajesh Sharma", code: "4" }
  ];

  for (const doc of doctors) {
    await prisma.doctor.upsert({
      where: {
        workspaceId_code: {
          workspaceId: defaultWorkspace.id,
          code: doc.code,
        },
      },
      update: {},
      create: {
        name: doc.name,
        code: doc.code,
        workspaceId: defaultWorkspace.id,
      },
    });
  }
  console.log("Default Doctors seeded.");

  // 8. Seed Tests from complete_test_names.json (Global)
  const fs = require("fs");
  const path = require("path");
  try {
    const filePath = path.join(__dirname, "../public/complete_test_names.json");
    if (fs.existsSync(filePath)) {
      const dataStr = fs.readFileSync(filePath, "utf-8");
      const rawTests = JSON.parse(dataStr);
      console.log(`Found ${rawTests.length} tests in JSON. Seeding...`);

      const seenCodes = new Set();
      const testData = [];

      for (const t of rawTests) {
        if (!t.test_name || !t.code) continue;
        if (seenCodes.has(t.code)) continue;
        seenCodes.add(t.code);

        // Generate stable price based on code character sum
        let priceSum = 0;
        for (let i = 0; i < t.code.length; i++) {
          priceSum += t.code.charCodeAt(i);
        }
        const price = (300 + (priceSum % 17) * 100).toFixed(2);

        testData.push({
          name: t.test_name.trim().replace(/^-\s+/, ""),
          code: t.code,
          price: parseFloat(price),
        });
      }

      const created = await prisma.test.createMany({
        data: testData,
        skipDuplicates: true,
      });
      console.log(`Seeded ${created.count} tests successfully.`);
    } else {
      console.log("complete_test_names.json file not found at " + filePath);
    }
    // 9. Post-process and seed parameters for all tests
    await processTestParameters();
  } catch (error) {
    console.error("Error seeding tests:", error);
  }
}

async function processTestParameters() {
  console.log("Processing test parameters...");
  const unprocessedTests = await prisma.test.findMany({
    where: { isProcessed: false },
    take: 200,
  });
  
  if (unprocessedTests.length === 0) {
    console.log("All test parameters are already processed!");
    return;
  }
  
  console.log(`Processing batch of ${unprocessedTests.length} tests...`);
  
  const parametersToCreate = [];
  const processedTestIds = [];
  
  for (const test of unprocessedTests) {
    const nameLower = test.name.toLowerCase();
    processedTestIds.push(test.id);
    
    if (nameLower.includes("cbc") || nameLower.includes("complete blood count") || nameLower.includes("hemogram")) {
      parametersToCreate.push(
        { testId: test.id, name: "TOTAL W.B.C. COUNT", minValMale: 4.0, maxValMale: 11.0, normalRangeMale: "4.00-11.00", minValFemale: 4.0, maxValFemale: 11.0, normalRangeFemale: "4.00-11.00", minValBaby: 5.0, maxValBaby: 19.0, normalRangeBaby: "5.00-19.00", normalRangeDefault: "4.00-11.00", unit: "10^3/µL", order: 1 },
        { testId: test.id, name: "RBC COUNT (Red Blood Cells)", minValMale: 4.5, maxValMale: 6.5, normalRangeMale: "4.5-6.5", minValFemale: 4.0, maxValFemale: 5.5, normalRangeFemale: "4.0-5.5", minValBaby: 3.8, maxValBaby: 5.2, normalRangeBaby: "3.8-5.2", normalRangeDefault: "4.0-6.5", unit: "10^6/µL", order: 2 },
        { testId: test.id, name: "PLATLETS COUNT", minValMale: 150000, maxValMale: 450000, normalRangeMale: "1,50,000-4,50,000", minValFemale: 150000, maxValFemale: 450000, normalRangeFemale: "1,50,000-4,50,000", minValBaby: 150000, maxValBaby: 450000, normalRangeBaby: "1,50,000-4,50,000", normalRangeDefault: "1,50,000-4,50,000", unit: "/µL", order: 3 },
        { testId: test.id, name: "1.Polymorphs Neutrophil", minValMale: 45, maxValMale: 65, normalRangeMale: "45-65", minValFemale: 45, maxValFemale: 65, normalRangeFemale: "45-65", minValBaby: 25, maxValBaby: 45, normalRangeBaby: "25-45", normalRangeDefault: "45-65", unit: "%", order: 4 },
        { testId: test.id, name: "2.Lymphocytes", minValMale: 20, maxValMale: 35, normalRangeMale: "20-35", minValFemale: 20, maxValFemale: 35, normalRangeFemale: "20-35", minValBaby: 45, maxValBaby: 65, normalRangeBaby: "45-65", normalRangeDefault: "20-35", unit: "%", order: 5 },
        { testId: test.id, name: "3.Eosinophils", minValMale: 1, maxValMale: 6, normalRangeMale: "1-6", minValFemale: 1, maxValFemale: 6, normalRangeFemale: "1-6", minValBaby: 1, maxValBaby: 6, normalRangeBaby: "1-6", normalRangeDefault: "1-6", unit: "%", order: 6 }
      );
    } else if (nameLower.includes("lipid") || nameLower.includes("cholesterol")) {
      parametersToCreate.push(
        { testId: test.id, name: "Total Cholesterol", minValMale: 130, maxValMale: 200, normalRangeMale: "130-200", minValFemale: 130, maxValFemale: 200, normalRangeFemale: "130-200", minValBaby: 110, maxValBaby: 170, normalRangeBaby: "110-170", normalRangeDefault: "130-200", unit: "mg/dL", order: 1 },
        { testId: test.id, name: "HDL Cholesterol", minValMale: 35, maxValMale: 55, normalRangeMale: "35-55", minValFemale: 40, maxValFemale: 65, normalRangeFemale: "40-65", minValBaby: 35, maxValBaby: 55, normalRangeBaby: "35-55", normalRangeDefault: "35-65", unit: "mg/dL", order: 2 },
        { testId: test.id, name: "LDL Cholesterol", minValMale: 70, maxValMale: 130, normalRangeMale: "70-130", minValFemale: 70, maxValFemale: 130, normalRangeFemale: "70-130", minValBaby: 60, maxValBaby: 110, normalRangeBaby: "60-110", normalRangeDefault: "70-130", unit: "mg/dL", order: 3 },
        { testId: test.id, name: "Triglycerides", minValMale: 60, maxValMale: 150, normalRangeMale: "60-150", minValFemale: 60, maxValFemale: 150, normalRangeFemale: "60-150", minValBaby: 50, maxValBaby: 120, normalRangeBaby: "50-120", normalRangeDefault: "60-150", unit: "mg/dL", order: 4 }
      );
    } else if (nameLower.includes("thyroid") || nameLower.includes("t3") || nameLower.includes("t4") || nameLower.includes("tsh")) {
      parametersToCreate.push(
        { testId: test.id, name: "T3 (Triiodothyronine)", minValMale: 0.8, maxValMale: 2.0, normalRangeMale: "0.8-2.0", minValFemale: 0.8, maxValFemale: 2.0, normalRangeFemale: "0.8-2.0", minValBaby: 0.9, maxValBaby: 2.5, normalRangeBaby: "0.9-2.5", normalRangeDefault: "0.8-2.0", unit: "ng/mL", order: 1 },
        { testId: test.id, name: "T4 (Thyroxine)", minValMale: 5.1, maxValMale: 14.1, normalRangeMale: "5.1-14.1", minValFemale: 5.1, maxValFemale: 14.1, normalRangeFemale: "5.1-14.1", minValBaby: 6.0, maxValBaby: 16.0, normalRangeBaby: "6.0-16.0", normalRangeDefault: "5.1-14.1", unit: "µg/dL", order: 2 },
        { testId: test.id, name: "TSH (Thyroid Stimulating Hormone)", minValMale: 0.5, maxValMale: 5.0, normalRangeMale: "0.5-5.0", minValFemale: 0.5, maxValFemale: 5.0, normalRangeFemale: "0.5-5.0", minValBaby: 0.7, maxValBaby: 8.0, normalRangeBaby: "0.7-8.0", normalRangeDefault: "0.5-5.0", unit: "µIU/mL", order: 3 }
      );
    } else if (nameLower.includes("glucose") || nameLower.includes("sugar")) {
      parametersToCreate.push(
        { testId: test.id, name: "Blood Glucose Fasting", minValMale: 70, maxValMale: 110, normalRangeMale: "70-110", minValFemale: 70, maxValFemale: 110, normalRangeFemale: "70-110", minValBaby: 60, maxValBaby: 100, normalRangeBaby: "60-100", normalRangeDefault: "70-110", unit: "mg/dL", order: 1 },
        { testId: test.id, name: "Blood Glucose Post Prandial", minValMale: 80, maxValMale: 140, normalRangeMale: "80-140", minValFemale: 80, maxValFemale: 140, normalRangeFemale: "80-140", minValBaby: 70, maxValBaby: 130, normalRangeBaby: "70-130", normalRangeDefault: "80-140", unit: "mg/dL", order: 2 }
      );
    } else {
      parametersToCreate.push({
        testId: test.id,
        name: test.name,
        minValMale: null,
        maxValMale: null,
        normalRangeMale: null,
        minValFemale: null,
        maxValFemale: null,
        normalRangeFemale: null,
        minValBaby: null,
        maxValBaby: null,
        normalRangeBaby: null,
        normalRangeDefault: "Normal / Negative",
        unit: "-NA-",
        order: 1
      });
    }
  }
  
  if (parametersToCreate.length > 0) {
    await prisma.testParameter.createMany({
      data: parametersToCreate,
      skipDuplicates: true
    });
  }
  
  await prisma.test.updateMany({
    where: { id: { in: processedTestIds } },
    data: { isProcessed: true }
  });
  
  console.log(`Processed parameters for ${processedTestIds.length} tests.`);
  
  // Recursively process next batch
  await processTestParameters();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
