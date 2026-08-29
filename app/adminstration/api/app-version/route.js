import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function GET(req) {
  try {
    await verifySuperAdminAPI();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const mandatory = searchParams.get("mandatory") || "all";

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { version: { contains: search } },
        { title: { contains: search } },
        { description: { contains: search } },
        { changes: { contains: search } },
      ];
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    if (mandatory === "yes") {
      where.isMandatory = true;
    } else if (mandatory === "no") {
      where.isMandatory = false;
    }

    // Parallel fetch: records, count, and overall stats
    const [versions, totalCount, totalAll, totalActive, totalMandatory, latestActive] = await Promise.all([
      prisma.appVersion.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appVersion.count({ where }),
      prisma.appVersion.count(),
      prisma.appVersion.count({ where: { isActive: true } }),
      prisma.appVersion.count({ where: { isMandatory: true } }),
      prisma.appVersion.findFirst({
        where: { isActive: true },
        orderBy: [{ createdAt: "desc" }],
      }),
    ]);

    return NextResponse.json({
      success: true,
      versions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      stats: {
        total: totalAll,
        active: totalActive,
        inactive: totalAll - totalActive,
        mandatory: totalMandatory,
        latestVersion: latestActive ? latestActive.version : null,
        latestReleaseDate: latestActive ? latestActive.releaseDate : null,
      },
    });
  } catch (error) {
    console.error("SuperAdmin AppVersion GET Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch app versions." },
      { status }
    );
  }
}

export async function POST(req) {
  try {
    await verifySuperAdminAPI();

    const body = await req.json().catch(() => ({}));
    const version = body.version?.trim();
    const title = body.title?.trim();
    const description = body.description?.trim() || null;
    const changes = body.changes?.trim() || null;
    const isMandatory = Boolean(body.isMandatory);
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
    const releaseDate = body.releaseDate ? new Date(body.releaseDate) : new Date();

    if (!version || !title) {
      return NextResponse.json(
        { success: false, error: "Version string (e.g. 2.1.0) and Title are required." },
        { status: 400 }
      );
    }

    // Check if version already exists
    const existing = await prisma.appVersion.findUnique({
      where: { version },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `App version "${version}" already exists. Please specify a unique version.` },
        { status: 409 }
      );
    }

    const newAppVersion = await prisma.appVersion.create({
      data: {
        version,
        title,
        description,
        changes,
        isMandatory,
        isActive,
        releaseDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Version ${version} published successfully.`,
      version: newAppVersion,
    });
  } catch (error) {
    console.error("SuperAdmin AppVersion POST Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create app version." },
      { status }
    );
  }
}
