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
