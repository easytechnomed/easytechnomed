import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req) {
  try {
    await verifySuperAdminAPI();

    const searchParams = req.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 10;
    const totalCount = await prisma.admin.count();

    const clientTodayStart = searchParams.get("todayStart");
    const clientTodayEnd = searchParams.get("todayEnd");

    let todayStart;
    let todayEnd;

    if (clientTodayStart && !isNaN(new Date(clientTodayStart).getTime())) {
      todayStart = new Date(clientTodayStart);
    } else {
      // Fallback: Compute IST (UTC+5:30) Start of Day
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const nowIstDate = new Date(Date.now() + IST_OFFSET_MS);
      nowIstDate.setUTCHours(0, 0, 0, 0);
      todayStart = new Date(nowIstDate.getTime() - IST_OFFSET_MS);
    }

    if (clientTodayEnd && !isNaN(new Date(clientTodayEnd).getTime())) {
      todayEnd = new Date(clientTodayEnd);
    } else {
      todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    }

    const admins = await prisma.admin.findMany({
      include: {
        workspace: { select: { name: true } },
        role: { select: { id: true, name: true } },
        trackings: {
          where: {
            startUTC: { lte: todayEnd },
            ENDUTC: { gte: todayStart },
          },
          select: {
            startUTC: true,
            ENDUTC: true,
            durationInMin: true,
          },
          orderBy: { startUTC: "asc" },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const serializedAdmins = admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      mobileNumber: admin.mobileNumber || "",
      isActive: admin.isActive,
      isApproved: admin.isApproved,
      role: admin.role,
      workspace: admin.workspace,
      todayTrackings: admin.trackings || [],
    }));

    return NextResponse.json({
      success: true,
      admins: serializedAdmins,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error("SuperAdmin Admins GET Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function POST(req) {
  try {
    await verifySuperAdminAPI();
    const body = await req.json().catch(() => ({}));

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const workspaceId = parseInt(body.workspaceId);
    const roleId = parseInt(body.roleId) || 1;

    if (!name || !email || !password || isNaN(workspaceId)) {
      return NextResponse.json({ success: false, error: "All fields are required." });
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      return NextResponse.json({ success: false, error: "Email is already in use by another admin." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        workspaceId,
        roleId,
        isApproved: true,
        isEmailVerified: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, message: "Admin account created and assigned successfully!" });
  } catch (error) {
    console.error("SuperAdmin Admins POST Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
