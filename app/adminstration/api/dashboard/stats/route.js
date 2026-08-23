import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function GET() {
  try {
    await verifySuperAdminAPI();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Overall Platform Counts
    const [
      totalWorkspaces,
      activeWorkspaces,
      totalAdmins,
      totalDoctors,
      totalTests,
      totalRegistrations,
      regToday,
      regThisMonth,
      regLast7Days,
    ] = await Promise.all([
      prisma.workspace.count({ where: { isDeleted: false } }),
      prisma.workspace.count({ where: { isDeleted: false, isActive: true } }),
      prisma.admin.count(),
      prisma.doctor.count({ where: { isDeleted: false } }),
      prisma.test.count({ where: { isDeleted: false } }),
      prisma.registration.count({ where: { isDeleted: false } }),
      prisma.registration.count({ where: { isDeleted: false, date: { gte: startOfToday } } }),
      prisma.registration.count({ where: { isDeleted: false, date: { gte: startOfMonth } } }),
      prisma.registration.count({ where: { isDeleted: false, date: { gte: startOf7DaysAgo } } }),
    ]);

    // 2. SaaS Subscription Payments Aggregation
    const saasFinancials = await prisma.workspacePayment
      .aggregate({
        _sum: { amount: true },
      })
      .catch(() => ({ _sum: { amount: 0 } }));

    // 3. Financial Aggregations across all registrations
    const totalFinancials = await prisma.registration.aggregate({
      where: { isDeleted: false },
      _sum: {
        totalAmount: true,
        discountAmount: true,
        collectionCharge: true,
        receivedAmount: true,
        dueAmount: true,
      },
    });

    const monthFinancials = await prisma.registration.aggregate({
      where: { isDeleted: false, date: { gte: startOfMonth } },
      _sum: {
        totalAmount: true,
        discountAmount: true,
        collectionCharge: true,
        receivedAmount: true,
        dueAmount: true,
      },
    });

    const todayFinancials = await prisma.registration.aggregate({
      where: { isDeleted: false, date: { gte: startOfToday } },
      _sum: {
        totalAmount: true,
        discountAmount: true,
        collectionCharge: true,
        receivedAmount: true,
        dueAmount: true,
      },
    });

    // 3. Workspaces Subscription Expiry Breakdown
    const allWorkspaces = await prisma.workspace.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        expireAt: true,
        isActive: true,
        createdAt: true,
        admins: { select: { id: true, name: true, email: true } },
      },
    });

    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let activeCount = 0;
    let expiringSoonCount = 0;
    let urgentExpiringCount = 0;
    let expiredCount = 0;
    let noExpiryCount = 0;

    const expiringWorkspacesList = [];

    allWorkspaces.forEach((ws) => {
      if (!ws.expireAt) {
        noExpiryCount++;
      } else {
        const expDate = new Date(ws.expireAt);
        if (expDate < now) {
          expiredCount++;
          expiringWorkspacesList.push({
            id: ws.id,
            name: ws.name,
            slug: ws.slug,
            expireAt: ws.expireAt.toISOString(),
            status: "expired",
          });
        } else if (expDate <= in7Days) {
          urgentExpiringCount++;
          expiringWorkspacesList.push({
            id: ws.id,
            name: ws.name,
            slug: ws.slug,
            expireAt: ws.expireAt.toISOString(),
            status: "urgent",
          });
        } else if (expDate <= in30Days) {
          expiringSoonCount++;
          expiringWorkspacesList.push({
            id: ws.id,
            name: ws.name,
            slug: ws.slug,
            expireAt: ws.expireAt.toISOString(),
            status: "expiring_soon",
          });
        } else {
          activeCount++;
        }
      }
    });

    // 4. Lab Performance Leaderboard (Top Labs by Registrations & Revenue)
    const labsStats = await Promise.all(
      allWorkspaces.map(async (ws) => {
        const [totalPatients, todayPatients, monthPatients, labFinancials] = await Promise.all([
          prisma.registration.count({ where: { workspaceId: ws.id, isDeleted: false } }),
          prisma.registration.count({ where: { workspaceId: ws.id, isDeleted: false, date: { gte: startOfToday } } }),
          prisma.registration.count({ where: { workspaceId: ws.id, isDeleted: false, date: { gte: startOfMonth } } }),
          prisma.registration.aggregate({
            where: { workspaceId: ws.id, isDeleted: false },
            _sum: {
              totalAmount: true,
              discountAmount: true,
              collectionCharge: true,
              receivedAmount: true,
              dueAmount: true,
            },
          }),
        ]);

        const labBilled = Math.max(
          0,
          Number(labFinancials._sum.totalAmount || 0) -
            Number(labFinancials._sum.discountAmount || 0) +
            Number(labFinancials._sum.collectionCharge || 0)
        );

        return {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          expireAt: ws.expireAt ? ws.expireAt.toISOString() : null,
          isActive: ws.isActive,
          adminsCount: ws.admins.length,
          totalPatients,
          todayPatients,
          monthPatients,
          totalBilled: labBilled,
          totalCollected: Number(labFinancials._sum.receivedAmount || 0),
          totalDue: Number(labFinancials._sum.dueAmount || 0),
        };
      })
    );

    const topLabsByRegistrations = [...labsStats].sort((a, b) => b.totalPatients - a.totalPatients).slice(0, 10);
    const topLabsByRevenue = [...labsStats].sort((a, b) => b.totalCollected - a.totalCollected).slice(0, 10);

    // 5. Daily Trend (Last 14 Days)
    const last14DaysRegistrations = await prisma.registration.findMany({
      where: {
        isDeleted: false,
        date: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
      },
      select: {
        date: true,
        totalAmount: true,
        discountAmount: true,
        collectionCharge: true,
        receivedAmount: true,
      },
    });

    const trendMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      trendMap[dateKey] = { date: dateKey, registrations: 0, billed: 0, collected: 0 };
    }

    last14DaysRegistrations.forEach((reg) => {
      const d = new Date(reg.date);
      const dateKey = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      if (trendMap[dateKey]) {
        trendMap[dateKey].registrations += 1;
        const regNet = Math.max(
          0,
          Number(reg.totalAmount || 0) - Number(reg.discountAmount || 0) + Number(reg.collectionCharge || 0)
        );
        trendMap[dateKey].billed += regNet;
        trendMap[dateKey].collected += Number(reg.receivedAmount || 0);
      }
    });

    const dailyTrend = Object.values(trendMap);

    // 6. Top Doctors Across All Labs
    const topDoctorsRaw = await prisma.doctor.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        clinicName: true,
        workspace: { select: { name: true } },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: {
        registrations: {
          _count: "desc",
        },
      },
      take: 8,
    });

    const topDoctors = topDoctorsRaw.map((doc) => ({
      id: doc.id,
      name: doc.name,
      clinic: doc.clinicName || "—",
      labName: doc.workspace?.name || "Global",
      referralsCount: doc._count.registrations,
    }));

    // 7. Gender Breakdown
    const genderStats = await prisma.registration.groupBy({
      by: ["gender"],
      where: { isDeleted: false },
      _count: { id: true },
    });

    const genderBreakdown = genderStats.map((g) => ({
      name: g.gender || "Unknown",
      value: g._count.id,
    }));

    // 8. Payment Modes Breakdown
    const paymentModeStats = await prisma.registration.groupBy({
      by: ["paymentMode"],
      where: { isDeleted: false },
      _count: { id: true },
      _sum: { receivedAmount: true },
    });

    const paymentModes = paymentModeStats.map((p) => ({
      mode: p.paymentMode || "Cash",
      count: p._count.id,
      amount: Number(p._sum.receivedAmount || 0),
    }));

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalWorkspaces,
          activeWorkspaces,
          expiredWorkspaces: expiredCount,
          expiringSoonWorkspaces: urgentExpiringCount + expiringSoonCount,
          totalAdmins,
          totalDoctors,
          totalTests,
          totalRegistrations,
          regToday,
          regThisMonth,
          regLast7Days,
          totalRevenue: Number(totalFinancials._sum.receivedAmount || 0),
          totalSaaSRevenue: Number(saasFinancials._sum?.amount || 0),
          totalBilled: Math.max(
            0,
            Number(totalFinancials._sum.totalAmount || 0) -
              Number(totalFinancials._sum.discountAmount || 0) +
              Number(totalFinancials._sum.collectionCharge || 0)
          ),
          totalDue: Number(totalFinancials._sum.dueAmount || 0),
          revenueToday: Number(todayFinancials._sum.receivedAmount || 0),
          revenueThisMonth: Number(monthFinancials._sum.receivedAmount || 0),
        },
        subscriptionDistribution: [
          { name: "Active (> 30d)", value: activeCount, color: "#16a34a" },
          { name: "Expiring Soon (< 30d)", value: expiringSoonCount, color: "#f59e0b" },
          { name: "Urgent Expiry (< 7d)", value: urgentExpiringCount, color: "#ea580c" },
          { name: "Expired", value: expiredCount, color: "#dc2626" },
          { name: "No Expiry", value: noExpiryCount, color: "#64748b" },
        ].filter((x) => x.value > 0),
        dailyTrend,
        topLabsByRegistrations,
        topLabsByRevenue,
        allLabs: labsStats,
        topDoctors,
        genderBreakdown,
        paymentModes,
        expiringWorkspaces: expiringWorkspacesList.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("SuperAdmin Dashboard Stats Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
