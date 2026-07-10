import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function POST(req) {
  try {
    const superAdmin = await verifySuperAdminAPI().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const { sessionId, startUTC, ENDUTC, mode, durationInMin } = body;

    if (!sessionId || !startUTC || !ENDUTC) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const tracking = await prisma.superAdminTracking.upsert({
      where: { sessionId },
      update: {
        ENDUTC: new Date(ENDUTC),
        mode,
        durationInMin: parseFloat(durationInMin),
        superAdminId: superAdmin ? superAdmin.id : null
      },
      create: {
        sessionId,
        startUTC: new Date(startUTC),
        ENDUTC: new Date(ENDUTC),
        mode,
        durationInMin: parseFloat(durationInMin),
        superAdminId: superAdmin ? superAdmin.id : null
      }
    });

    return NextResponse.json({ success: true, id: tracking.id });
  } catch (err) {
    console.error("SuperAdmin tracking API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
