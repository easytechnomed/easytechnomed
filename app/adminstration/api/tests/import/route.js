import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

// Helper to generate unique 6-character code (letters + digits)
async function generateUniqueCode(tx, name, workspaceId) {
  // Extract initials or clean letters from name
  let cleaned = name.toUpperCase().replace(/[^A-Z0-9\s]/g, "");
  let words = cleaned.split(/\s+/).filter(Boolean);
  let prefix = "";

  if (words.length >= 3) {
    prefix = words.slice(0, 3).map(w => w[0]).join("");
  } else if (words.length === 2) {
    prefix = words[0][0] + words[1].slice(0, 2);
  } else if (words.length === 1) {
    prefix = words[0].slice(0, 3);
  }

  // Fallback if prefix is empty
  prefix = (prefix || "TST").slice(0, 3).padEnd(3, "X");

  // Ensure prefix only contains letters A-Z (no digits in prefix, digits will be suffix)
  prefix = prefix.replace(/[^A-Z]/g, "X");

  // Query existing codes starting with this prefix in this workspace
  const existingTests = await tx.test.findMany({
    where: {
      workspaceId: workspaceId,
      code: { startsWith: prefix },
    },
    select: { code: true },
  });

  const usedSuffixes = new Set(
    existingTests
      .map(t => t.code ? t.code.slice(3) : "")
      .filter(s => s.length === 3 && /^\d+$/.test(s))
      .map(Number)
  );

  // Find first available 3-digit number from 100 to 999 to guarantee exactly 6 characters (e.g. CBC100)
  let num = 100;
  while (num < 1000) {
    if (!usedSuffixes.has(num)) {
      return `${prefix}${num}`;
    }
    num++;
  }

  // Fallback: search for any available suffix using random digits
  const digits = "0123456789";
  for (let attempt = 0; attempt < 100; attempt++) {
    let suffix = "";
    for (let i = 0; i < 3; i++) {
      suffix += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    const candidate = `${prefix}${suffix}`;
    const exists = existingTests.some(t => t.code === candidate);
    if (!exists) {
      return candidate;
    }
  }

  // Final fallback: standard random unique code
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper to seed clinical parameters matching the structure in process-dynamic-parameters
async function seedParametersForTest(tx, testId, name) {
  const nameLower = name.toLowerCase();
  const parametersToCreate = [];

  if (nameLower.includes("cbc") || nameLower.includes("complete blood count") || nameLower.includes("hemogram")) {
    parametersToCreate.push(
      { testId, name: "TOTAL W.B.C. COUNT", minValMale: 4.0, maxValMale: 11.0, normalRangeMale: "4.00-11.00", minValFemale: 4.0, maxValFemale: 11.0, normalRangeFemale: "4.00-11.00", minValBaby: 5.0, maxValBaby: 19.0, normalRangeBaby: "5.00-19.00", normalRangeDefault: "4.00-11.00", unit: "10^3/µL", order: 1 },
      { testId, name: "RBC COUNT (Red Blood Cells)", minValMale: 4.0, maxValMale: 6.5, normalRangeMale: "4.0 - 6.5", minValFemale: 4.0, maxValFemale: 6.5, normalRangeFemale: "4.0 - 6.5", minValBaby: 3.8, maxValBaby: 5.2, normalRangeBaby: "3.8-5.2", normalRangeDefault: "4.0 - 6.5", unit: "10^6/µL", order: 2 },
      { testId, name: "PLATLETS COUNT", minValMale: 150000, maxValMale: 450000, normalRangeMale: "1,50,000-4,50,000", minValFemale: 150000, maxValFemale: 450000, normalRangeFemale: "1,50,000-4,50,000", minValBaby: 150000, maxValBaby: 450000, normalRangeBaby: "1,50,000-4,50,000", normalRangeDefault: "1,50,000-4,50,000", unit: "/µL", order: 3 },
      { testId, name: "1.Polymorphs Neutrophil", minValMale: 45, maxValMale: 65, normalRangeMale: "45 - 65", minValFemale: 45, maxValFemale: 65, normalRangeFemale: "45 - 65", minValBaby: 25, maxValBaby: 45, normalRangeBaby: "25-45", normalRangeDefault: "45 - 65", unit: "%", order: 4 },
      { testId, name: "2.Lymphocytes", minValMale: 20, maxValMale: 35, normalRangeMale: "20 - 35", minValFemale: 20, maxValFemale: 35, normalRangeFemale: "20 - 35", minValBaby: 45, maxValBaby: 65, normalRangeBaby: "45-65", normalRangeDefault: "20 - 35", unit: "%", order: 5 },
      { testId, name: "3.Eosinophils", minValMale: 1, maxValMale: 6, normalRangeMale: "1 - 6", minValFemale: 1, maxValFemale: 6, normalRangeFemale: "1 - 6", minValBaby: 1, maxValBaby: 6, normalRangeBaby: "1-6", normalRangeDefault: "1 - 6", unit: "%", order: 6 },
      { testId, name: "4.Monocytes", minValMale: 0, maxValMale: 6, normalRangeMale: "0 - 6", minValFemale: 0, maxValFemale: 6, normalRangeFemale: "0 - 6", minValBaby: 0, maxValBaby: 6, normalRangeBaby: "0 - 6", normalRangeDefault: "0 - 6", unit: "%", order: 7 },
      { testId, name: "5.Basophil", minValMale: 0, maxValMale: 1, normalRangeMale: "0 - 1", minValFemale: 0, maxValFemale: 1, normalRangeFemale: "0 - 1", minValBaby: 0, maxValBaby: 1, normalRangeBaby: "0 - 1", normalRangeDefault: "0 - 1", unit: "%", order: 8 },
      { testId, name: "Haemoglobin", minValMale: 13.0, maxValMale: 17.0, normalRangeMale: "13.0-17.0", minValFemale: 12.0, maxValFemale: 15.0, normalRangeFemale: "12.0-15.0", minValBaby: 11.0, maxValBaby: 14.0, normalRangeBaby: "11.0-14.0", normalRangeDefault: "12.0-16.0", unit: "g/dL", order: 9 },
      { testId, name: "PCV (Haematocrit)", minValMale: 42, maxValMale: 52, normalRangeMale: "42 - 52", minValFemale: 37, maxValFemale: 47, normalRangeFemale: "37 - 47", minValBaby: 35, maxValBaby: 45, normalRangeBaby: "35 - 45", normalRangeDefault: "42 - 52", unit: "%", order: 10 },
      { testId, name: "MCV", minValMale: 82, maxValMale: 98, normalRangeMale: "82-98", minValFemale: 82, maxValFemale: 98, normalRangeFemale: "82-98", minValBaby: 75, maxValBaby: 95, normalRangeBaby: "75-95", normalRangeDefault: "82-98", unit: "fl", order: 11 },
      { testId, name: "MCH", minValMale: 27, maxValMale: 32, normalRangeMale: "27-32", minValFemale: 27, maxValFemale: 32, normalRangeFemale: "27-32", minValBaby: 24, maxValBaby: 30, normalRangeBaby: "24-30", normalRangeDefault: "27-32", unit: "pg", order: 12 },
      { testId, name: "MCHC", minValMale: 32, maxValMale: 36, normalRangeMale: "32-36", minValFemale: 32, maxValFemale: 36, normalRangeFemale: "32-36", minValBaby: 31, maxValBaby: 35, normalRangeBaby: "31-35", normalRangeDefault: "32-36", unit: "g/dL", order: 13 },
      { testId, name: "Red Cell Distribution Width (RDW)-CV", minValMale: 11.0, maxValMale: 16.0, normalRangeMale: "11.0-16.0", minValFemale: 11.0, maxValFemale: 16.0, normalRangeFemale: "11.0-16.0", minValBaby: 11.5, maxValBaby: 16.5, normalRangeBaby: "11.5-16.5", normalRangeDefault: "11.0-16.0", unit: "%", order: 14 },
      { testId, name: "Red Cell Distribution Width (RDW)-SD", minValMale: 35, maxValMale: 56, normalRangeMale: "35 - 56", minValFemale: 35, maxValFemale: 56, normalRangeFemale: "35 - 56", minValBaby: 35, maxValBaby: 56, normalRangeBaby: "35 - 56", normalRangeDefault: "35 - 56", unit: "fl", order: 15 },
      { testId, name: "MPV", minValMale: 6.5, maxValMale: 12.0, normalRangeMale: "6.5 - 12", minValFemale: 6.5, maxValFemale: 12.0, normalRangeFemale: "6.5 - 12", minValBaby: 6.5, maxValBaby: 12.0, normalRangeBaby: "6.5 - 12", normalRangeDefault: "6.5 - 12", unit: "fl", order: 16 },
      { testId, name: "PDW", minValMale: 9.0, maxValMale: 17.0, normalRangeMale: "9 - 17", minValFemale: 9.0, maxValFemale: 17.0, normalRangeFemale: "9 - 17", minValBaby: 9.0, maxValBaby: 17.0, normalRangeBaby: "9 - 17", normalRangeDefault: "9 - 17", unit: "fl", order: 17 },
      { testId, name: "PCT", minValMale: 0.108, maxValMale: 0.282, normalRangeMale: "0.108 - 0.282", minValFemale: 0.108, maxValFemale: 0.282, normalRangeFemale: "0.108 - 0.282", minValBaby: 0.108, maxValBaby: 0.282, normalRangeBaby: "0.108 - 0.282", normalRangeDefault: "0.108 - 0.282", unit: "%", order: 18 }
    );
  } else if (nameLower.includes("lft") || nameLower.includes("liver function")) {
    parametersToCreate.push(
      { testId, name: "1.Total Bilirubin", minValMale: 0.2, maxValMale: 1.2, normalRangeMale: "0.2 - 1.2", minValFemale: 0.2, maxValFemale: 1.2, normalRangeFemale: "0.2 - 1.2", minValBaby: 0.2, maxValBaby: 1.0, normalRangeBaby: "0.2 - 1.0", normalRangeDefault: "0.2 - 1.2", unit: "mg/dL", order: 1 },
      { testId, name: "2.Direct Bilirubin", minValMale: 0.0, maxValMale: 0.30, normalRangeMale: "00 - 0.30", minValFemale: 0.0, maxValFemale: 0.30, normalRangeFemale: "00 - 0.30", minValBaby: 0.0, maxValBaby: 0.30, normalRangeBaby: "00 - 0.30", normalRangeDefault: "00 - 0.30", unit: "mg/dL", order: 2 },
      { testId, name: "3.Indirect Bilirubin", minValMale: 0.0, maxValMale: 0.85, normalRangeMale: "00 - 0.85", minValFemale: 0.0, maxValFemale: 0.85, normalRangeFemale: "00 - 0.85", minValBaby: 0.0, maxValBaby: 0.85, normalRangeBaby: "00 - 0.85", normalRangeDefault: "00 - 0.85", unit: "mg/dL", order: 3 },
      { testId, name: "4.SGOT (AST)", minValMale: 0.0, maxValMale: 40.0, normalRangeMale: "00 - 40", minValFemale: 0.0, maxValFemale: 40.0, normalRangeFemale: "00 - 40", minValBaby: 10.0, maxValBaby: 50.0, normalRangeBaby: "10 - 50", normalRangeDefault: "00 - 40", unit: "U/L", order: 4 },
      { testId, name: "5.SGPT (ALT)", minValMale: 0.0, maxValMale: 40.0, normalRangeMale: "00 - 40", minValFemale: 0.0, maxValFemale: 40.0, normalRangeFemale: "00 - 40", minValBaby: 5.0, maxValBaby: 35.0, normalRangeBaby: "5 - 35", normalRangeDefault: "00 - 40", unit: "U/L", order: 5 },
      { testId, name: "6.Alkaline Phosphatase", minValMale: 25.0, maxValMale: 140.0, normalRangeMale: "25 - 140", minValFemale: 25.0, maxValFemale: 140.0, normalRangeFemale: "25 - 140", minValBaby: 40.0, maxValBaby: 350.0, normalRangeBaby: "40 - 350", normalRangeDefault: "25 - 140", unit: "U/L", order: 6 },
      { testId, name: "7.Total Protein", minValMale: 6.0, maxValMale: 8.0, normalRangeMale: "6.0 - 8.0", minValFemale: 6.0, maxValFemale: 8.0, normalRangeFemale: "6.0 - 8.0", minValBaby: 5.5, maxValBaby: 7.5, normalRangeBaby: "5.5 - 7.5", normalRangeDefault: "6.0 - 8.0", unit: "g/dL", order: 7 },
      { testId, name: "8.Albumin", minValMale: 3.2, maxValMale: 5.0, normalRangeMale: "3.20 - 5.0", minValFemale: 3.2, maxValFemale: 5.0, normalRangeFemale: "3.20 - 5.0", minValBaby: 3.0, maxValBaby: 4.8, normalRangeBaby: "3.0 - 4.8", normalRangeDefault: "3.20 - 5.0", unit: "g/dL", order: 8 },
      { testId, name: "9.Globulin", minValMale: 2.5, maxValMale: 3.5, normalRangeMale: "2.50 - 3.50", minValFemale: 2.5, maxValFemale: 3.5, normalRangeFemale: "2.50 - 3.50", minValBaby: 2.0, maxValBaby: 3.0, normalRangeBaby: "2.0 - 3.0", normalRangeDefault: "2.50 - 3.50", unit: "g/dL", order: 9 },
      { testId, name: "10.Albumin/Globulin Ratio", minValMale: 0.9, maxValMale: 2.0, normalRangeMale: "0.90 - 2.00", minValFemale: 0.9, maxValFemale: 2.0, normalRangeFemale: "0.90 - 2.00", minValBaby: 0.8, maxValBaby: 1.8, normalRangeBaby: "0.80 - 1.80", normalRangeDefault: "0.90 - 2.00", unit: "ratio", order: 10 }
    );
  } else if (nameLower.includes("kft") || nameLower.includes("rft") || nameLower.includes("renal") || nameLower.includes("kidney")) {
    parametersToCreate.push(
      { testId, name: "Blood Urea", minValMale: 5.0, maxValMale: 43.0, normalRangeMale: "05 - 43", minValFemale: 5.0, maxValFemale: 43.0, normalRangeFemale: "05 - 43", minValBaby: 5.0, maxValBaby: 35.0, normalRangeBaby: "05 - 35", normalRangeDefault: "05 - 43", unit: "mg/dL", order: 1 },
      { testId, name: "Serum Creatinine", minValMale: 0.6, maxValMale: 1.2, normalRangeMale: "0.6 - 1.2", minValFemale: 0.6, maxValFemale: 1.2, normalRangeFemale: "0.6 - 1.2", minValBaby: 0.3, maxValBaby: 0.7, normalRangeBaby: "0.3 - 0.7", normalRangeDefault: "0.6 - 1.2", unit: "mg/dL", order: 2 },
      { testId, name: "Serum Uric Acid", minValMale: 3.4, maxValMale: 7.0, normalRangeMale: "3.4-7.0", minValFemale: 2.4, maxValFemale: 6.0, normalRangeFemale: "2.4-6.0", minValBaby: 2.0, maxValBaby: 5.5, normalRangeBaby: "2.0-5.5", normalRangeDefault: "3.4-7.0", unit: "mg/dL", order: 3 },
      { testId, name: "Serum Sodium(Na+)", minValMale: 136, maxValMale: 148, normalRangeMale: "136 - 148 mEq/L", minValFemale: 136, maxValFemale: 148, normalRangeFemale: "136 - 148 mEq/L", minValBaby: 133, maxValBaby: 144, normalRangeBaby: "133 - 144 mEq/L", normalRangeDefault: "136 - 148 mEq/L", unit: "mEq/L", order: 4 },
      { testId, name: "Serum Potassium(K+)", minValMale: 3.6, maxValMale: 5.5, normalRangeMale: "3.6 - 5.5 mEq/L", minValFemale: 3.6, maxValFemale: 5.5, normalRangeFemale: "3.6 - 5.5 mEq/L", minValBaby: 3.7, maxValBaby: 5.5, normalRangeBaby: "3.7 - 5.5 mEq/L", normalRangeDefault: "3.6 - 5.5 mEq/L", unit: "mEq/L", order: 5 },
      { testId, name: "Serum Chloride(Cl-)", minValMale: 94, maxValMale: 110, normalRangeMale: "94 - 110 mEq/L", minValFemale: 94, maxValFemale: 110, normalRangeFemale: "94 - 110 mEq/L", minValBaby: 94, maxValBaby: 110, normalRangeBaby: "94 - 110 mEq/L", normalRangeDefault: "94 - 110 mEq/L", unit: "mEq/L", order: 6 },
      { testId, name: "Blood Urea Nitrogen(Bun)", minValMale: 7.0, maxValMale: 21.0, normalRangeMale: "7 - 21 mg/dl", minValFemale: 7.0, maxValFemale: 21.0, normalRangeFemale: "7 - 21 mg/dl", minValBaby: 5.0, maxValBaby: 18.0, normalRangeBaby: "5 - 18 mg/dl", normalRangeDefault: "7 - 21 mg/dl", unit: "mg/dL", order: 7 },
      { testId, name: "BUN/CREATININE RATIO", minValMale: 10.0, maxValMale: 20.0, normalRangeMale: "10.0-20.0", minValFemale: 10.0, maxValFemale: 20.0, normalRangeFemale: "10.0-20.0", minValBaby: 10.0, maxValBaby: 20.0, normalRangeBaby: "10.0-20.0", normalRangeDefault: "10.0-20.0", unit: "ratio", order: 8 },
      { testId, name: "Urea / Creatinine Ratio", minValMale: null, maxValMale: null, normalRangeMale: null, minValFemale: null, maxValFemale: null, normalRangeFemale: null, minValBaby: null, maxValBaby: null, normalRangeBaby: null, normalRangeDefault: "-NA-", unit: "ratio", order: 9 }
    );
  } else if (nameLower.includes("glucose") || nameLower.includes("sugar") || nameLower.includes("hba1c")) {
    parametersToCreate.push(
      { testId, name: "Blood Glucose Fasting", minValMale: 70, maxValMale: 110, normalRangeMale: "70-110", minValFemale: 70, maxValFemale: 110, normalRangeFemale: "70-110", minValBaby: 60, maxValBaby: 100, normalRangeBaby: "60-100", normalRangeDefault: "70-110", unit: "mg/dL", order: 1 },
      { testId, name: "Blood Glucose Post Prandial", minValMale: 80, maxValMale: 140, normalRangeMale: "80-140", minValFemale: 80, maxValFemale: 140, normalRangeFemale: "80-140", minValBaby: 70, maxValBaby: 130, normalRangeBaby: "70-130", normalRangeDefault: "80-140", unit: "mg/dL", order: 2 }
    );
  } else {
    parametersToCreate.push({
      testId,
      name,
      minValMale: null,
      maxValMale: null,
      normalRangeMale: null,
      minValFemale: null,
      maxValFemale: null,
      normalRangeFemale: null,
      minValBaby: null,
      maxValBaby: null,
      normalRangeBaby: null,
      normalRangeDefault: null,
      unit: "-NA-",
      order: 1
    });
  }

  for (const p of parametersToCreate) {
    const normName = p.name.trim();

    // Resolve or create parameter in the master Parameter table
    let parameter = await tx.parameter.findFirst({
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
      parameter = await tx.parameter.create({
        data: pData
      });
    }

    await tx.testParameter.create({
      data: {
        testId: p.testId,
        parameterId: parameter.id,
        order: p.order,
        isHeader: p.isHeader || false,
      }
    });
  }
}

export async function POST(req) {
  try {
    await verifySuperAdminAPI();
    const body = await req.json().catch(() => ({}));
    let { workspaceId, tests } = body;

    // Convert workspaceId to Int or null
    workspaceId = workspaceId ? parseInt(workspaceId) : null;

    if (!tests || !Array.isArray(tests)) {
      return NextResponse.json({ success: false, error: "Invalid payload: tests array is required." }, { status: 400 });
    }

    // 1. Group raw rows by orgName (trimmed and case-insensitive)
    const groups = {};
    for (const rawTest of tests) {
      const orgName = rawTest.orgName?.trim();
      const name = rawTest.name?.trim();

      // Skip completely empty rows
      if (!orgName && !name) continue;

      const groupKey = (orgName || name).toLowerCase();
      if (!groups[groupKey]) {
        groups[groupKey] = {
          orgName: orgName || name,
          rows: [],
        };
      }
      groups[groupKey].rows.push(rawTest);
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors = [];
    const totalGroups = Object.keys(groups).length;

    console.log(`[Import] Starting import for ${totalGroups} test groups containing ${tests.length} parameters...`);

    let currentIdx = 0;
    // Process each test group sequentially in transactions
    for (const groupKey of Object.keys(groups)) {
      currentIdx++;
      const group = groups[groupKey];
      const orgName = group.orgName;
      const rows = group.rows;

      if (currentIdx === 1 || currentIdx === totalGroups || currentIdx % 10 === 0) {
        console.log(`[Import Progress] Processing group ${currentIdx}/${totalGroups}: "${orgName}" (${rows.length} parameters)...`);
      }

      try {
        await prisma.$transaction(async (tx) => {
          // A. Determine department for the test
          let departmentName = null;
          for (const row of rows) {
            if (row.department?.trim()) {
              departmentName = row.department.trim();
              break;
            }
          }

          let deptId = null;
          if (departmentName) {
            const dept = await tx.testDepartment.upsert({
              where: { name: departmentName },
              update: {},
              create: { name: departmentName },
            });
            deptId = dept.id;
          }

          // B. Determine target pricing and code
          // Find the row that represents the parent test (usually has same name as orgName)
          let pricingRow = rows.find(r => r.name?.trim().toLowerCase() === orgName.toLowerCase());
          if (!pricingRow) {
            // Fallback to first row with any rate values
            pricingRow = rows.find(r => parseFloat(r.curRate) > 0 || parseFloat(r.rate) > 0 || parseFloat(r.baseRate) > 0);
          }
          if (!pricingRow) {
            pricingRow = rows[0];
          }

          const baseRate = pricingRow.baseRate !== undefined && pricingRow.baseRate !== "" ? parseFloat(pricingRow.baseRate) : null;
          const curRate = pricingRow.curRate !== undefined && pricingRow.curRate !== "" ? parseFloat(pricingRow.curRate) : null;
          const rate = pricingRow.rate !== undefined && pricingRow.rate !== "" ? parseFloat(pricingRow.rate) : null;
          const collectionCenterRate = pricingRow.collectionCenterRate !== undefined && pricingRow.collectionCenterRate !== "" ? parseFloat(pricingRow.collectionCenterRate) : null;
          const franchiseRate = pricingRow.franchiseRate !== undefined && pricingRow.franchiseRate !== "" ? parseFloat(pricingRow.franchiseRate) : null;
          const superFranchiseRate = pricingRow.superFranchiseRate !== undefined && pricingRow.superFranchiseRate !== "" ? parseFloat(pricingRow.superFranchiseRate) : null;
          const labRate = pricingRow.labRate !== undefined && pricingRow.labRate !== "" ? parseFloat(pricingRow.labRate) : null;
          const offerPrice = pricingRow.offerPrice !== undefined && pricingRow.offerPrice !== "" ? parseFloat(pricingRow.offerPrice) : null;

          // Standard pricing fallback
          const priceVal = curRate !== null && !isNaN(curRate) ? curRate : (rate !== null && !isNaN(rate) ? rate : (baseRate !== null && !isNaN(baseRate) ? baseRate : 0));

          let testCode = pricingRow.code?.trim().toUpperCase();
          if (testCode) {
            testCode = testCode.slice(0, 6);
          }

          // C. Look up or create the Test
          let testRecord = null;
          if (testCode) {
            testRecord = await tx.test.findFirst({
              where: { workspaceId, code: testCode, isDeleted: false }
            });
          }
          if (!testRecord) {
            testRecord = await tx.test.findFirst({
              where: { workspaceId, name: orgName, isDeleted: false }
            });
          }

          const testData = {
            name: orgName,
            price: priceVal,
            baseRate,
            curRate,
            rate,
            collectionCenterRate,
            franchiseRate,
            superFranchiseRate,
            labRate,
            offerPrice,
            departmentId: deptId,
          };

          if (testRecord) {
            testRecord = await tx.test.update({
              where: { id: testRecord.id },
              data: {
                ...testData,
                code: testCode || testRecord.code, // retain existing code if sheet row didn't have one
              }
            });
            updatedCount++;
          } else {
            if (!testCode) {
              testCode = await generateUniqueCode(tx, orgName, workspaceId);
            } else {
              const duplicate = await tx.test.findFirst({
                where: { workspaceId, code: testCode, isDeleted: false }
              });
              if (duplicate) {
                testCode = await generateUniqueCode(tx, orgName, workspaceId);
              }
            }

            testRecord = await tx.test.create({
              data: {
                ...testData,
                code: testCode,
                workspaceId,
                isProcessed: true,
              }
            });
            createdCount++;
          }

          // D. Process parameters (Headers and Children)
          const existingTPs = await tx.testParameter.findMany({
            where: { testId: testRecord.id }
          });

          const headerKeyToTpId = {};
          const reusedTpIds = new Set();
          let orderCounter = 1;

          // Pass 1: Create or reuse all headers (ends with :- or :)
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const trimmedName = row.name?.trim();
            if (!trimmedName) continue;

            const isHeader = trimmedName.endsWith(":-") || trimmedName.endsWith(":");
            if (!isHeader) continue;

            // Resolve parameter
            let parameter = await tx.parameter.findFirst({ where: { name: trimmedName } });
            if (!parameter) {
              parameter = await tx.parameter.create({
                data: {
                  name: trimmedName,
                  code: row.code?.trim() || null,
                  normalRangeDefault: "Normal / Negative",
                  unit: "-NA-",
                }
              });
            }

            let tp = existingTPs.find(x => x.parameterId === parameter.id);
            if (tp) {
              tp = await tx.testParameter.update({
                where: { id: tp.id },
                data: {
                  order: orderCounter++,
                  isHeader: true,
                  parentId: null,
                  isDeleted: false,
                  deletedAt: null,
                }
              });
            } else {
              tp = await tx.testParameter.create({
                data: {
                  testId: testRecord.id,
                  parameterId: parameter.id,
                  order: orderCounter++,
                  isHeader: true,
                  parentId: null,
                  isDeleted: false,
                }
              });
            }

            reusedTpIds.add(tp.id);
            headerKeyToTpId[i] = tp.id;
          }

          // Pass 2: Create or reuse all child parameters
          let lastHeaderTpId = null;
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const trimmedName = row.name?.trim();
            if (!trimmedName) continue;

            const isHeader = trimmedName.endsWith(":-") || trimmedName.endsWith(":");
            if (isHeader) {
              lastHeaderTpId = headerKeyToTpId[i];
              continue;
            }

            // Resolve parameter
            let parameter = await tx.parameter.findFirst({ where: { name: trimmedName } });
            if (!parameter) {
              parameter = await tx.parameter.create({
                data: {
                  name: trimmedName,
                  code: row.code?.trim() || null,
                  normalRangeDefault: "Normal / Negative",
                  unit: "-NA-",
                }
              });
            } else if (row.code?.trim() && !parameter.code) {
              parameter = await tx.parameter.update({
                where: { id: parameter.id },
                data: { code: row.code.trim() }
              });
            }

            let tp = existingTPs.find(x => x.parameterId === parameter.id);
            if (tp) {
              tp = await tx.testParameter.update({
                where: { id: tp.id },
                data: {
                  order: orderCounter++,
                  isHeader: false,
                  parentId: lastHeaderTpId,
                  isDeleted: false,
                  deletedAt: null,
                }
              });
            } else {
              tp = await tx.testParameter.create({
                data: {
                  testId: testRecord.id,
                  parameterId: parameter.id,
                  order: orderCounter++,
                  isHeader: false,
                  parentId: lastHeaderTpId,
                  isDeleted: false,
                }
              });
            }
            reusedTpIds.add(tp.id);
          }

          // Soft delete parameters that are no longer part of the imported test configuration
          const toDeleteIds = existingTPs.filter(x => !reusedTpIds.has(x.id)).map(x => x.id);
          if (toDeleteIds.length > 0) {
            await tx.testParameter.updateMany({
              where: { id: { in: toDeleteIds } },
              data: {
                isDeleted: true,
                deletedAt: new Date(),
              }
            });
          }

        }, {
          maxWait: 15000,
          timeout: 30000
        });

      } catch (err) {
        console.error("Error importing group:", orgName, err);
        errors.push(`Failed to import test group "${orgName}": ${err.message}`);
      }
    }

    console.log(`[Import Completed] Success: Created/Synced: ${createdCount}, Updated/Repriced: ${updatedCount}. Total Errors/Warnings: ${errors.length}`);

    return NextResponse.json({
      success: true,
      createdCount,
      updatedCount,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error("SuperAdmin Tests Import POST Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
