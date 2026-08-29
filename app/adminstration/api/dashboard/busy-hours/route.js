import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30 in milliseconds

const formatHourLabel = (hour24) => {
  const period = hour24 >= 12 ? "PM" : "AM";
  const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const nextHour24 = (hour24 + 1) % 24;
  const nextPeriod = nextHour24 >= 12 ? "PM" : "AM";
  const nextH12 = nextHour24 % 12 === 0 ? 12 : nextHour24 % 12;
  return `${h12}:00 ${period} - ${nextH12}:00 ${nextPeriod}`;
};

export async function GET(req) {
  try {
    await verifySuperAdminAPI();

    const { searchParams } = new URL(req.url);
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0", 10);

    // Compute current IST time
    const nowUtc = new Date();
    const nowIstTime = nowUtc.getTime() + IST_OFFSET_MS;
    const nowIstDate = new Date(nowIstTime);

    // Distance to Monday (0 = Monday, ..., 6 = Sunday)
    const currentDayOfWeek = (nowIstDate.getUTCDay() + 6) % 7;

    // Start of the week (Monday 00:00:00.000 IST)
    const mondayIstDate = new Date(nowIstDate);
    mondayIstDate.setUTCDate(nowIstDate.getUTCDate() - currentDayOfWeek + weekOffset * 7);
    mondayIstDate.setUTCHours(0, 0, 0, 0);

    // End of the week (Sunday 23:59:59.999 IST)
    const sundayIstDate = new Date(mondayIstDate);
    sundayIstDate.setUTCDate(mondayIstDate.getUTCDate() + 6);
    sundayIstDate.setUTCHours(23, 59, 59, 999);

    // Convert IST week boundaries back to UTC for database queries
    const weekStartUtc = new Date(mondayIstDate.getTime() - IST_OFFSET_MS);
    const weekEndUtc = new Date(sundayIstDate.getTime() - IST_OFFSET_MS);

    // Query all AdminTracking records overlapping this week
    const trackings = await prisma.adminTracking.findMany({
      where: {
        startUTC: { lte: weekEndUtc },
        ENDUTC: { gte: weekStartUtc },
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { startUTC: "asc" },
    });

    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayShortNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const daysData = [];
    const allActiveAdminIds = new Set();
    let weekTotalActiveMinutes = 0;
    let overallPeakUsers = 0;
    let overallPeakDay = null;
    let overallPeakHour = null;

    const TOTAL_SLOTS = 96; // 15-minute resolution per day (4 slots * 24 hours)
    const SLOT_DURATION_MS = 15 * 60 * 1000;

    // Process each day from Monday (0) to Sunday (6)
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayIstDate = new Date(mondayIstDate);
      dayIstDate.setUTCDate(mondayIstDate.getUTCDate() + dayIndex);

      const dayDateStr = dayIstDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const dayDisplayDate = dayIstDate.toLocaleDateString("en-US", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
      });

      const dayStartIstTime = dayIstDate.getTime();
      const dayEndIstTime = dayStartIstTime + 24 * 60 * 60 * 1000;

      // Check if this day is "Today" in IST
      const isToday =
        nowIstDate.getUTCFullYear() === dayIstDate.getUTCFullYear() &&
        nowIstDate.getUTCMonth() === dayIstDate.getUTCMonth() &&
        nowIstDate.getUTCDate() === dayIstDate.getUTCDate();

      // Check if this day is in the future
      const isFuture = dayIstDate.getTime() > nowIstDate.getTime() && !isToday;

      let dayTotalMinutes = 0;
      const dayActiveAdminIds = new Set();
      const slots = [];

      for (let s = 0; s < TOTAL_SLOTS; s++) {
        const slotStartIstTime = dayStartIstTime + s * SLOT_DURATION_MS;
        const slotEndIstTime = slotStartIstTime + SLOT_DURATION_MS;

        // Convert slot bucket to UTC to match tracking session timestamps
        const slotStartUtcTime = slotStartIstTime - IST_OFFSET_MS;
        const slotEndUtcTime = slotEndIstTime - IST_OFFSET_MS;

        let slotMinutes = 0;
        let slotSessionCount = 0;
        const slotActiveAdmins = new Map();

        for (const t of trackings) {
          const tStart = new Date(t.startUTC).getTime();
          const tEnd = new Date(t.ENDUTC).getTime();

          // Check overlap between [tStart, tEnd] and [slotStartUtcTime, slotEndUtcTime]
          if (tStart < slotEndUtcTime && tEnd > slotStartUtcTime) {
            const overlapStart = Math.max(tStart, slotStartUtcTime);
            const overlapEnd = Math.min(tEnd, slotEndUtcTime);
            const overlapMin = Math.max(0, (overlapEnd - overlapStart) / (60 * 1000));

            slotMinutes += overlapMin;
            slotSessionCount++;

            const adminId = t.adminId || t.sessionId;
            if (!slotActiveAdmins.has(adminId)) {
              slotActiveAdmins.set(adminId, {
                id: t.admin?.id || null,
                name: t.admin?.name || "Admin User",
                workspaceName: t.admin?.workspace?.name || "Workspace",
                minutes: overlapMin,
              });
            } else {
              slotActiveAdmins.get(adminId).minutes += overlapMin;
            }

            if (t.adminId) {
              dayActiveAdminIds.add(t.adminId);
              allActiveAdminIds.add(t.adminId);
            }
          }
        }

        const activeMinutes = Math.min(15, Math.round(slotMinutes));
        dayTotalMinutes += activeMinutes;
        const isSlotFuture = slotStartIstTime > nowIstTime;

        const startHour24 = Math.floor((s * 15) / 60);
        const startMin = (s * 15) % 60;
        const endHour24 = Math.floor(((s + 1) * 15) / 60);
        const endMin = ((s + 1) * 15) % 60;

        const formatTime = (h, m) => {
          const period = h >= 12 && h < 24 ? "PM" : "AM";
          const h12 = h % 12 === 0 ? 12 : (h === 24 ? 12 : h % 12);
          const mStr = m.toString().padStart(2, "0");
          return `${h12}:${mStr} ${period}`;
        };

        const timeRangeStr = `${formatTime(startHour24, startMin)} – ${formatTime(endHour24, endMin)}`;

        slots.push({
          index: s,
          timeRangeStr,
          activeMinutes,
          isActive: activeMinutes > 0,
          sessionCount: slotSessionCount,
          activeAdminsList: Array.from(slotActiveAdmins.values()),
          isFuture: isSlotFuture,
        });
      }

      // Analyze 24 hourly buckets for peak hour determination
      let dayPeakUsers = 0;
      let dayPeakHourIndex = 0;
      let dayPeakMinutes = 0;

      for (let h = 0; h < 24; h++) {
        const hourSlots = slots.slice(h * 4, (h + 1) * 4);
        const hourTotalMinutes = hourSlots.reduce((acc, curr) => acc + curr.activeMinutes, 0);
        const hourAdminsMap = new Map();
        hourSlots.forEach((slot) => {
          slot.activeAdminsList.forEach((adm) => {
            if (adm.id) hourAdminsMap.set(adm.id, adm);
          });
        });
        const hourUsersCount = hourAdminsMap.size;

        if (
          hourUsersCount > dayPeakUsers ||
          (hourUsersCount === dayPeakUsers && hourTotalMinutes > dayPeakMinutes && hourUsersCount > 0)
        ) {
          dayPeakUsers = hourUsersCount;
          dayPeakHourIndex = h;
          dayPeakMinutes = hourTotalMinutes;
        }
      }

      weekTotalActiveMinutes += dayTotalMinutes;

      if (dayPeakUsers > overallPeakUsers && dayPeakUsers > 0) {
        overallPeakUsers = dayPeakUsers;
        overallPeakDay = dayNames[dayIndex];
        overallPeakHour = formatHourLabel(dayPeakHourIndex);
      }

      const hasActivity = dayTotalMinutes > 0;

      daysData.push({
        dayIndex,
        dayName: dayNames[dayIndex],
        dayShort: dayShortNames[dayIndex],
        date: dayDateStr,
        displayDate: dayDisplayDate,
        isToday,
        isFuture,
        hasActivity,
        peakHour: hasActivity ? formatHourLabel(dayPeakHourIndex) : "No Activity",
        peakHourShort: hasActivity ? `${dayPeakHourIndex % 12 === 0 ? 12 : dayPeakHourIndex % 12} ${dayPeakHourIndex >= 12 ? "PM" : "AM"}` : "—",
        peakHourIndex: hasActivity ? dayPeakHourIndex : null,
        peakUsers: dayPeakUsers,
        peakMinutes: Math.round(dayPeakMinutes),
        totalActiveUsers: dayActiveAdminIds.size,
        totalActiveHours: parseFloat((dayTotalMinutes / 60).toFixed(1)),
        totalActiveMinutes: Math.round(dayTotalMinutes),
        slots,
      });
    }

    // Format week date range display
    const startRangeStr = mondayIstDate.toLocaleDateString("en-US", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
    });
    const endRangeStr = sundayIstDate.toLocaleDateString("en-US", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return NextResponse.json({
      success: true,
      data: {
        weekOffset,
        isCurrentWeek: weekOffset === 0,
        dateRange: `${startRangeStr} – ${endRangeStr}`,
        startFormatted: startRangeStr,
        endFormatted: endRangeStr,
        totalActiveUsersInWeek: allActiveAdminIds.size,
        totalActiveHoursInWeek: parseFloat((weekTotalActiveMinutes / 60).toFixed(1)),
        overallPeakDay: overallPeakDay || "N/A",
        overallPeakHour: overallPeakHour || "No Activity Recorded",
        overallPeakUsers,
        days: daysData,
      },
    });
  } catch (error) {
    console.error("SuperAdmin Busy Hours Analytics API Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
