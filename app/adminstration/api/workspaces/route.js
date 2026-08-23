import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function GET() {
  try {
    await verifySuperAdminAPI();

    const workspaces = await prisma.workspace.findMany({
      where: { isDeleted: false },
      include: {
        admins: {
          select: { id: true, name: true, email: true, isActive: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = await Promise.all(
      workspaces.map(async (ws) => {
        const regToday = await prisma.registration.count({
          where: {
            workspaceId: ws.id,
            date: { gte: startOfToday },
            isDeleted: false,
          },
        });

        const reg7Days = await prisma.registration.count({
          where: {
            workspaceId: ws.id,
            date: { gte: startOf7DaysAgo },
            isDeleted: false,
          },
        });

        return {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          isActive: ws.isActive,
          createdAt: ws.createdAt.toISOString(),
          expireAt: ws.expireAt ? ws.expireAt.toISOString() : null,
          startAt: ws.startAt ? ws.startAt.toISOString() : null,
          admins: ws.admins,
          stats: {
            today: regToday,
            last7Days: reg7Days,
          },
        };
      })
    );

    return NextResponse.json({ success: true, workspaces: stats });
  } catch (error) {
    console.error("SuperAdmin Workspaces GET Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function POST(req) {
  try {
    await verifySuperAdminAPI();
    const body = await req.json().catch(() => ({}));

    const name = body.name?.trim();
    const slug = body.slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: "Name and slug are required." });
    }

    const existing = await prisma.workspace.findFirst({ where: { slug, isDeleted: false } });
    if (existing) {
      return NextResponse.json({ success: false, error: "A workspace with this slug already exists." });
    }

    const workspace = await prisma.$transaction(async (tx) => {
      // 1. Create workspace
      const ws = await tx.workspace.create({
        data: {
          name,
          slug,
          isActive: true,
        },
      });

      // 2. Fetch all global tests with parameters (filtering out soft-deleted ones)
      const globalTests = await tx.test.findMany({
        where: { workspaceId: null, isDeleted: false },
        include: {
          parameters: {
            where: { isDeleted: false },
            include: { parameter: true }
          }
        },
      });

      // 3. Clone unique parameters for the new workspace
      const uniqueParamsMap = new Map();
      for (const gt of globalTests) {
        if (gt.parameters) {
          for (const tp of gt.parameters) {
            if (tp.parameter) {
              const p = tp.parameter;
              uniqueParamsMap.set(p.name.toLowerCase(), p);
            }
          }
        }
      }
      const uniqueParamsList = Array.from(uniqueParamsMap.values());

      if (uniqueParamsList.length > 0) {
        await tx.parameter.createMany({
          data: uniqueParamsList.map((p) => ({
            name: p.name,
            code: p.code,
            unit: p.unit,
            valueType: p.valueType || "NUMERIC",
            options: p.options || null,
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
            criticalMinValMale: p.criticalMinValMale,
            criticalMaxValMale: p.criticalMaxValMale,
            criticalMinValFemale: p.criticalMinValFemale,
            criticalMaxValFemale: p.criticalMaxValFemale,
            criticalMinValBaby: p.criticalMinValBaby,
            criticalMaxValBaby: p.criticalMaxValBaby,
            criticalMinValDefault: p.criticalMinValDefault,
            criticalMaxValDefault: p.criticalMaxValDefault,
            borderlineMinValMale: p.borderlineMinValMale,
            borderlineMaxValMale: p.borderlineMaxValMale,
            borderlineMinValFemale: p.borderlineMinValFemale,
            borderlineMaxValFemale: p.borderlineMaxValFemale,
            borderlineMinValBaby: p.borderlineMinValBaby,
            borderlineMaxValBaby: p.borderlineMaxValBaby,
            borderlineMinValDefault: p.borderlineMinValDefault,
            borderlineMaxValDefault: p.borderlineMaxValDefault,
            workspaceId: ws.id,
          }))
        });
      }

      // 4. Fetch the newly created parameters to match their new IDs
      const newParams = await tx.parameter.findMany({
        where: {
          workspaceId: ws.id,
        }
      });
      const paramNameToIdMap = {};
      for (const np of newParams) {
        paramNameToIdMap[np.name.toLowerCase()] = np.id;
      }

      // 5. Prepare tests data for bulk insertion
      const testsData = globalTests.map((gt) => ({
        name: gt.name,
        code: gt.code,
        price: gt.price,
        baseRate: gt.baseRate,
        curRate: gt.curRate,
        rate: gt.rate,
        collectionCenterRate: gt.collectionCenterRate,
        franchiseRate: gt.franchiseRate,
        superFranchiseRate: gt.superFranchiseRate,
        labRate: gt.labRate,
        offerPrice: gt.offerPrice,
        departmentId: gt.departmentId,
        isProcessed: gt.isProcessed,
        workspaceId: ws.id,
      }));

      // 6. Bulk insert all tests
      await tx.test.createMany({
        data: testsData,
      });

      // 7. Query the newly inserted tests to get their IDs
      const insertedTests = await tx.test.findMany({
        where: { workspaceId: ws.id },
      });

      // Map test name+code key to its new database ID
      const testKeyToIdMap = {};
      for (const nt of insertedTests) {
        const key = `${nt.name.toLowerCase()}_${(nt.code || "").toLowerCase()}`;
        testKeyToIdMap[key] = nt.id;
      }

      // 8. Two-pass insertion of TestParameters to preserve isHeader -> child parentId mapping
      const defaultTpIdToNewTpIdMap = new Map();

      for (const gt of globalTests) {
        const key = `${gt.name.toLowerCase()}_${(gt.code || "").toLowerCase()}`;
        const newTestId = testKeyToIdMap[key];
        if (newTestId && gt.parameters) {
          const headerTps = gt.parameters.filter(tp => tp.isHeader && tp.parameter);
          for (const tp of headerTps) {
            const newParamId = paramNameToIdMap[tp.parameter.name.toLowerCase()];
            if (newParamId) {
              const createdHeaderTp = await tx.testParameter.create({
                data: {
                  testId: newTestId,
                  parameterId: newParamId,
                  order: tp.order,
                  isHeader: true,
                  parentId: null,
                  unit: tp.unit || tp.parameter.unit || null,
                  valueType: tp.valueType || tp.parameter.valueType || "OPTIONS",
                  options: tp.options || tp.parameter.options || null,
                  isCalculated: tp.isCalculated || false,
                  decimalPlace: tp.decimalPlace ?? 2,
                  roundingMethod: tp.roundingMethod || "HALF_UP",
                  section: tp.section || null,
                  workspaceId: ws.id,
                }
              });
              defaultTpIdToNewTpIdMap.set(tp.id, createdHeaderTp.id);
            }
          }
        }
      }

      // Pass 2: Insert child & standalone parameters
      const childParamsToCreate = [];
      for (const gt of globalTests) {
        const key = `${gt.name.toLowerCase()}_${(gt.code || "").toLowerCase()}`;
        const newTestId = testKeyToIdMap[key];
        if (newTestId && gt.parameters) {
          const nonHeaderTps = gt.parameters.filter(tp => !tp.isHeader && tp.parameter);
          for (const tp of nonHeaderTps) {
            const newParamId = paramNameToIdMap[tp.parameter.name.toLowerCase()];
            if (newParamId) {
              const newParentId = tp.parentId ? (defaultTpIdToNewTpIdMap.get(tp.parentId) || null) : null;
              childParamsToCreate.push({
                testId: newTestId,
                parameterId: newParamId,
                order: tp.order,
                isHeader: false,
                parentId: newParentId,
                unit: tp.unit || tp.parameter.unit || null,
                valueType: tp.valueType || tp.parameter.valueType || "NUMERIC",
                options: tp.options || tp.parameter.options || null,
                isCalculated: tp.isCalculated || false,
                decimalPlace: tp.decimalPlace ?? 2,
                roundingMethod: tp.roundingMethod || "HALF_UP",
                section: tp.section || null,
                workspaceId: ws.id,
              });
            }
          }
        }
      }

      // 9. Bulk insert all child parameters in one operation
      if (childParamsToCreate.length > 0) {
        await tx.testParameter.createMany({
          data: childParamsToCreate,
        });
      }

      // 10. Fetch default test formulas and clone
      const defaultFormulas = await tx.testFormula.findMany({
        where: {
          workspaceId: null,
          isActive: true
        },
        include: {
          test: true,
          outputParameter: true
        }
      });

      if (defaultFormulas.length > 0) {
        const formulasToCreate = [];
        for (const df of defaultFormulas) {
          if (df.test && df.outputParameter) {
            const testKey = `${df.test.name.toLowerCase()}_${(df.test.code || "").toLowerCase()}`;
            const newTestId = testKeyToIdMap[testKey];
            const newOutputParamId = paramNameToIdMap[df.outputParameter.name.toLowerCase()];

            if (newTestId && newOutputParamId) {
              formulasToCreate.push({
                workspaceId: ws.id,
                testId: newTestId,
                outputParameterId: newOutputParamId,
                formula: df.formula,
                description: df.description,
                name: df.name,
                version: df.version,
                isActive: df.isActive
              });
            }
          }
        }

        if (formulasToCreate.length > 0) {
          await tx.testFormula.createMany({
            data: formulasToCreate
          });
        }
      }

      // 11. Fetch default interpretation rules and clone
      const defaultRules = await tx.interpretationRule.findMany({
        where: {
          workspaceId: null
        },
        include: {
          test: true,
          parameter: true
        }
      });

      if (defaultRules.length > 0) {
        const rulesToCreate = [];
        for (const dr of defaultRules) {
          let newTestId = null;
          if (dr.test) {
            const testKey = `${dr.test.name.toLowerCase()}_${(dr.test.code || "").toLowerCase()}`;
            newTestId = testKeyToIdMap[testKey] || null;
          }
          let newParamId = null;
          if (dr.parameter) {
            newParamId = paramNameToIdMap[dr.parameter.name.toLowerCase()] || null;
          }

          if (newTestId && newParamId) {
            rulesToCreate.push({
              workspaceId: ws.id,
              testId: newTestId,
              parameterId: newParamId,
              condition: dr.condition,
              interpretation: dr.interpretation
            });
          }
        }
        if (rulesToCreate.length > 0) {
          await tx.interpretationRule.createMany({ data: rulesToCreate });
        }
      }

      return ws;
    }, {
      maxWait: 15000,
      timeout: 30000
    });

    return NextResponse.json({ success: true, message: "Workspace created successfully with default tests!", workspace });
  } catch (error) {
    console.error("SuperAdmin Workspace POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
