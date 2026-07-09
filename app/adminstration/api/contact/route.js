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
      isDeleted: false,
      ...(search.trim() !== "" ? {
        OR: [
          { name: { contains: search } },
          { emailOrPhone: { contains: search } },
          { message: { contains: search } }
        ]
      } : {})
    };

    const totalCount = await prisma.leadContact.count({ where });

    const contacts = await prisma.leadContact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      contacts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("SuperAdmin Contacts GET Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function PUT(req) {
  try {
    await verifySuperAdminAPI();
    const body = await req.json().catch(() => ({}));
    const { id, isRead } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required." }, { status: 400 });
    }

    const updated = await prisma.leadContact.update({
      where: { id: parseInt(id) },
      data: { isRead }
    });

    return NextResponse.json({ success: true, contact: updated });
  } catch (error) {
    console.error("SuperAdmin Contacts PUT Error:", error);
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
    await prisma.leadContact.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, message: "Contact inquiry soft-deleted successfully." });
  } catch (error) {
    console.error("SuperAdmin Contacts DELETE Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
