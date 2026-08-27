import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySuperAdminAPI } from "@/lib/auth";

export async function GET(req) {
  try {
    await verifySuperAdminAPI();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "20", 10)));
    const workspaceIdParam = searchParams.get("workspaceId");
    const statusParam = searchParams.get("status");
    const featureParam = searchParams.get("feature");
    const modelParam = searchParams.get("model");
    const search = (searchParams.get("search") || "").trim();
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const daysParam = parseInt(searchParams.get("days") || "30", 10);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build filter for paginated logs
    const logWhere = {};

    if (workspaceIdParam && workspaceIdParam !== "all") {
      logWhere.workspaceId = parseInt(workspaceIdParam, 10);
    }

    if (statusParam && statusParam !== "all") {
      logWhere.status = statusParam;
    }

    if (featureParam && featureParam !== "all") {
      logWhere.feature = featureParam;
    }

    if (modelParam && modelParam !== "all") {
      logWhere.model = modelParam;
    }

    if (startDateParam || endDateParam) {
      logWhere.createdAt = {};
      if (startDateParam) {
        logWhere.createdAt.gte = new Date(startDateParam);
      }
      if (endDateParam) {
        const endD = new Date(endDateParam);
        endD.setHours(23, 59, 59, 999);
        logWhere.createdAt.lte = endD;
      }
    }

    if (search) {
      logWhere.OR = [
        { prompt: { contains: search } },
        { response: { contains: search } },
        { errorMessage: { contains: search } },
        { workspace: { name: { contains: search } } },
        { workspace: { slug: { contains: search } } },
        { admin: { name: { contains: search } } },
        { admin: { email: { contains: search } } },
        { registration: { name: { contains: search } } },
        { registration: { labId: { contains: search } } },
      ];
    }

    // 1. Overall Aggregations
    const [
      totalCalls,
      successCalls,
      failedCalls,
      callsToday,
      callsThisMonth,
      tokenAggregates,
      durationAggregates,
      workspacesWithUsage,
    ] = await Promise.all([
      prisma.workspaceAiUsage.count(),
      prisma.workspaceAiUsage.count({ where: { status: "SUCCESS" } }),
      prisma.workspaceAiUsage.count({ where: { status: "FAILED" } }),
      prisma.workspaceAiUsage.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.workspaceAiUsage.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.workspaceAiUsage.aggregate({
        _sum: {
          promptTokens: true,
          candidateTokens: true,
          totalTokens: true,
        },
      }),
      prisma.workspaceAiUsage.aggregate({
        where: { status: "SUCCESS", durationMs: { not: null } },
        _avg: {
          durationMs: true,
        },
      }),
      prisma.workspaceAiUsage.groupBy({
        by: ["workspaceId"],
      }),
    ]);

    const promptTokensSum = tokenAggregates._sum.promptTokens || 0;
    const candidateTokensSum = tokenAggregates._sum.candidateTokens || 0;
    const totalTokensSum = tokenAggregates._sum.totalTokens || 0;
    const avgLatencyMs = Math.round(durationAggregates._avg.durationMs || 0);
    const successRate = totalCalls > 0 ? ((successCalls / totalCalls) * 100).toFixed(1) : "0.0";

    // 2. Workspaces Leaderboard & Breakdown
    const allWorkspaces = await prisma.workspace.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        admins: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const workspaceGrouped = await prisma.workspaceAiUsage.groupBy({
      by: ["workspaceId", "status"],
      _count: { id: true },
      _sum: {
        totalTokens: true,
        promptTokens: true,
        candidateTokens: true,
      },
      _max: { createdAt: true },
    });

    const workspaceTodayGrouped = await prisma.workspaceAiUsage.groupBy({
      by: ["workspaceId"],
      where: { createdAt: { gte: startOfToday } },
      _count: { id: true },
    });

    const todayMap = {};
    workspaceTodayGrouped.forEach((item) => {
      todayMap[item.workspaceId] = item._count.id;
    });

    const workspaceStatsMap = {};
    workspaceGrouped.forEach((item) => {
      const wId = item.workspaceId;
      if (!workspaceStatsMap[wId]) {
        workspaceStatsMap[wId] = {
          totalCalls: 0,
          successCalls: 0,
          failedCalls: 0,
          totalTokens: 0,
          promptTokens: 0,
          candidateTokens: 0,
          lastUsed: null,
        };
      }

      const count = item._count.id || 0;
      workspaceStatsMap[wId].totalCalls += count;
      if (item.status === "SUCCESS") {
        workspaceStatsMap[wId].successCalls += count;
      } else {
        workspaceStatsMap[wId].failedCalls += count;
      }

      workspaceStatsMap[wId].totalTokens += item._sum.totalTokens || 0;
      workspaceStatsMap[wId].promptTokens += item._sum.promptTokens || 0;
      workspaceStatsMap[wId].candidateTokens += item._sum.candidateTokens || 0;

      if (item._max.createdAt) {
        if (!workspaceStatsMap[wId].lastUsed || new Date(item._max.createdAt) > new Date(workspaceStatsMap[wId].lastUsed)) {
          workspaceStatsMap[wId].lastUsed = item._max.createdAt;
        }
      }
    });

    const workspacesLeaderboard = allWorkspaces
      .map((ws) => {
        const stats = workspaceStatsMap[ws.id] || {
          totalCalls: 0,
          successCalls: 0,
          failedCalls: 0,
          totalTokens: 0,
          promptTokens: 0,
          candidateTokens: 0,
          lastUsed: null,
        };

        return {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          isActive: ws.isActive,
          admins: ws.admins,
          totalCalls: stats.totalCalls,
          successCalls: stats.successCalls,
          failedCalls: stats.failedCalls,
          totalTokens: stats.totalTokens,
          promptTokens: stats.promptTokens,
          candidateTokens: stats.candidateTokens,
          todayCalls: todayMap[ws.id] || 0,
          lastUsed: stats.lastUsed ? stats.lastUsed.toISOString() : null,
        };
      })
      .sort((a, b) => b.totalCalls - a.totalCalls);

    // 3. Daily Trend (e.g. Last 14/30 Days)
    const trendDays = Math.min(60, Math.max(7, daysParam));
    const trendStartDate = new Date(startOfToday.getTime() - (trendDays - 1) * 24 * 60 * 60 * 1000);

    const trendRecords = await prisma.workspaceAiUsage.findMany({
      where: {
        createdAt: { gte: trendStartDate },
      },
      select: {
        createdAt: true,
        status: true,
        totalTokens: true,
      },
    });

    const dailyTrendMap = {};
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      dailyTrendMap[key] = {
        dateKey: key,
        date: label,
        total: 0,
        success: 0,
        failed: 0,
        tokens: 0,
      };
    }

    trendRecords.forEach((rec) => {
      const key = new Date(rec.createdAt).toISOString().slice(0, 10);
      if (dailyTrendMap[key]) {
        dailyTrendMap[key].total += 1;
        if (rec.status === "SUCCESS") {
          dailyTrendMap[key].success += 1;
        } else {
          dailyTrendMap[key].failed += 1;
        }
        dailyTrendMap[key].tokens += rec.totalTokens || 0;
      }
    });

    const dailyTrend = Object.values(dailyTrendMap);

    // 4. Model Distribution
    const modelStatsRaw = await prisma.workspaceAiUsage.groupBy({
      by: ["model"],
      _count: { id: true },
      _sum: { totalTokens: true },
    });

    const modelDistribution = modelStatsRaw
      .filter((m) => m.model)
      .map((m) => ({
        model: m.model,
        count: m._count.id,
        tokens: m._sum.totalTokens || 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 5. Feature Distribution
    const featureStatsRaw = await prisma.workspaceAiUsage.groupBy({
      by: ["feature"],
      _count: { id: true },
      _sum: { totalTokens: true },
    });

    const featureDistribution = featureStatsRaw.map((f) => ({
      feature: f.feature,
      count: f._count.id,
      tokens: f._sum.totalTokens || 0,
    }));

    // 6. Paginated Detailed History Logs
    const [totalFilteredLogs, logs] = await Promise.all([
      prisma.workspaceAiUsage.count({ where: logWhere }),
      prisma.workspaceAiUsage.findMany({
        where: logWhere,
        include: {
          workspace: {
            select: { id: true, name: true, slug: true },
          },
          admin: {
            select: { id: true, name: true, email: true },
          },
          registration: {
            select: { id: true, labId: true, name: true, regNo: true, age: true, gender: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      workspaceId: log.workspaceId,
      workspaceName: log.workspace?.name || "Unknown Lab",
      workspaceSlug: log.workspace?.slug || "-",
      adminName: log.admin?.name || "System / Staff",
      adminEmail: log.admin?.email || "-",
      registration: log.registration
        ? {
            id: log.registration.id,
            labId: log.registration.labId,
            patientName: log.registration.name,
            regNo: log.registration.regNo,
            age: log.registration.age,
            gender: log.registration.gender,
          }
        : null,
      feature: log.feature,
      model: log.model || "gemini-3.5-flash-lite",
      prompt: log.prompt,
      response: log.response,
      promptTokens: log.promptTokens || 0,
      candidateTokens: log.candidateTokens || 0,
      totalTokens: log.totalTokens || 0,
      status: log.status,
      errorMessage: log.errorMessage,
      durationMs: log.durationMs,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalCalls,
          successCalls,
          failedCalls,
          successRate: parseFloat(successRate),
          callsToday,
          callsThisMonth,
          totalPromptTokens: promptTokensSum,
          totalCandidateTokens: candidateTokensSum,
          totalTokens: totalTokensSum,
          activeWorkspacesCount: workspacesWithUsage.length,
          avgLatencyMs,
        },
        workspacesLeaderboard,
        dailyTrend,
        modelDistribution,
        featureDistribution,
        logs: formattedLogs,
        pagination: {
          total: totalFilteredLogs,
          page,
          limit,
          totalPages: Math.ceil(totalFilteredLogs / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error("SuperAdmin AI Usage GET Error:", error);
    const status = error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
