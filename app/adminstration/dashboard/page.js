"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Business as WorkspaceIcon,
  People as PeopleIcon,
  CurrencyRupee as RupeeIcon,
  Refresh as RefreshIcon,
  MedicalServices as DoctorIcon,
  Science as ScienceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AccessTime as AccessTimeIcon,
  LocalFireDepartment as FireIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { toast } from "sonner";

const COLORS = ["#7c3aed", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

function CustomChartTooltip({ active, payload, label, isCurrency }) {
  if (active && payload && payload.length) {
    return (
      <Paper
        elevation={4}
        sx={{
          p: 1.5,
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 2,
          bgcolor: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5 }}>
          {label}
        </Typography>
        {payload.map((item, idx) => (
          <Typography key={idx} variant="body2" sx={{ fontWeight: 800, color: item.color || item.fill || "primary.main" }}>
            {item.name}: {isCurrency ? `₹${Number(item.value).toLocaleString("en-IN")}` : item.value}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
}

function SuperAdminDashboardContent() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState(0);

  // Weekly Active & Busy Hours State
  const [busyWeekOffset, setBusyWeekOffset] = useState(0);
  const [busyData, setBusyData] = useState(null);
  const [busyLoading, setBusyLoading] = useState(true);
  const [busyRefreshing, setBusyRefreshing] = useState(false);

  const fetchBusyHours = async (offset = busyWeekOffset, isManual = false) => {
    if (isManual) setBusyRefreshing(true);
    else setBusyLoading(true);

    try {
      const res = await fetch(`/adminstration/api/dashboard/busy-hours?weekOffset=${offset}`).then((r) => r.json());
      if (res.success) {
        setBusyData(res.data);
        if (isManual) toast.success("Busy hours analytics refreshed!");
      } else {
        console.error("Busy hours API error:", res.error);
      }
    } catch (err) {
      console.error("Failed to load busy hours analytics:", err);
    } finally {
      setBusyLoading(false);
      setBusyRefreshing(false);
    }
  };

  const fetchStats = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/adminstration/api/dashboard/stats").then((r) => r.json());

      if (!res.success && (res.error === "NEXT_REDIRECT" || res.error === "Unauthorized")) {
        router.push("/adminstration/login");
        return;
      }

      if (res.success) {
        setData(res.data);
        if (isManualRefresh) toast.success("Dashboard metrics refreshed!");
      } else {
        toast.error(res.error || "Failed to load dashboard statistics.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchBusyHours(busyWeekOffset);
  }, [busyWeekOffset]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "70vh", gap: 2 }}>
        <CircularProgress size={48} color="primary" thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Loading SuperAdmin Executive Insights…
        </Typography>
      </Box>
    );
  }

  const kpis = data?.kpis || {};
  const dailyTrend = data?.dailyTrend || [];
  const subscriptionDistribution = data?.subscriptionDistribution || [];
  const topLabsByRegistrations = data?.topLabsByRegistrations || [];
  const topLabsByRevenue = data?.topLabsByRevenue || [];
  const topDoctors = data?.topDoctors || [];
  const genderBreakdown = data?.genderBreakdown || [];
  const paymentModes = data?.paymentModes || [];
  const expiringWorkspaces = data?.expiringWorkspaces || [];

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2.5, md: 4 }, bgcolor: "background.default", overflowY: "auto" }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
              Executive Analytics Dashboard
            </Typography>
            <Chip
              label="Live Platform Metrics"
              size="small"
              sx={{ bgcolor: "rgba(124, 58, 237, 0.1)", color: "primary.main", fontWeight: 700, fontSize: "0.75rem" }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Cross-laboratory analytics, revenue aggregates, patient registration volumes, and subscription statuses.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Tooltip title="Refresh live statistics">
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              startIcon={<RefreshIcon sx={{ animation: refreshing ? "spin 1s linear infinite" : "none", "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} />}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              {refreshing ? "Refreshing…" : "Live Refresh"}
            </Button>
          </Tooltip>

          <Button
            variant="contained"
            onClick={() => router.push("/adminstration/workspace")}
            endIcon={<ArrowForwardIcon />}
            sx={{ fontWeight: 700, borderRadius: 2, px: 2.5 }}
          >
            Manage Workspaces
          </Button>
        </Box>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Card 1: Total Laboratories */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 0.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Total Laboratories
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mt: 0.5 }}>
                    {kpis.totalWorkspaces || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "rgba(124, 58, 237, 0.12)", color: "primary.main", width: 44, height: 44 }}>
                  <WorkspaceIcon />
                </Avatar>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                <Chip size="small" label={`${kpis.activeWorkspaces || 0} Active`} sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: "0.7rem", height: 22 }} />
                {kpis.expiredWorkspaces > 0 && (
                  <Chip size="small" label={`${kpis.expiredWorkspaces} Expired`} sx={{ bgcolor: "#fee2e2", color: "#dc2626", fontWeight: 700, fontSize: "0.7rem", height: 22 }} />
                )}
                {kpis.expiringSoonWorkspaces > 0 && (
                  <Chip size="small" label={`${kpis.expiringSoonWorkspaces} Expiring Soon`} sx={{ bgcolor: "#fef3c7", color: "#d97706", fontWeight: 700, fontSize: "0.7rem", height: 22 }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 2: Total Registrations */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 0.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Total Registrations
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#2563eb", mt: 0.5 }}>
                    {(kpis.totalRegistrations || 0).toLocaleString("en-IN")}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "rgba(37, 99, 235, 0.12)", color: "#2563eb", width: 44, height: 44 }}>
                  <PeopleIcon />
                </Avatar>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Today: <strong style={{ color: "#2563eb" }}>+{(kpis.regToday || 0).toLocaleString("en-IN")}</strong>
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  This Month: <strong>+{(kpis.regThisMonth || 0).toLocaleString("en-IN")}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 3: Total Platform Revenue */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 0.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Total Revenue Collected
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#16a34a", mt: 0.5 }}>
                    ₹{(kpis.totalRevenue || 0).toLocaleString("en-IN")}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "rgba(22, 163, 74, 0.12)", color: "#16a34a", width: 44, height: 44 }}>
                  <RupeeIcon />
                </Avatar>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Today: <strong style={{ color: "#16a34a" }}>₹{(kpis.revenueToday || 0).toLocaleString("en-IN")}</strong>
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Outstanding Due: <strong style={{ color: "#dc2626" }}>₹{(kpis.totalDue || 0).toLocaleString("en-IN")}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 4: Doctor & Tests Network */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 0.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Doctors & Lab Staff
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#d97706", mt: 0.5 }}>
                    {kpis.totalDoctors || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "rgba(217, 119, 6, 0.12)", color: "#d97706", width: 44, height: 44 }}>
                  <DoctorIcon />
                </Avatar>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Lab Admins: <strong>{kpis.totalAdmins || 0}</strong>
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Global Tests: <strong>{kpis.totalTests || 0}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Weekly Active Hours & Busy Peak Analyzer (Sun to Sat) */}
      <Card variant="outlined" sx={{ borderRadius: 3, p: 1, mb: 4, bgcolor: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          {/* Header Row with Week Switcher Navigation */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              mb: 2.5,
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar sx={{ bgcolor: "rgba(124, 58, 237, 0.12)", color: "#7c3aed", width: 38, height: 38 }}>
                  <AccessTimeIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.2 }}>
                    Weekly Active Hours & Busy Peak Analyzer
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.2 }}>
                    Peak operational hours & concurrent active users (Sun to Sat via AdminTracking)
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Week Switcher Controls */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                width: { xs: "100%", md: "auto" },
                justifyContent: { xs: "space-between", md: "flex-end" },
              }}
            >
              {busyWeekOffset !== 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setBusyWeekOffset(0)}
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    textTransform: "none",
                    borderRadius: 2,
                    py: 0.4,
                    px: 1.2,
                  }}
                >
                  Current Week
                </Button>
              )}

              <Box sx={{ display: "flex", alignItems: "center", bgcolor: "#f8fafc", p: 0.4, borderRadius: 2, border: "1px solid #e2e8f0" }}>
                <Tooltip title="Previous Week">
                  <IconButton size="small" onClick={() => setBusyWeekOffset((prev) => prev - 1)}>
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Typography variant="body2" sx={{ fontWeight: 700, px: 1.5, fontSize: "0.82rem", color: "#0f172a", whiteSpace: "nowrap" }}>
                  {busyData?.dateRange || "Loading Week..."}
                </Typography>

                <Tooltip title="Next Week">
                  <span>
                    <IconButton
                      size="small"
                      disabled={busyWeekOffset >= 0}
                      onClick={() => setBusyWeekOffset((prev) => prev + 1)}
                    >
                      <ChevronRightIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              <Tooltip title="Refresh Active Hours">
                <IconButton size="small" onClick={() => fetchBusyHours(busyWeekOffset, true)}>
                  {busyRefreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Week Top Highlights Bar */}
          {busyData && (
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                px: 2,
                mb: 2.5,
                bgcolor: "#faf5ff",
                border: "1px solid #e9d5ff",
                borderRadius: 2.5,
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <FireIcon sx={{ color: "#d97706", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "#581c87", fontWeight: 700, fontSize: "0.85rem" }}>
                  Week's Busiest Peak:{" "}
                  <strong style={{ color: "#7c3aed" }}>
                    {busyData.overallPeakDay !== "N/A" ? `${busyData.overallPeakDay}, ${busyData.overallPeakHour}` : "No Activity"}
                  </strong>
                </Typography>
                {busyData.overallPeakUsers > 0 && (
                  <Chip
                    label={`${busyData.overallPeakUsers} Active Admins`}
                    size="small"
                    sx={{ bgcolor: "#7c3aed", color: "#ffffff", fontWeight: 800, fontSize: "0.72rem", height: 20 }}
                  />
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Typography variant="caption" sx={{ color: "#6b21a8", fontWeight: 600 }}>
                  👥 <strong>{busyData.totalActiveUsersInWeek || 0}</strong> Active Admins
                </Typography>
                <Typography variant="caption" sx={{ color: "#6b21a8", fontWeight: 600 }}>
                  ⏱️ <strong>{busyData.totalActiveHoursInWeek || 0} hrs</strong> Total Usage
                </Typography>
              </Box>
            </Paper>
          )}

          {/* 7-Day Sun to Sat Columns Row */}
          {busyLoading ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center", alignItems: "center", gap: 1.5 }}>
              <CircularProgress size={24} color="primary" />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Analyzing tracking data for {busyData?.dateRange || "the week"}…
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={1.5}>
              {busyData?.days?.map((day) => {
                const isBusiestDayOfWeek = busyData.overallPeakDay === day.dayName && day.hasActivity;

                return (
                  <Grid key={day.dayIndex} size={{ xs: 12, sm: 6, md: 4, lg: 1.71 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.8,
                        height: "100%",
                        borderRadius: 2.5,
                        bgcolor: day.isToday
                          ? "rgba(124, 58, 237, 0.04)"
                          : isBusiestDayOfWeek
                          ? "#fdf4ff"
                          : "#ffffff",
                        borderColor: day.isToday
                          ? "#7c3aed"
                          : isBusiestDayOfWeek
                          ? "#d8b4fe"
                          : "#e2e8f0",
                        borderWidth: day.isToday ? 2 : 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                        transition: "all 0.2s",
                        "&:hover": {
                          boxShadow: "0 6px 14px -4px rgba(0,0,0,0.08)",
                          borderColor: "#7c3aed",
                        },
                      }}
                    >
                      {/* Day Header */}
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.6 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: day.isToday ? "#7c3aed" : "text.primary" }}>
                              {day.dayShort}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                              {day.displayDate}
                            </Typography>
                          </Box>

                          {day.isToday && (
                            <Chip
                              label="TODAY"
                              size="small"
                              sx={{
                                bgcolor: "#7c3aed",
                                color: "#ffffff",
                                fontWeight: 800,
                                fontSize: "0.62rem",
                                height: 18,
                              }}
                            />
                          )}
                        </Box>

                        <Divider sx={{ mb: 1.5, borderColor: day.isToday ? "rgba(124, 58, 237, 0.2)" : "#f1f5f9" }} />

                        {/* Peak Hour Highlight */}
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", mb: 0.3 }}>
                            🔥 Busiest Hour
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 800,
                              fontSize: day.hasActivity ? "0.85rem" : "0.8rem",
                              color: day.hasActivity ? (day.isToday ? "#7c3aed" : "#0f172a") : "#94a3b8",
                              lineHeight: 1.3,
                            }}
                          >
                            {day.peakHour}
                          </Typography>

                          {day.hasActivity ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 0.8, flexWrap: "wrap" }}>
                              <Chip
                                icon={<GroupIcon sx={{ fontSize: "12px !important" }} />}
                                label={`${day.peakUsers} Active User${day.peakUsers === 1 ? "" : "s"}`}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.68rem",
                                  fontWeight: 800,
                                  bgcolor: isBusiestDayOfWeek ? "#fae8ff" : "#ecfdf5",
                                  color: isBusiestDayOfWeek ? "#86198f" : "#15803d",
                                }}
                              />
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.5, fontStyle: "italic" }}>
                              {day.isFuture ? "Upcoming day" : "No active sessions"}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Day Totals & 24h Mini Activity Bar */}
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", fontWeight: 600 }}>
                            Total Day Active:
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: day.hasActivity ? "#0f172a" : "text.disabled", fontSize: "0.72rem" }}>
                            {day.totalActiveHours > 0 ? `${day.totalActiveHours} hrs` : "0h"}
                          </Typography>
                        </Box>

                        {/* 24-Hour Sparkline Heatmap Timeline (00h - 23h) */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: "2px",
                            height: 28,
                            bgcolor: "#f8fafc",
                            p: "3px 4px",
                            borderRadius: 1.5,
                            border: "1px solid #f1f5f9",
                          }}
                        >
                          {day.hourly?.map((h) => {
                            const isPeakHour = day.hasActivity && h.hour === day.peakHourIndex;
                            const maxVal = day.peakUsers || 1;
                            const heightPct = h.activeUsers > 0 ? Math.max(25, Math.round((h.activeUsers / maxVal) * 100)) : 10;

                            return (
                              <Tooltip
                                key={h.hour}
                                title={
                                  <Box sx={{ p: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, display: "block" }}>
                                      {h.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: "block" }}>
                                      Active Users: <strong>{h.activeUsers}</strong> ({h.activeMinutes} mins)
                                    </Typography>
                                  </Box>
                                }
                                arrow
                                placement="top"
                              >
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: `${heightPct}%`,
                                    bgcolor: isPeakHour
                                      ? "#7c3aed"
                                      : h.activeUsers > 0
                                      ? "#a78bfa"
                                      : "#e2e8f0",
                                    borderRadius: "1px",
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                    "&:hover": {
                                      bgcolor: "#6d28d9",
                                      transform: "scaleY(1.2)",
                                    },
                                  }}
                                />
                              </Tooltip>
                            );
                          })}
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.3, px: 0.2 }}>
                          <Typography variant="caption" sx={{ fontSize: "0.58rem", color: "#94a3b8" }}>
                            12 AM
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: "0.58rem", color: "#94a3b8" }}>
                            12 PM
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: "0.58rem", color: "#94a3b8" }}>
                            11 PM
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Visual Analytics Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Daily Patient Registrations Trend Area Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 1, height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                    14-Day Platform Registration Activity
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total daily patient registrations across all active laboratory workspaces.
                  </Typography>
                </Box>
                <Chip icon={<CalendarIcon sx={{ fontSize: "16px !important" }} />} label="Last 14 Days" size="small" variant="outlined" />
              </Box>

              <Box sx={{ width: "100%", height: 290 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomChartTooltip />} />
                    <Area type="monotone" dataKey="registrations" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#regGradient)" name="Registrations" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Subscription Health Pie Chart */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 1, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                Workspace Plan Distribution
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Active vs Expiring vs Expired workspace licenses.
              </Typography>

              {subscriptionDistribution.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>No workspace subscription data</Box>
              ) : (
                <Box sx={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subscriptionDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {subscriptionDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Modes Breakdown */}
        <Grid size={{ xs: 12, sm: 6, lg: 6 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 1 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                Payment Method Breakdown
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Total collections aggregated by payment mode (Cash, UPI, Card, Online).
              </Typography>

              <Box sx={{ width: "100%", height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentModes} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mode" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomChartTooltip isCurrency />} />
                    <Bar dataKey="amount" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Collected Amount (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Patient Gender Demographics */}
        <Grid size={{ xs: 12, sm: 6, lg: 6 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 1 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                Patient Gender Demographics
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Gender breakdown across all registered patients.
              </Typography>

              <Box sx={{ width: "100%", height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {genderBreakdown.map((entry, index) => (
                        <Cell key={`gender-cell-${index}`} fill={["#3b82f6", "#ec4899", "#8b5cf6"][index % 3]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Leaderboards & Detailed Tables */}
      <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3, pt: 2, bgcolor: "background.paper" }}>
          <Tabs value={leaderboardTab} onChange={(e, v) => setLeaderboardTab(v)}>
            <Tab label="🏆 Top Labs by Patients" sx={{ fontWeight: 700 }} />
            <Tab label="💰 Top Labs by Revenue" sx={{ fontWeight: 700 }} />
            <Tab label="🩺 Top Referring Doctors" sx={{ fontWeight: 700 }} />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span>⚠️ Urgent Renewals</span>
                  {expiringWorkspaces.length > 0 && (
                    <Chip label={expiringWorkspaces.length} size="small" sx={{ bgcolor: "#fee2e2", color: "#dc2626", fontWeight: 800, height: 18, fontSize: "0.68rem" }} />
                  )}
                </Box>
              }
              sx={{ fontWeight: 700 }}
            />
          </Tabs>
        </Box>

        {/* Tab 0: Top Labs by Registrations */}
        {leaderboardTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "background.paper" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">Rank</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Laboratory Workspace</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Slug</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Plan Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Today's Patients</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">This Month</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">All-Time Patients</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Total Collected (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topLabsByRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: "text.secondary" }}>
                      No registration data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  topLabsByRegistrations.map((lab, idx) => (
                    <TableRow key={lab.id} hover>
                      <TableCell align="center">
                        <Chip
                          label={`#${idx + 1}`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: idx === 0 ? "#fef08a" : idx === 1 ? "#f1f5f9" : idx === 2 ? "#fed7aa" : "transparent",
                            color: idx === 0 ? "#854d0e" : idx === 1 ? "#334155" : idx === 2 ? "#9a3412" : "text.secondary",
                            height: 22,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>{lab.name}</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>/{lab.slug}</TableCell>
                      <TableCell align="center">
                        {lab.expireAt ? (
                          new Date(lab.expireAt) < new Date() ? (
                            <Chip size="small" label="Expired" sx={{ bgcolor: "#fee2e2", color: "#dc2626", fontWeight: 700, height: 20, fontSize: "0.68rem" }} />
                          ) : (
                            <Chip size="small" label="Active" sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 700, height: 20, fontSize: "0.68rem" }} />
                          )
                        ) : (
                          <Chip size="small" label="No Expiry" sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 600, height: 20, fontSize: "0.68rem" }} />
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#2563eb" }}>+{lab.todayPatients}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>+{lab.monthPatients}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.95rem" }}>{lab.totalPatients.toLocaleString("en-IN")}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: "#16a34a" }}>₹{lab.totalCollected.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tab 1: Top Labs by Revenue */}
        {leaderboardTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "background.paper" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">Rank</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Laboratory Workspace</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Total Billed</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Total Collected</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Outstanding Balance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Collection Ratio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topLabsByRevenue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: "text.secondary" }}>
                      No billing records available.
                    </TableCell>
                  </TableRow>
                ) : (
                  topLabsByRevenue.map((lab, idx) => {
                    const ratio = lab.totalBilled > 0 ? Math.round((lab.totalCollected / lab.totalBilled) * 100) : 0;
                    return (
                      <TableRow key={lab.id} hover>
                        <TableCell align="center">
                          <Chip label={`#${idx + 1}`} size="small" sx={{ fontWeight: 800, height: 22 }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{lab.name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{lab.totalBilled.toLocaleString("en-IN")}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#16a34a" }}>₹{lab.totalCollected.toLocaleString("en-IN")}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: lab.totalDue > 0 ? "#dc2626" : "text.secondary" }}>
                          ₹{lab.totalDue.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "center" }}>
                            <Box sx={{ width: 80 }}>
                              <LinearProgress variant="determinate" value={Math.min(100, ratio)} sx={{ height: 6, borderRadius: 3 }} />
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{ratio}%</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tab 2: Top Referring Doctors */}
        {leaderboardTab === 2 && (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "background.paper" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">Rank</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Doctor Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Clinic / Hospital</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Associated Lab</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Total Referrals</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topDoctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: "text.secondary" }}>
                      No doctor referral data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  topDoctors.map((doc, idx) => (
                    <TableRow key={doc.id} hover>
                      <TableCell align="center">
                        <Chip label={`#${idx + 1}`} size="small" sx={{ fontWeight: 800, height: 22 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{doc.name}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{doc.clinic}</TableCell>
                      <TableCell sx={{ color: "primary.main", fontWeight: 600 }}>{doc.labName}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: "#2563eb" }}>
                        {doc.referralsCount} Patients
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tab 3: Urgent Plan Expiry */}
        {leaderboardTab === 3 && (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "background.paper" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Laboratory Workspace</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Slug</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Expiry Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Quick Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expiringWorkspaces.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: "#16a34a", fontWeight: 700 }}>
                      🎉 All laboratory workspace plans are active and healthy!
                    </TableCell>
                  </TableRow>
                ) : (
                  expiringWorkspaces.map((ws) => (
                    <TableRow key={ws.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{ws.name}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>/{ws.slug}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {ws.expireAt ? new Date(ws.expireAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </TableCell>
                      <TableCell align="center">
                        {ws.status === "expired" ? (
                          <Chip size="small" label="Expired" sx={{ bgcolor: "#fee2e2", color: "#dc2626", fontWeight: 700, height: 22 }} />
                        ) : ws.status === "urgent" ? (
                          <Chip size="small" label="Expiring in < 7 Days" sx={{ bgcolor: "#fed7aa", color: "#ea580c", fontWeight: 700, height: 22 }} />
                        ) : (
                          <Chip size="small" label="Expiring in < 30 Days" sx={{ bgcolor: "#fef3c7", color: "#d97706", fontWeight: 700, height: 22 }} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => router.push("/adminstration/workspace")}
                          sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: "0.75rem", py: 0.4 }}
                        >
                          Renew in Workspace
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}

export default function SuperAdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
          <CircularProgress color="primary" />
        </Box>
      }
    >
      <SuperAdminDashboardContent />
    </Suspense>
  );
}
