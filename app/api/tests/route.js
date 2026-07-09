import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Helper to serialize Decimal, Dates, and flatten parameter fields so frontend continues to see them directly
function serializeTests(tests) {
  return JSON.parse(JSON.stringify(tests)).map(test => {
    if (test.parameters) {
      test.parameters = test.parameters.map(tp => {
        if (tp.parameter) {
          const { parameter, ...rest } = tp;
          return {
            ...rest,
            name: parameter.name,
            unit: parameter.unit,
            minValMale: parameter.minValMale,
            maxValMale: parameter.maxValMale,
            normalRangeMale: parameter.normalRangeMale,
            minValFemale: parameter.minValFemale,
            maxValFemale: parameter.maxValFemale,
            normalRangeFemale: parameter.normalRangeFemale,
            minValBaby: parameter.minValBaby,
            maxValBaby: parameter.maxValBaby,
            normalRangeBaby: parameter.normalRangeBaby,
            normalRangeDefault: parameter.normalRangeDefault,
          };
        }
        return tp;
      });
    }
    return test;
  });
}

function serializeSingleTest(test) {
  if (!test) return null;
  const serialized = JSON.parse(JSON.stringify(test));
  if (serialized.parameters) {
    serialized.parameters = serialized.parameters.map(tp => {
      if (tp.parameter) {
        const { parameter, ...rest } = tp;
        return {
          ...rest,
          name: parameter.name,
          unit: parameter.unit,
          minValMale: parameter.minValMale,
          maxValMale: parameter.maxValMale,
          normalRangeMale: parameter.normalRangeMale,
          minValFemale: parameter.minValFemale,
          maxValFemale: parameter.maxValFemale,
          normalRangeFemale: parameter.normalRangeFemale,
          minValBaby: parameter.minValBaby,
          maxValBaby: parameter.maxValBaby,
          normalRangeBaby: parameter.normalRangeBaby,
          normalRangeDefault: parameter.normalRangeDefault,
        };
      }
      return tp;
    });
  }
  return serialized;
}

export async function GET(req) {
  try {
    const admin = await requireAdmin("TEST_READ");
    const searchParams = req.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const page = pageParam ? parseInt(pageParam) : null;
    const limit = limitParam ? parseInt(limitParam) : null;
    const search = searchParams.get("search") || "";

    const allTests = await prisma.test.findMany({
      where: {
        isDeleted: false,
        OR: [
          { workspaceId: admin.workspaceId },
          { workspaceId: null }
        ]
      },
      include: {
        parameters: {
          where: { isDeleted: false },
          orderBy: { order: "asc" },
          include: { parameter: true }
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
    let paginatedTests = tests;
    if (page !== null && limit !== null) {
      const startIndex = (page - 1) * limit;
      paginatedTests = tests.slice(startIndex, startIndex + limit);
    }

    return NextResponse.json({
      success: true,
      tests: serializeTests(paginatedTests),
      pagination: {
        page: page || 1,
        limit: limit || totalCount,
        totalCount,
        totalPages: limit ? Math.ceil(totalCount / limit) : 1
      }
    });
  } catch (error) {
    console.error("Workspace Tests GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin("TEST_WRITE");
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
        isDeleted: false,
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

    // Resolve or create Parameter "Result"
    let defaultParam = await prisma.parameter.findUnique({
      where: { name: "Result" }
    });
    if (!defaultParam) {
      defaultParam = await prisma.parameter.create({
        data: {
          name: "Result",
          normalRangeDefault: "As per report",
          unit: ""
        }
      });
    }

    // Create a default result parameter so user can type results in reports
    await prisma.testParameter.create({
      data: {
        testId: newTest.id,
        parameterId: defaultParam.id,
        order: 1,
      },
    });

    const testWithParams = await prisma.test.findFirst({
      where: { id: newTest.id, isDeleted: false },
      include: {
        parameters: {
          where: { isDeleted: false },
          orderBy: { order: "asc" },
          include: { parameter: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Test added successfully!",
      test: serializeSingleTest(testWithParams),
    });
  } catch (error) {
    console.error("Workspace Tests POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const admin = await requireAdmin("TEST_WRITE");
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
    const test = await prisma.test.findFirst({
      where: { id: parseInt(testId), isDeleted: false },
      include: {
        parameters: {
          where: { isDeleted: false },
          include: { parameter: true }
        }
      },
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
        test: serializeSingleTest(updatedTest),
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

      // 2. Clone its parameters mapping records
      if (test.parameters && test.parameters.length > 0) {
        const clonedParams = test.parameters.map((p) => ({
          testId: clonedTest.id,
          parameterId: p.parameterId, // Keep it pointed to the same master parameter
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
      test: serializeSingleTest(newTest),
    });
  } catch (error) {
    console.error("Workspace Tests PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const admin = await requireAdmin("TEST_WRITE");
    const searchParams = req.nextUrl.searchParams;
    let testId = searchParams.get("id") || searchParams.get("testId");

    if (!testId) {
      const body = await req.json().catch(() => ({}));
      const id = body.testId || body.id;
      if (!id) {
        return NextResponse.json(
          { success: false, message: "Test ID is required." },
          { status: 400 }
        );
      }
      testId = id;
    }

    const test = await prisma.test.findFirst({
      where: { id: parseInt(testId), isDeleted: false },
    });

    if (!test) {
      return NextResponse.json(
        { success: false, message: "Test not found or already deleted." },
        { status: 404 }
      );
    }

    if (test.workspaceId !== admin.workspaceId && test.workspaceId !== null) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to delete this test." },
        { status: 403 }
      );
    }

    // Soft delete the test
    await prisma.test.update({
      where: { id: test.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Also soft delete its parameters
    await prisma.testParameter.updateMany({
      where: { testId: test.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test deleted successfully.",
    });
  } catch (error) {
    console.error("Workspace Tests DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
