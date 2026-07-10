import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req) {
  try {
    const admin = await requireAdmin().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const { sessionId, startUTC, ENDUTC, mode, durationInMin } = body;

    if (!sessionId || !startUTC || !ENDUTC) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const tracking = await prisma.adminTracking.upsert({
      where: { sessionId },
      update: {
        ENDUTC: new Date(ENDUTC),
        mode,
        durationInMin: parseFloat(durationInMin),
        adminId: admin ? admin.id : null
      },
      create: {
        sessionId,
        startUTC: new Date(startUTC),
        ENDUTC: new Date(ENDUTC),
        mode,
        durationInMin: parseFloat(durationInMin),
        adminId: admin ? admin.id : null
      }
    });

    return NextResponse.json({ success: true, id: tracking.id });
  } catch (err) {
    console.error("Admin tracking API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
