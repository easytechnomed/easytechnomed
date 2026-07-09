import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

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
      ...(search.trim() !== "" ? {
        OR: [
          { contact: { contains: search } },
          { type: { contains: search } }
        ]
      } : {})
    };

    const totalCount = await prisma.lead.count({ where });

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      leads,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("SuperAdmin Leads GET Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function DELETE(req) {
  try {
    await verifySuperAdminAPI();
    const searchParams = req.nextUrl.searchParams;
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json({ success: false, error: "ID is required." }, { status: 400 });
    }

    const id = parseInt(idParam);
    await prisma.lead.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Lead deleted successfully." });
  } catch (error) {
    console.error("SuperAdmin Leads DELETE Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
