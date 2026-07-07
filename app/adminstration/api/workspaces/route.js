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

      // 2. Fetch all global tests with parameters
      const globalTests = await tx.test.findMany({
        where: { workspaceId: null },
        include: { parameters: true },
      });

      // 3. Prepare tests data for bulk insertion
      const testsData = globalTests.map((gt) => ({
        name: gt.name,
        code: gt.code,
        price: gt.price,
        isProcessed: gt.isProcessed,
        workspaceId: ws.id,
      }));

      // 4. Bulk insert all tests
      await tx.test.createMany({
        data: testsData,
      });

      // 5. Query the newly inserted tests to get their IDs
      const insertedTests = await tx.test.findMany({
        where: { workspaceId: ws.id },
      });

      // 6. Map parameters to the newly inserted test IDs
      const allClonedParams = [];
      for (const gt of globalTests) {
        const clonedTest = insertedTests.find(
          (t) => t.code === gt.code && t.name === gt.name
        );
        if (clonedTest && gt.parameters && gt.parameters.length > 0) {
          for (const p of gt.parameters) {
            allClonedParams.push({
              testId: clonedTest.id,
              name: p.name,
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
              unit: p.unit,
              order: p.order,
            });
          }
        }
      }

      // 7. Bulk insert all parameters in one operation
      if (allClonedParams.length > 0) {
        await tx.testParameter.createMany({
          data: allClonedParams,
        });
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
