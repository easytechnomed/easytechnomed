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
    "admin:delete",
    "DASHBOARD_VIEW"
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

  // 7.5. Seed Default Test Departments (Global)
  console.log("Seeding default global departments...");
  const defaultDepartments = [
    "BIOCHEMISTRY",
    "CLINICAL PATHOLOGY",
    "CYTOLOGY",
    "HAEMATOLOGY",
    "HISTOPATHOLOGY",
    "IMMUNOLOGY",
    "MICRO-BIOLOGY",
    "Molecular Pathology",
    "ROUTINE",
    "SEROLOGY"
  ];
  
  const deptMap = {}; // name -> id
  for (const name of defaultDepartments) {
    const dept = await prisma.testDepartment.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    deptMap[name] = dept.id;
  }
  console.log("Default global departments seeded.");

  // 7.8. Cleanup Duplicate Global Tests (Keep first and re-link references)
  console.log("Cleaning up duplicate global tests...");
  const allGlobalTests = await prisma.test.findMany({
    where: { workspaceId: null, isDeleted: false },
    orderBy: { id: "asc" }
  });
  
  const codesMap = {}; // code -> firstId
  const duplicateIds = [];
  for (const test of allGlobalTests) {
    if (!test.code) continue;
    if (!codesMap[test.code]) {
      codesMap[test.code] = test.id;
    } else {
      duplicateIds.push(test.id);
    }
  }
  
  if (duplicateIds.length > 0) {
    console.log(`Re-linking and deleting ${duplicateIds.length} duplicate global tests...`);
    for (const dupId of duplicateIds) {
      const testObj = allGlobalTests.find(t => t.id === dupId);
      const firstId = codesMap[testObj.code];
      
      // Re-link registrations referencing duplicate
      await prisma.registrationTest.updateMany({
        where: { testId: dupId },
        data: { testId: firstId }
      });
      
      // Re-link test parameters referencing duplicate
      await prisma.testParameter.updateMany({
        where: { testId: dupId },
        data: { testId: firstId }
      });
    }
    
    // Delete duplicate tests safely
    await prisma.test.deleteMany({
      where: { id: { in: duplicateIds } }
    });
    console.log(`Duplicate cleanup complete. Deleted ${duplicateIds.length} tests.`);
  }

  try {
    // 8.5. Backfill existing tests that don't have departmentId
    console.log("Backfilling existing tests with departmentId...");
    const existingTestsWithNoDept = await prisma.test.findMany({
      where: { departmentId: null }
    });
    console.log(`Found ${existingTestsWithNoDept.length} tests with no department assigned. Classification in progress...`);
    
    // Group test IDs by departmentId
    const updates = {}; // deptId -> array of testIds
    for (const test of existingTestsWithNoDept) {
      const deptName = getDepartmentName(test.name);
      const departmentId = deptMap[deptName];
      if (departmentId) {
        if (!updates[departmentId]) {
          updates[departmentId] = [];
        }
        updates[departmentId].push(test.id);
      }
    }
    
    // Perform bulk updates
    let backfilledCount = 0;
    for (const [departmentId, testIds] of Object.entries(updates)) {
      const parsedDeptId = parseInt(departmentId);
      const res = await prisma.test.updateMany({
        where: { id: { in: testIds } },
        data: { departmentId: parsedDeptId }
      });
      backfilledCount += res.count;
      console.log(`Updated ${res.count} tests to department ID ${parsedDeptId}`);
    }
    console.log(`Backfilled ${backfilledCount} tests successfully.`);

    // 9. Post-process and seed parameters for all tests
    await processTestParameters();

    // 10. Seed LIMS Formulas, Sections, Borderline Ranges, and Interpretation Rules
    await seedLimsFormulasAndConfigurations();
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
  
  for (const p of parametersToCreate) {
    const normName = p.name.trim();

    // Resolve or create parameter in the master Parameter table
    let parameter = await prisma.parameter.findFirst({
      where: { name: { equals: normName } }
    });

    const pData = {
      name: normName,
      unit: p.unit,
      minValMale: p.minValMale,
      maxValMale: p.maxValMale,
      normalRangeMale: p.normalRangeMale,
      minValFemale: p.minValFemale,
      maxValFemale: p.maxValFemale,
      normalRangeFemale: p.normalRangeFemale,
      minValBaby: p.minValBaby,
      maxValBaby: p.maxValBaby,
      normalRangeBaby: p.normalRangeBaby,
      normalRangeDefault: p.normalRangeDefault,
    };

    if (!parameter) {
      parameter = await prisma.parameter.create({
        data: pData
      });
    }

    try {
      await prisma.testParameter.create({
        data: {
          testId: p.testId,
          parameterId: parameter.id,
          order: p.order,
        }
      });
    } catch (err) {
      console.error(`[ERROR] Failed to insert TestParameter: testId=${p.testId}, parameterId=${parameter.id} (${parameter.name}), order=${p.order}. details:`, err);
      throw err;
    }
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

function getDepartmentName(testName) {
  const name = testName.toLowerCase();
  
  // HAEMATOLOGY
  if (
    name.includes("hgb") || name.includes("hemoglobin") || name.includes("haemoglobin") ||
    name.includes("rbc") || name.includes("wbc") || name.includes("platelet") ||
    name.includes("cbc") || name.includes("esr") || name.includes("pcv") ||
    name.includes("diff") || name.includes("dlc") || name.includes("blood") ||
    name.includes("leukocyte") || name.includes("eosinophil") || name.includes("neutrophil") ||
    name.includes("lymphocyte") || name.includes("monocyte") || name.includes("basophil") ||
    name.includes("cell count") || name.includes("smear") || name.includes("coagulation") ||
    name.includes("pt-") || name.includes("aptt") || name.includes("bleeding") ||
    name.includes("clotting") || name.includes("retic") || name.includes("malaria") ||
    name.includes("mp ") || name.includes("blood group") || name.includes("rh type") ||
    name.includes("coombs") || name.includes("erythrocyte") || name.includes("anemia") ||
    name.includes("pack cell") || name.includes("iron profile") || name.includes("ferritin") ||
    name.includes("transferrin")
  ) {
    return "HAEMATOLOGY";
  }
  
  // CYTOLOGY
  if (
    name.includes("fnac") || name.includes("pap smear") || name.includes("cytology") ||
    name.includes("fluid cytology") || name.includes(" pleural ") || name.includes(" ascites ") ||
    name.includes("csf cytology") || name.includes("bronte") || name.includes("aspirate")
  ) {
    return "CYTOLOGY";
  }
  
  // HISTOPATHOLOGY
  if (
    name.includes("biopsy") || name.includes("histopathology") || name.includes("appendix") ||
    name.includes("tissue") || name.includes("specimen") || name.includes("section") ||
    name.includes("tumor") || name.includes("cyst") || name.includes("gall bladder") ||
    name.includes("radical") || name.includes("resection") || name.includes("excision")
  ) {
    return "HISTOPATHOLOGY";
  }
  
  // MICRO-BIOLOGY
  if (
    name.includes("culture") || name.includes("sensitivity") || name.includes("micro-biology") ||
    name.includes("microbiology") || name.includes("fungal") || name.includes("fungus") ||
    name.includes("gram stain") || name.includes("afb stain") || name.includes("smear for afb") ||
    name.includes("sputum for afb") || name.includes("tb pcr") || name.includes("parasite") ||
    name.includes("microscopic") || name.includes("bacterial") || name.includes("pathogen")
  ) {
    return "MICRO-BIOLOGY";
  }
  
  // Molecular Pathology
  if (
    name.includes("molecular") || name.includes("pcr") || name.includes("dna") ||
    name.includes("rna") || name.includes("genotype") || name.includes("hla ") ||
    name.includes("mutational") || name.includes("sequencing") || name.includes("karyotyp") ||
    name.includes("gene") || name.includes("chromosom") || name.includes("fish ")
  ) {
    return "Molecular Pathology";
  }
  
  // IMMUNOLOGY
  if (
    name.includes("immunology") || name.includes("ana ") || name.includes("dsdna") ||
    name.includes("autoantibody") || name.includes("rheumatoid") || name.includes("ra factor") ||
    name.includes("immunoglobulin") || name.includes("igg") || name.includes("iga") ||
    name.includes("igm") || name.includes("ige") || name.includes("complements") ||
    name.includes("c3 ") || name.includes("c4 ") || name.includes("allergen") ||
    name.includes("allergy") || name.includes("anti-")
  ) {
    return "IMMUNOLOGY";
  }
  
  // SEROLOGY
  if (
    name.includes("serology") || name.includes("hiv") || name.includes("hbsag") ||
    name.includes("hcv") || name.includes("vdrl") || name.includes("rpr") ||
    name.includes("widal") || name.includes("typhoid") || name.includes("dengue") ||
    name.includes("chikungunya") || name.includes("crp") || name.includes("c-reactive") ||
    name.includes("aso") || name.includes("syphilis") || name.includes("elisa") ||
    name.includes("antibody") || name.includes("antigen") || name.includes("serum") &&
    (name.includes("t3") || name.includes("t4") || name.includes("tsh"))
  ) {
    return "SEROLOGY";
  }

  // CLINICAL PATHOLOGY
  if (
    name.includes("urine") || name.includes("stool") || name.includes("semen") ||
    name.includes("physical examination") || name.includes("chemical examination") ||
    name.includes("occult blood") || name.includes("fluid analysis") ||
    name.includes("csf analysis") || name.includes("pregnancy test") || name.includes("upt") ||
    name.includes("clinical pathology")
  ) {
    return "CLINICAL PATHOLOGY";
  }
  
  // BIOCHEMISTRY
  if (
    name.includes("biochemistry") || name.includes("glucose") || name.includes("sugar") ||
    name.includes("cholesterol") || name.includes("lipid") || name.includes("triglyceride") ||
    name.includes("urea") || name.includes("creatinine") || name.includes("uric acid") ||
    name.includes("bilirubin") || name.includes("lft") || name.includes("kft") ||
    name.includes("rft") || name.includes("sgot") || name.includes("sgpt") ||
    name.includes("alkaline phosphatase") || name.includes("protein") || name.includes("albumin") ||
    name.includes("globulin") || name.includes("calcium") || name.includes("phosphorus") ||
    name.includes("sodium") || name.includes("potassium") || name.includes("chloride") ||
    name.includes("electrolyte") || name.includes("amylase") || name.includes("lipase") ||
    name.includes("enzyme") || name.includes("vitamin") || name.includes("hormone") ||
    name.includes("thyroid") || name.includes("t3") || name.includes("t4") ||
    name.includes("tsh") || name.includes("ldh") || name.includes("hb1ac") ||
    name.includes("hba1c") || name.includes("glycated") || name.includes("insulin") ||
    name.includes("cardiac markers") || name.includes("troponin") || name.includes("ck-mb")
  ) {
    return "BIOCHEMISTRY";
  }
  
  return "ROUTINE";
}

async function seedLimsFormulasAndConfigurations() {
  console.log("Seeding advanced LIMS formulas, sections, borderline ranges, and interpretation rules...");

  // 1. Define parameter configurations (mapping name matches to shortcodes and borderline ranges)
  const paramConfigs = [
    // CBC
    { match: "Total W.B.C. Count", code: "WBC", borderlineMin: 3.8, borderlineMax: 11.5 },
    { match: "RBC Count (Red Blood Cells)", code: "RBC", borderlineMin: 4.2, borderlineMax: 6.6 },
    { match: "Haemoglobin", code: "HB", borderlineMin: 13.0, borderlineMax: 18.0 },
    { match: "Hemoglobin", code: "HB", borderlineMin: 13.0, borderlineMax: 18.0 },
    { match: "PCV (Haematocrit)", code: "PCV", borderlineMin: 39.0, borderlineMax: 55.0 },
    { match: "Polymorphs (Neutrophils)", code: "NEUT", borderlineMin: 40, borderlineMax: 70 },
    { match: "Lymphocytes", code: "LYMPH", borderlineMin: 18, borderlineMax: 40 },
    { match: "Eosinophils", code: "EOS", borderlineMin: 0.5, borderlineMax: 7 },
    { match: "Monocytes", code: "MONO", borderlineMin: 1, borderlineMax: 11 },
    { match: "Basophils", code: "BASO", borderlineMin: 0.2, borderlineMax: 2 },
    { match: "MCV", code: "MCV", borderlineMin: 80, borderlineMax: 100 },
    { match: "MCH", code: "MCH", borderlineMin: 27, borderlineMax: 33 },
    { match: "MCHC", code: "MCHC", borderlineMin: 31, borderlineMax: 37 },
    { match: "Absolute Neutrophil Count", code: "ANC", borderlineMin: 1.4, borderlineMax: 8.2 },
    { match: "Absolute Lymphocytes Count", code: "ALC", borderlineMin: 0.8, borderlineMax: 4.2 },
    { match: "Absolute Eosinophil Count", code: "AEC", borderlineMin: 0.04, borderlineMax: 0.55 },
    { match: "Absolute Monocytes Count", code: "AMC", borderlineMin: 0.08, borderlineMax: 0.85 },
    
    // Lipid
    { match: "Total Cholesterol", code: "TC", borderlineMin: 120, borderlineMax: 220 },
    { match: "Triglycerides", code: "TG", borderlineMin: 50, borderlineMax: 170 },
    { match: "HDL Cholesterol", code: "HDL", borderlineMin: 30, borderlineMax: 70 },
    { match: "LDL Cholesterol", code: "LDL", borderlineMin: 60, borderlineMax: 140 },
    { match: "VLDL Cholesterol", code: "VLDL", borderlineMin: 10, borderlineMax: 35 },
    
    // LFT
    { match: "Total Bilirubin", code: "TB", borderlineMin: 0.1, borderlineMax: 1.4 },
    { match: "Direct Bilirubin", code: "DB", borderlineMin: 0, borderlineMax: 0.4 },
    { match: "Indirect Bilirubin", code: "IB", borderlineMin: 0.1, borderlineMax: 0.9 },
    { match: "SGOT (AST)", code: "AST", borderlineMin: 5, borderlineMax: 45 },
    { match: "SGPT (ALT)", code: "ALT", borderlineMin: 5, borderlineMax: 55 },
    { match: "Alkaline Phosphatase", code: "ALP", borderlineMin: 30, borderlineMax: 130 },
    { match: "Total Protein", code: "TP", borderlineMin: 6.0, borderlineMax: 8.5 },
    { match: "Albumin", code: "ALB", borderlineMin: 3.2, borderlineMax: 5.5 },
    { match: "Globulin", code: "GLOB", borderlineMin: 1.8, borderlineMax: 3.7 },
    { match: "Albumin/Globulin Ratio", code: "AGR", borderlineMin: 0.8, borderlineMax: 2.2 },
    
    // Renal
    { match: "Blood Urea", code: "UREA", borderlineMin: 10, borderlineMax: 45 },
    { match: "Serum Creatinine", code: "CREAT", borderlineMin: 0.5, borderlineMax: 1.4 },
    { match: "Blood Urea Nitrogen (BUN)", code: "BUN", borderlineMin: 5, borderlineMax: 22 },
    { match: "BUN/Creatinine Ratio", code: "BCR", borderlineMin: 8, borderlineMax: 22 },
    { match: "Urea/Creatinine Ratio", code: "UCR", borderlineMin: 15, borderlineMax: 35 },
    { match: "Serum Sodium (Na+)", code: "NA", borderlineMin: 132, borderlineMax: 147 },
    { match: "Serum Potassium (K+)", code: "K", borderlineMin: 3.3, borderlineMax: 5.3 },
    { match: "Serum Chloride (Cl-)", code: "CL", borderlineMin: 95, borderlineMax: 109 },
    { match: "Serum Bicarbonate (HCO3-)", code: "HCO3", borderlineMin: 20, borderlineMax: 31 },

    // HbA1c
    { match: "HbA1c", code: "HBA1C", borderlineMin: 5.5, borderlineMax: 6.5 },
    { match: "Estimated Average Glucose (eAG)", code: "EAG", borderlineMin: 100, borderlineMax: 130 },

    // Urine PCR
    { match: "Urine Protein/Creatinine Ratio", code: "UPCR", borderlineMin: 0.1, borderlineMax: 0.2 },
    { match: "Urine Protein", code: "U_PROT", borderlineMin: 10, borderlineMax: 150 },
    { match: "Urine Creatinine", code: "U_CREAT", borderlineMin: 300, borderlineMax: 2000 },
    { match: "Urine Protein/Creatinine Ratio (24h)", code: "UPCR_24", borderlineMin: 0.1, borderlineMax: 0.2 },
    { match: "24-Hour Urine Protein", code: "U_PROT_24", borderlineMin: 10, borderlineMax: 150 },
    { match: "24-Hour Urine Creatinine", code: "U_CREAT_24", borderlineMin: 300, borderlineMax: 2000 }
  ];

  // Update Parameter codes and borderline ranges in the DB
  for (const cfg of paramConfigs) {
    const params = await prisma.parameter.findMany({
      where: { name: { equals: cfg.match } }
    });
    
    for (const param of params) {
      await prisma.parameter.update({
        where: { id: param.id },
        data: {
          code: cfg.code,
          borderlineMinValMale: cfg.borderlineMin,
          borderlineMaxValMale: cfg.borderlineMax,
          borderlineMinValFemale: cfg.borderlineMin,
          borderlineMaxValFemale: cfg.borderlineMax,
          borderlineMinValDefault: cfg.borderlineMin,
          borderlineMaxValDefault: cfg.borderlineMax
        }
      });
    }
  }
  console.log("Parameter codes and borderline ranges backfilled in database.");

  // 2. Define Test configurations (Sections, isCalculated properties)
  const testConfigs = [
    {
      testId: 228, // CBC
      params: [
        { name: "Complete Blood Count (CBC)", section: "CBC" },
        { name: "Total W.B.C. Count", section: "CBC" },
        { name: "RBC Count (Red Blood Cells)", section: "CBC" },
        { name: "Platelets Count", section: "CBC" },
        { name: "Haemoglobin", section: "CBC" },
        { name: "Hemoglobin", section: "CBC" },
        { name: "PCV (Haematocrit)", section: "CBC" },
        { name: "Differential Count of WBC", section: "Differential Count" },
        { name: "Polymorphs (Neutrophils)", section: "Differential Count" },
        { name: "Lymphocytes", section: "Differential Count" },
        { name: "Eosinophils", section: "Differential Count" },
        { name: "Monocytes", section: "Differential Count" },
        { name: "Basophils", section: "Differential Count" },
        { name: "MCV", section: "Calculated Parameters", isCalculated: true, dec: 1 },
        { name: "MCH", section: "Calculated Parameters", isCalculated: true, dec: 1 },
        { name: "MCHC", section: "Calculated Parameters", isCalculated: true, dec: 1 },
        { name: "Absolute Neutrophil Count", section: "Calculated Parameters", isCalculated: true, dec: 2 },
        { name: "Absolute Lymphocytes Count", section: "Calculated Parameters", isCalculated: true, dec: 2 },
        { name: "Absolute Eosinophil Count", section: "Calculated Parameters", isCalculated: true, dec: 2 },
        { name: "Absolute Monocytes Count", section: "Calculated Parameters", isCalculated: true, dec: 2 }
      ]
    },
    {
      testId: 512, // LFT
      params: [
        { name: "Total Bilirubin", section: "Bilirubin" },
        { name: "Direct Bilirubin", section: "Bilirubin" },
        { name: "Indirect Bilirubin", section: "Bilirubin", isCalculated: true, dec: 2 },
        { name: "SGOT (AST)", section: "Enzymes" },
        { name: "SGPT (ALT)", section: "Enzymes" },
        { name: "Alkaline Phosphatase", section: "Enzymes" },
        { name: "Gamma Glutamyl Transferase (GGT)", section: "Enzymes" },
        { name: "Total Protein", section: "Proteins" },
        { name: "Albumin", section: "Proteins" },
        { name: "Globulin", section: "Proteins", isCalculated: true, dec: 2 },
        { name: "Albumin/Globulin Ratio", section: "Proteins", isCalculated: true, dec: 2 }
      ]
    },
    {
      testId: 509, // Lipid
      params: [
        { name: "Total Cholesterol", section: "Primary Lipids" },
        { name: "Triglycerides", section: "Primary Lipids" },
        { name: "HDL Cholesterol", section: "Primary Lipids" },
        { name: "LDL Cholesterol", section: "Calculated Fractions", isCalculated: true, dec: 2 },
        { name: "VLDL Cholesterol", section: "Calculated Fractions", isCalculated: true, dec: 2 }
      ]
    },
    {
      testId: 695, // Renal
      params: [
        { name: "Blood Urea", section: "Nitrogenous Waste" },
        { name: "Blood Urea Nitrogen (BUN)", section: "Nitrogenous Waste", isCalculated: true, dec: 2 },
        { name: "Serum Creatinine", section: "Creatinine Profile" },
        { name: "BUN/Creatinine Ratio", section: "Creatinine Profile", isCalculated: true, dec: 2 },
        { name: "Urea/Creatinine Ratio", section: "Creatinine Profile", isCalculated: true, dec: 2 },
        { name: "Serum Uric Acid", section: "Uric Acid Profile" },
        { name: "Serum Sodium (Na+)", section: "Electrolytes" },
        { name: "Serum Potassium (K+)", section: "Electrolytes" },
        { name: "Serum Chloride (Cl-)", section: "Electrolytes" }
      ]
    },
    {
      testId: 377, // HbA1c
      params: [
        { name: "HbA1c", section: "Glycated Hemoglobin" },
        { name: "Estimated Average Glucose (eAG)", section: "Calculated Glucose", isCalculated: true, dec: 1 }
      ]
    },
    {
      testId: 662, // Urine PCR
      params: [
        { name: "Urine Protein", section: "Observed" },
        { name: "Urine Creatinine", section: "Observed" },
        { name: "Urine Protein/Creatinine Ratio", section: "Calculated Ratio", isCalculated: true, dec: 2 }
      ]
    }
  ];

  // Seed sections, decimal place precision, and isCalculated in TestParameter
  for (const tCfg of testConfigs) {
    const test = await prisma.test.findFirst({ where: { id: tCfg.testId } });
    if (!test) continue;

    for (const pCfg of tCfg.params) {
      const parameter = await prisma.parameter.findFirst({ where: { name: pCfg.name } });
      if (!parameter) continue;

      await prisma.testParameter.updateMany({
        where: { testId: test.id, parameterId: parameter.id },
        data: {
          section: pCfg.section,
          isCalculated: !!pCfg.isCalculated,
          editable: !pCfg.isCalculated,
          decimalPlace: pCfg.dec !== undefined ? pCfg.dec : 2,
          roundingMethod: "HALF_UP"
        }
      });
    }
  }
  console.log("TestParameter sections and calculations configured.");

  // 3. Define math formulas (mapping output parameter ID to formula string)
  const formulaConfigs = [
    // CBC formulas for Test ID 228
    { testId: 228, outName: "MCV", formula: "ROUND((PCV * 10) / RBC, 1)" },
    { testId: 228, outName: "MCH", formula: "ROUND((HB * 10) / RBC, 1)" },
    { testId: 228, outName: "MCHC", formula: "ROUND((HB * 100) / PCV, 1)" },
    { testId: 228, outName: "Absolute Neutrophil Count", formula: "ROUND((WBC * NEUT) / 100, 2)" },
    { testId: 228, outName: "Absolute Lymphocytes Count", formula: "ROUND((WBC * LYMPH) / 100, 2)" },
    { testId: 228, outName: "Absolute Eosinophil Count", formula: "ROUND((WBC * EOS) / 100, 2)" },
    { testId: 228, outName: "Absolute Monocytes Count", formula: "ROUND((WBC * MONO) / 100, 2)" },
    
    // Lipid formulas for Test ID 509
    { testId: 509, outName: "LDL Cholesterol", formula: "ROUND(TC - HDL - (TG / 5), 2)" },
    
    // LFT formulas for Test ID 512
    { testId: 512, outName: "Indirect Bilirubin", formula: "ROUND(TB - DB, 2)" },
    { testId: 512, outName: "Globulin", formula: "ROUND(TP - ALB, 2)" },
    { testId: 512, outName: "Albumin/Globulin Ratio", formula: "ROUND(ALB / (TP - ALB), 2)" },

    // Renal formulas for Test ID 695
    { testId: 695, outName: "Blood Urea Nitrogen (BUN)", formula: "ROUND(UREA * 0.467, 2)" },
    { testId: 695, outName: "BUN/Creatinine Ratio", formula: "ROUND((UREA * 0.467) / CREAT, 2)" },
    { testId: 695, outName: "Urea/Creatinine Ratio", formula: "ROUND(UREA / CREAT, 2)" },

    // HbA1c formula for Test ID 377
    { testId: 377, outName: "Estimated Average Glucose (eAG)", formula: "ROUND((28.7 * HBA1C) - 46.7, 1)" },

    // Urine PCR formula for Test ID 662
    { testId: 662, outName: "Urine Protein/Creatinine Ratio", formula: "ROUND(U_PROT / U_CREAT, 2)" }
  ];

  // Insert formulas
  for (const fCfg of formulaConfigs) {
    const outParam = await prisma.parameter.findFirst({ where: { name: fCfg.outName } });
    if (!outParam) continue;

    const existingFormula = await prisma.testFormula.findFirst({
      where: {
        workspaceId: null,
        testId: fCfg.testId,
        outputParameterId: outParam.id
      }
    });

    if (existingFormula) {
      await prisma.testFormula.update({
        where: { id: existingFormula.id },
        data: { formula: fCfg.formula, version: 1, isActive: true }
      });
    } else {
      await prisma.testFormula.create({
        data: {
          workspaceId: null,
          testId: fCfg.testId,
          outputParameterId: outParam.id,
          formula: fCfg.formula,
          version: 1,
          isActive: true
        }
      });
    }
  }
  console.log("Advanced LIMS mathematical formulas seeded successfully.");

  // 4. Seeding Interpretation Rules
  const interpretationRules = [
    { testId: 228, paramName: "Hemoglobin", cond: "value < 10.0", text: "Suggestive of moderate anemia. Clinical correlation advised." },
    { testId: 377, paramName: "HbA1c", cond: "value >= 6.5", text: "Meets American Diabetes Association (ADA) criteria for Diabetes Mellitus." },
    { testId: 509, paramName: "LDL Cholesterol", cond: "value > 190.0", text: "Very High Cardiovascular Risk. Diet modifications and lipid-lowering therapy advised." },
    { testId: 662, paramName: "Urine Protein/Creatinine Ratio", cond: "value > 0.15", text: "Suggestive of significant Proteinuria. Monitor renal function." }
  ];

  for (const rule of interpretationRules) {
    const param = await prisma.parameter.findFirst({ where: { name: rule.paramName } });
    if (!param) continue;

    const existingRule = await prisma.interpretationRule.findFirst({
      where: { testId: rule.testId, parameterId: param.id }
    });

    if (!existingRule) {
      await prisma.interpretationRule.create({
        data: {
          testId: rule.testId,
          parameterId: param.id,
          condition: rule.cond,
          interpretation: rule.text
        }
      });
    } else {
      await prisma.interpretationRule.update({
        where: { id: existingRule.id },
        data: { condition: rule.cond, interpretation: rule.text }
      });
    }
  }
  console.log("Pathological interpretation rules seeded successfully.");
}
