import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

// Helper to serialize Decimal and Dates
function serializeData(data) {
  return JSON.parse(JSON.stringify(data));
}

export async function GET(req) {
  try {
    await verifySuperAdminAPI();
    
    const searchParams = req.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const search = searchParams.get("search") || "";

    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 10;

    const where = {
      workspaceId: null,
      isDeleted: false,
      ...(search.trim() !== "" ? {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } }
        ]
      } : {})
    };

    const totalCount = await prisma.test.count({ where });

    const defaultTests = await prisma.test.findMany({
      where,
      include: {
        parameters: {
          where: { isDeleted: false },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      tests: serializeData(defaultTests),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("SuperAdmin Default Tests GET Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function POST(req) {
  try {
    await verifySuperAdminAPI();
    
    const body = await req.json().catch(() => ({}));
    const { name, code, price, parameters } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ success: false, error: "Test name is required." }, { status: 400 });
    }

    if (price === undefined || isNaN(parseFloat(price))) {
      return NextResponse.json({ success: false, error: "Valid test price is required." }, { status: 400 });
    }

    // Check if code is already used by another default test
    if (code && code.trim() !== "") {
      const duplicate = await prisma.test.findFirst({
        where: {
          workspaceId: null,
          code: code.trim(),
          isDeleted: false,
        }
      });
      if (duplicate) {
        return NextResponse.json({ success: false, error: `Test code "${code.trim()}" is already in use by another default test.` }, { status: 400 });
      }
    }

    // Validate parameters
    const paramList = Array.isArray(parameters) ? parameters : [];
    for (const p of paramList) {
      if (!p.name || typeof p.name !== "string" || p.name.trim() === "") {
        return NextResponse.json({ success: false, error: "Each parameter must have a valid name." }, { status: 400 });
      }
    }

    // Create the test and its parameters in a transaction
    const newTest = await prisma.$transaction(async (tx) => {
      return await tx.test.create({
        data: {
          name: name.trim(),
          code: code && code.trim() !== "" ? code.trim() : null,
          price: parseFloat(price),
          workspaceId: null,
          isDeleted: false,
          parameters: {
            create: paramList.map((p) => ({
              name: p.name.trim(),
              unit: p.unit && p.unit.trim() !== "" ? p.unit.trim() : null,
              order: parseInt(p.order) || 1,
              minValMale: p.minValMale !== "" && !isNaN(parseFloat(p.minValMale)) ? parseFloat(p.minValMale) : null,
              maxValMale: p.maxValMale !== "" && !isNaN(parseFloat(p.maxValMale)) ? parseFloat(p.maxValMale) : null,
              normalRangeMale: p.normalRangeMale && p.normalRangeMale.trim() !== "" ? p.normalRangeMale.trim() : null,
              minValFemale: p.minValFemale !== "" && !isNaN(parseFloat(p.minValFemale)) ? parseFloat(p.minValFemale) : null,
              maxValFemale: p.maxValFemale !== "" && !isNaN(parseFloat(p.maxValFemale)) ? parseFloat(p.maxValFemale) : null,
              normalRangeFemale: p.normalRangeFemale && p.normalRangeFemale.trim() !== "" ? p.normalRangeFemale.trim() : null,
              minValBaby: p.minValBaby !== "" && !isNaN(parseFloat(p.minValBaby)) ? parseFloat(p.minValBaby) : null,
              maxValBaby: p.maxValBaby !== "" && !isNaN(parseFloat(p.maxValBaby)) ? parseFloat(p.maxValBaby) : null,
              normalRangeBaby: p.normalRangeBaby && p.normalRangeBaby.trim() !== "" ? p.normalRangeBaby.trim() : null,
              normalRangeDefault: p.normalRangeDefault && p.normalRangeDefault.trim() !== "" ? p.normalRangeDefault.trim() : null,
              workspaceId: null,
              isDeleted: false,
            })),
          },
        },
        include: {
          parameters: {
            where: { isDeleted: false },
            orderBy: { order: "asc" },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Default test created successfully.",
      test: serializeData(newTest)
    });
  } catch (error) {
    console.error("SuperAdmin Default Test POST Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
