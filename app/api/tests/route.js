import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Helper to serialize Decimal and Dates
function serializeData(data) {
  return JSON.parse(JSON.stringify(data));
}

export async function GET(req) {
  try {
    const admin = await requireAdmin("admin:view");
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const search = searchParams.get("search") || "";

    const allTests = await prisma.test.findMany({
      where: {
        OR: [
          { workspaceId: admin.workspaceId },
          { workspaceId: null }
        ]
      },
      include: {
        parameters: {
          orderBy: { order: "asc" }
        }
      },
      orderBy: { name: "asc" },
    });

    // Group tests by code/name to pair global and workspace-specific versions
    const testMap = new Map();
    for (const t of allTests) {
      const key = t.code || t.name;
      if (!testMap.has(key)) {
        testMap.set(key, {
          globalTest: t.workspaceId === null ? t : null,
          workspaceTest: t.workspaceId !== null ? t : null
        });
      } else {
        const entry = testMap.get(key);
        if (t.workspaceId === null) {
          entry.globalTest = t;
        } else {
          entry.workspaceTest = t;
        }
      }
    }

    let tests = Array.from(testMap.values()).map(entry => {
      const activeTest = entry.workspaceTest || entry.globalTest;
      return {
        ...activeTest,
        globalPrice: entry.globalTest ? entry.globalTest.price : activeTest.price,
        isCustomized: !!entry.workspaceTest
      };
    });

    // Filter by search query on name or code
    if (search.trim() !== "") {
      const query = search.toLowerCase().trim();
      tests = tests.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          (t.code && t.code.toLowerCase().includes(query))
      );
    }

    // Sort tests by name
    tests.sort((a, b) => a.name.localeCompare(b.name));

    const totalCount = tests.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedTests = tests.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      tests: serializeData(paginatedTests),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error("Workspace Tests GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin("admin:write");
    const body = await req.json().catch(() => ({}));
    const { name, code, price } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Test name is required." },
        { status: 400 }
      );
    }

    if (price === undefined || isNaN(parseFloat(price))) {
      return NextResponse.json(
        { success: false, message: "Valid test price is required." },
        { status: 400 }
      );
    }

    const testCode = code ? code.trim() : `T-${Date.now()}`;
    const numericPrice = parseFloat(price);

    // Check if code is already used in this workspace
    const existingTest = await prisma.test.findFirst({
      where: {
        workspaceId: admin.workspaceId,
        code: testCode,
      },
    });

    if (existingTest) {
      return NextResponse.json(
        { success: false, message: `Test code "${testCode}" is already in use in this workspace.` },
        { status: 400 }
      );
    }

    const newTest = await prisma.test.create({
      data: {
        name: name.trim(),
        code: testCode,
        price: numericPrice,
        workspaceId: admin.workspaceId,
        isProcessed: true,
      },
    });

    // Create a default result parameter so user can type results in reports
    await prisma.testParameter.create({
      data: {
        testId: newTest.id,
        name: "Result",
        normalRangeDefault: "As per report",
        unit: "",
        order: 1,
      },
    });

    const testWithParams = await prisma.test.findUnique({
      where: { id: newTest.id },
      include: { parameters: { orderBy: { order: "asc" } } }
    });

    return NextResponse.json({
      success: true,
      message: "Test added successfully!",
      test: serializeData(testWithParams),
    });
  } catch (error) {
    console.error("Workspace Tests POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const admin = await requireAdmin("admin:write");
    const body = await req.json().catch(() => ({}));
    const { testId, price, name } = body;

    if (!testId || price === undefined || isNaN(parseFloat(price))) {
      return NextResponse.json(
        { success: false, message: "Test ID and a valid price are required." },
        { status: 400 }
      );
    }

    const numericPrice = parseFloat(price);
    const testName = name && typeof name === "string" ? name.trim() : null;

    // Find the test
    const test = await prisma.test.findUnique({
      where: { id: parseInt(testId) },
      include: { parameters: true },
    });

    if (!test) {
      return NextResponse.json(
        { success: false, message: "Test not found." },
        { status: 404 }
      );
    }

    // Check if it's already a workspace-specific test
    if (test.workspaceId === admin.workspaceId) {
      const updateData = { price: numericPrice };
      if (testName) {
        updateData.name = testName;
      }

      const updatedTest = await prisma.test.update({
        where: { id: test.id },
        data: updateData,
      });
      return NextResponse.json({
        success: true,
        message: "Test details updated successfully!",
        test: serializeData(updatedTest),
      });
    }

    // If it's a global test, we clone it for this workspace
    const newTest = await prisma.$transaction(async (tx) => {
      // 1. Create the cloned test
      const clonedTest = await tx.test.create({
        data: {
          name: testName || test.name,
          code: test.code,
          price: numericPrice,
          isProcessed: test.isProcessed,
          workspaceId: admin.workspaceId,
        },
      });

      // 2. Clone its parameters
      if (test.parameters && test.parameters.length > 0) {
        const clonedParams = test.parameters.map((p) => ({
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
        }));

        await tx.testParameter.createMany({
          data: clonedParams,
        });
      }

      return clonedTest;
    });

    return NextResponse.json({
      success: true,
      message: "Test details updated successfully (cloned for your workspace)!",
      test: serializeData(newTest),
    });
  } catch (error) {
    console.error("Workspace Tests PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
