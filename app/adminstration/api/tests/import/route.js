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

export async function POST(req) {
  try {
    await verifySuperAdminAPI();
    const body = await req.json().catch(() => ({}));
    let { workspaceId, importMode, tests } = body;

    // Convert workspaceId to Int or null
    workspaceId = workspaceId ? parseInt(workspaceId) : null;

    if (!tests || !Array.isArray(tests)) {
      return NextResponse.json({ success: false, error: "Invalid payload: tests array is required." }, { status: 400 });
    }

    if (importMode === "units_only") {
      let updatedCount = 0;
      const errors = [];

      try {
        const batchSize = 50;
        for (let i = 0; i < tests.length; i += batchSize) {
          const batch = tests.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (item) => {
              const name = item.name?.trim();
              const unit = item.unit?.trim() ?? "";
              if (!name) return;

              try {
                // Find parameter by name and workspaceId
                const parameter = await prisma.parameter.findFirst({
                  where: {
                    workspaceId,
                    name: { equals: name }
                  }
                });

                if (parameter) {
                  if (parameter.unit !== unit) {
                    console.log(`[Import Mode: units_only] Updating parameter "${name}" unit: "${parameter.unit}" -> "${unit}"`);
                    await prisma.parameter.update({
                      where: { id: parameter.id },
                      data: { unit }
                    });
                    updatedCount++;
                  }
                }
              } catch (err) {
                console.error(`Error updating parameter unit for "${name}":`, err);
                errors.push(`Failed for "${name}": ${err.message}`);
              }
            })
          );
        }

        return NextResponse.json({
          success: true,
          createdCount: 0,
          updatedCount,
          errors: errors.length > 0 ? errors : null
        });
      } catch (err) {
        console.error("Error updating parameter units:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
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
              console.log(`[Import Mode: full] Creating parameter "${trimmedName}" with unit: "${row.unit?.trim() || ""}"`);
              parameter = await tx.parameter.create({
                data: {
                  name: trimmedName,
                  code: row.code?.trim() || null,
                  normalRangeDefault: null,
                  unit: row.unit?.trim() || "",
                }
              });
            } else {
              const updatedData = {};
              if (row.code?.trim() && parameter.code !== row.code.trim()) {
                updatedData.code = row.code.trim();
              }
              if (row.unit?.trim() && parameter.unit !== row.unit.trim()) {
                console.log(`[Import Mode: full] Updating parameter "${trimmedName}" unit: "${parameter.unit}" -> "${row.unit.trim()}"`);
                updatedData.unit = row.unit.trim();
              }
              if (Object.keys(updatedData).length > 0) {
                parameter = await tx.parameter.update({
                  where: { id: parameter.id },
                  data: updatedData
                });
              }
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
              console.log(`[Import Mode: full] Creating parameter "${trimmedName}" with unit: "${row.unit?.trim() || ""}"`);
              parameter = await tx.parameter.create({
                data: {
                  name: trimmedName,
                  code: row.code?.trim() || null,
                  normalRangeDefault: null,
                  unit: row.unit?.trim() || "",
                }
              });
            } else {
              const updatedData = {};
              if (row.code?.trim() && parameter.code !== row.code.trim()) {
                updatedData.code = row.code.trim();
              }
              if (row.unit?.trim() && parameter.unit !== row.unit.trim()) {
                console.log(`[Import Mode: full] Updating parameter "${trimmedName}" unit: "${parameter.unit}" -> "${row.unit.trim()}"`);
                updatedData.unit = row.unit.trim();
              }
              if (Object.keys(updatedData).length > 0) {
                parameter = await tx.parameter.update({
                  where: { id: parameter.id },
                  data: updatedData
                });
              }
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
