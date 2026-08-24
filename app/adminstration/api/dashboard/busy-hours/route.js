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

    // Day of week in IST (0 = Sun, 1 = Mon, ..., 6 = Sat)
    const currentDayOfWeek = nowIstDate.getUTCDay();

    // Start of the week (Sunday 00:00:00.000 IST)
    const sundayIstDate = new Date(nowIstDate);
    sundayIstDate.setUTCDate(nowIstDate.getUTCDate() - currentDayOfWeek + weekOffset * 7);
    sundayIstDate.setUTCHours(0, 0, 0, 0);

    // End of the week (Saturday 23:59:59.999 IST)
    const saturdayIstDate = new Date(sundayIstDate);
    saturdayIstDate.setUTCDate(sundayIstDate.getUTCDate() + 6);
    saturdayIstDate.setUTCHours(23, 59, 59, 999);

    // Convert IST week boundaries back to UTC for database queries
    const weekStartUtc = new Date(sundayIstDate.getTime() - IST_OFFSET_MS);
    const weekEndUtc = new Date(saturdayIstDate.getTime() - IST_OFFSET_MS);

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

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayShortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const daysData = [];
    const allActiveAdminIds = new Set();
    let weekTotalActiveMinutes = 0;
    let overallPeakUsers = 0;
    let overallPeakDay = null;
    let overallPeakHour = null;

    // Process each day from Sunday (0) to Saturday (6)
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayIstDate = new Date(sundayIstDate);
      dayIstDate.setUTCDate(sundayIstDate.getUTCDate() + dayIndex);

      const dayDateStr = dayIstDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const dayDisplayDate = dayIstDate.toLocaleDateString("en-IN", {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
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

      // Analyze 24 hourly buckets for this day
      const hourlyBuckets = [];
      let dayTotalMinutes = 0;
      const dayActiveAdminIds = new Set();
      let dayPeakUsers = 0;
      let dayPeakHourIndex = 0;
      let dayPeakMinutes = 0;

      for (let h = 0; h < 24; h++) {
        const hourStartIstTime = dayStartIstTime + h * 60 * 60 * 1000;
        const hourEndIstTime = hourStartIstTime + 60 * 60 * 1000;

        // Convert hour bucket to UTC to match tracking session timestamps
        const hourStartUtcTime = hourStartIstTime - IST_OFFSET_MS;
        const hourEndUtcTime = hourEndIstTime - IST_OFFSET_MS;

        const hourActiveAdmins = new Map();
        let hourTotalMinutes = 0;
        let hourSessionCount = 0;

        for (const t of trackings) {
          const tStart = new Date(t.startUTC).getTime();
          const tEnd = new Date(t.ENDUTC).getTime();

          // Check overlap between [tStart, tEnd] and [hourStartUtcTime, hourEndUtcTime]
          if (tStart < hourEndUtcTime && tEnd > hourStartUtcTime) {
            const overlapStart = Math.max(tStart, hourStartUtcTime);
            const overlapEnd = Math.min(tEnd, hourEndUtcTime);
            const overlapMinutes = Math.max(0, (overlapEnd - overlapStart) / (60 * 1000));

            hourTotalMinutes += overlapMinutes;
            hourSessionCount++;

            const adminId = t.adminId || t.sessionId;
            if (!hourActiveAdmins.has(adminId)) {
              hourActiveAdmins.set(adminId, {
                id: t.admin?.id || null,
                name: t.admin?.name || "Admin User",
                workspaceName: t.admin?.workspace?.name || "Workspace",
                minutes: overlapMinutes,
              });
            } else {
              hourActiveAdmins.get(adminId).minutes += overlapMinutes;
            }

            if (t.adminId) {
              dayActiveAdminIds.add(t.adminId);
              allActiveAdminIds.add(t.adminId);
            }
          }
        }

        const activeUsersCount = hourActiveAdmins.size;
        dayTotalMinutes += hourTotalMinutes;

        hourlyBuckets.push({
          hour: h,
          label: formatHourLabel(h),
          shortLabel: `${h % 12 === 0 ? 12 : h % 12}${h >= 12 ? "pm" : "am"}`,
          activeUsers: activeUsersCount,
          sessionsCount: hourSessionCount,
          activeMinutes: Math.round(hourTotalMinutes),
          activeAdminsList: Array.from(hourActiveAdmins.values()).slice(0, 5),
        });

        // Determine day's peak hour
        if (
          activeUsersCount > dayPeakUsers ||
          (activeUsersCount === dayPeakUsers && hourTotalMinutes > dayPeakMinutes && activeUsersCount > 0)
        ) {
          dayPeakUsers = activeUsersCount;
          dayPeakHourIndex = h;
          dayPeakMinutes = hourTotalMinutes;
        }
      }

      weekTotalActiveMinutes += dayTotalMinutes;

      // Check if this day's peak is the overall week's peak
      if (dayPeakUsers > overallPeakUsers && dayPeakUsers > 0) {
        overallPeakUsers = dayPeakUsers;
        overallPeakDay = dayNames[dayIndex];
        overallPeakHour = formatHourLabel(dayPeakHourIndex);
      }

      const hasActivity = dayPeakUsers > 0 || dayTotalMinutes > 0;

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
        hourly: hourlyBuckets,
      });
    }

    // Format week date range display
    const startRangeStr = sundayIstDate.toLocaleDateString("en-IN", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const endRangeStr = saturdayIstDate.toLocaleDateString("en-IN", {
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
