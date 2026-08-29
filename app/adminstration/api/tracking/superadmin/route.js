import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function POST(req) {
  try {
    const superAdmin = await verifySuperAdminAPI().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const { sessionId, startUTC, ENDUTC, mode, durationInMin } = body;

    const parsedStart = new Date(startUTC);
    const parsedEnd = new Date(ENDUTC);

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid timestamp format" }, { status: 400 });
    }

    const calculatedMin = Math.max(0, (parsedEnd.getTime() - parsedStart.getTime()) / 60000);
    const safeDuration = Math.min(Math.max(0, parseFloat(durationInMin) || 0), Math.max(0.1, calculatedMin));

    // Skip persisting sub-20 second slices (< 0.33 min)
    if (safeDuration < 0.33) {
      return NextResponse.json({ success: true, message: "Sub-threshold slice skipped" });
    }

    const tracking = await prisma.superAdminTracking.upsert({
      where: { sessionId },
      update: {
        ENDUTC: parsedEnd,
        mode: mode || "online",
        durationInMin: parseFloat(safeDuration.toFixed(2)),
        superAdminId: superAdmin ? superAdmin.id : null
      },
      create: {
        sessionId,
        startUTC: parsedStart,
        ENDUTC: parsedEnd,
        mode: mode || "online",
        durationInMin: parseFloat(safeDuration.toFixed(2)),
        superAdminId: superAdmin ? superAdmin.id : null
      }
    });

    return NextResponse.json({ success: true, id: tracking.id });
  } catch (err) {
    console.error("SuperAdmin tracking API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
