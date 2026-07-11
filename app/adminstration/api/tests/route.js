import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

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
          include: {
            parameter: true
          }
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      tests: serializeTests(defaultTests),
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
      const testRecord = await tx.test.create({
        data: {
          name: name.trim(),
          code: code && code.trim() !== "" ? code.trim() : null,
          price: parseFloat(price),
          workspaceId: null,
          isDeleted: false,
        }
      });

      for (const p of paramList) {
        const normName = p.name.trim();

        // Resolve or create parameter
        let parameter = await tx.parameter.findFirst({
          where: { name: { equals: normName } }
        });

        if (!parameter) {
          parameter = await tx.parameter.create({
            data: {
              name: normName,
              unit: p.unit && p.unit.trim() !== "" ? p.unit.trim() : null,
              minValMale: p.minValMale !== "" && p.minValMale !== undefined && !isNaN(parseFloat(p.minValMale)) ? parseFloat(p.minValMale) : null,
              maxValMale: p.maxValMale !== "" && p.maxValMale !== undefined && !isNaN(parseFloat(p.maxValMale)) ? parseFloat(p.maxValMale) : null,
              normalRangeMale: p.normalRangeMale && p.normalRangeMale.trim() !== "" ? p.normalRangeMale.trim() : null,
              minValFemale: p.minValFemale !== "" && p.minValFemale !== undefined && !isNaN(parseFloat(p.minValFemale)) ? parseFloat(p.minValFemale) : null,
              maxValFemale: p.maxValFemale !== "" && p.maxValFemale !== undefined && !isNaN(parseFloat(p.maxValFemale)) ? parseFloat(p.maxValFemale) : null,
              normalRangeFemale: p.normalRangeFemale && p.normalRangeFemale.trim() !== "" ? p.normalRangeFemale.trim() : null,
              minValBaby: p.minValBaby !== "" && p.minValBaby !== undefined && !isNaN(parseFloat(p.minValBaby)) ? parseFloat(p.minValBaby) : null,
              maxValBaby: p.maxValBaby !== "" && p.maxValBaby !== undefined && !isNaN(parseFloat(p.maxValBaby)) ? parseFloat(p.maxValBaby) : null,
              normalRangeBaby: p.normalRangeBaby && p.normalRangeBaby.trim() !== "" ? p.normalRangeBaby.trim() : null,
              normalRangeDefault: p.normalRangeDefault && p.normalRangeDefault.trim() !== "" ? p.normalRangeDefault.trim() : null,
            }
          });
        } else {
          // Keep shared dictionary updated with any recent range inputs
          parameter = await tx.parameter.update({
            where: { id: parameter.id },
            data: {
              unit: p.unit && p.unit.trim() !== "" ? p.unit.trim() : parameter.unit,
              minValMale: p.minValMale !== "" && p.minValMale !== undefined && !isNaN(parseFloat(p.minValMale)) ? parseFloat(p.minValMale) : parameter.minValMale,
              maxValMale: p.maxValMale !== "" && p.maxValMale !== undefined && !isNaN(parseFloat(p.maxValMale)) ? parseFloat(p.maxValMale) : parameter.maxValMale,
              normalRangeMale: p.normalRangeMale && p.normalRangeMale.trim() !== "" ? p.normalRangeMale.trim() : parameter.normalRangeMale,
              minValFemale: p.minValFemale !== "" && p.minValFemale !== undefined && !isNaN(parseFloat(p.minValFemale)) ? parseFloat(p.minValFemale) : parameter.minValFemale,
              maxValFemale: p.maxValFemale !== "" && p.maxValFemale !== undefined && !isNaN(parseFloat(p.maxValFemale)) ? parseFloat(p.maxValFemale) : parameter.maxValFemale,
              normalRangeFemale: p.normalRangeFemale && p.normalRangeFemale.trim() !== "" ? p.normalRangeFemale.trim() : parameter.normalRangeFemale,
              minValBaby: p.minValBaby !== "" && p.minValBaby !== undefined && !isNaN(parseFloat(p.minValBaby)) ? parseFloat(p.minValBaby) : parameter.minValBaby,
              maxValBaby: p.maxValBaby !== "" && p.maxValBaby !== undefined && !isNaN(parseFloat(p.maxValBaby)) ? parseFloat(p.maxValBaby) : parameter.maxValBaby,
              normalRangeBaby: p.normalRangeBaby && p.normalRangeBaby.trim() !== "" ? p.normalRangeBaby.trim() : parameter.normalRangeBaby,
              normalRangeDefault: p.normalRangeDefault && p.normalRangeDefault.trim() !== "" ? p.normalRangeDefault.trim() : parameter.normalRangeDefault,
            }
          });
        }

        await tx.testParameter.create({
          data: {
            testId: testRecord.id,
            parameterId: parameter.id,
            order: parseInt(p.order) || 1,
            isHeader: p.isHeader || false,
            isDeleted: false,
          }
        });
      }

      return await tx.test.findUnique({
        where: { id: testRecord.id },
        include: {
          parameters: {
            where: { isDeleted: false },
            orderBy: { order: "asc" },
            include: {
              parameter: true
            }
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Default test created successfully.",
      test: serializeSingleTest(newTest)
    });
  } catch (error) {
    console.error("SuperAdmin Default Test POST Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
