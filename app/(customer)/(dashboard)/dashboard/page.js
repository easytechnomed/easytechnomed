import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DashboardRangeSelector from "./RangeSelector";
import { RegistrationChart, DepartmentDistributionChart } from "./DashboardCharts";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Paper,
  Chip
} from "@mui/material";
import {
  AppRegistration as RegisterIcon,
  CheckCircle as CheckedIcon,
  PendingActions as PendingIcon,
  AccountBalanceWallet as WalletIcon,
  TableChart as TableChartIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Assignment as ReportIcon
} from "@mui/icons-material";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({ searchParams }) {
  const admin = await requireAdmin();

  const roleNameUpper = admin.role?.name?.toUpperCase() || "";
  const isSuperRole = roleNameUpper === "ADMIN" || roleNameUpper === "OWNER";
  const hasAllPermission = admin.role?.permissions?.some(p => p.permission?.toUpperCase() === "ALL") || false;
  const userPerms = admin.role?.permissions?.map(p => p.permission) || [];

  const hasDashboardView = isSuperRole || hasAllPermission || userPerms.includes("DASHBOARD_VIEW");

  if (!hasDashboardView) {
    if (userPerms.includes("REGISTRATION_READ") || userPerms.includes("REGISTRATION_WRITE")) {
      redirect("/registration");
    } else if (userPerms.includes("DOCTOR_READ") || userPerms.includes("DOCTOR_WRITE")) {
      redirect("/doctor-summary");
    } else if (userPerms.includes("MEMBER_READ") || userPerms.includes("MEMBER_WRITE")) {
      redirect("/members");
    } else if (
      userPerms.includes("SETTINGS_READ") || userPerms.includes("SETTINGS_WRITE") ||
      userPerms.includes("TEST_READ") || userPerms.includes("TEST_WRITE")
    ) {
      redirect("/settings");
    } else {
      redirect("/auth/login?error=unauthorized");
    }
  }

  const params = await searchParams;
  const range = params?.range || "7days";

  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (range === "30days") {
    startDate.setDate(now.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === "thismonth") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === "prevmonth") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (range === "3months") {
    startDate.setDate(now.getDate() - 90);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === "6months") {
    startDate.setDate(now.getDate() - 180);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === "year") {
    startDate.setDate(now.getDate() - 365);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Default: 7days
    startDate.setDate(now.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  const dateFilter = {
    gte: startDate,
    lte: endDate,
  };

  // 1. Core Counts
  const totalRegistrations = await prisma.registration.count({ where: { workspaceId: admin.workspaceId, isDeleted: false, date: dateFilter } });
  const pendingRegistrations = await prisma.registration.count({ where: { status: "Pending", workspaceId: admin.workspaceId, isDeleted: false, date: dateFilter } });
  const completedRegistrations = await prisma.registration.count({ where: { status: "Completed", workspaceId: admin.workspaceId, isDeleted: false, date: dateFilter } });

  // 2. Department Breakdown
  const regTests = await prisma.registrationTest.findMany({
    where: {
      registration: {
        workspaceId: admin.workspaceId,
        isDeleted: false,
        date: dateFilter,
      },
    },
    include: {
      test: {
        include: {
          department: true,
        },
      },
    },
  });
  const deptAggregation = {};
  regTests.forEach((rt) => {
    const deptName = rt.test?.department?.name || "General";
    deptAggregation[deptName] = (deptAggregation[deptName] || 0) + 1;
  });
  const departmentData = Object.entries(deptAggregation).map(([name, value]) => ({
    name,
    value,
  }));

  // 3. Registrations in date range
  const registrationsInPeriod = await prisma.registration.findMany({
    where: {
      workspaceId: admin.workspaceId,
      isDeleted: false,
      date: dateFilter,
    },
    select: {
      id: true,
      date: true,
      totalAmount: true,
      collectionCharge: true,
      discountAmount: true,
      receivedAmount: true,
      status: true,
      payments: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // 4. Payments received
  const paymentsInPeriod = await prisma.registrationPayment.findMany({
    where: {
      registration: {
        workspaceId: admin.workspaceId,
        isDeleted: false,
      },
      createdAt: dateFilter,
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const isMonthly = ["3months", "6months", "year"].includes(range);
  const aggregatedData = {};

  if (isMonthly) {
    const tempDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endLimit = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    while (tempDate <= endLimit) {
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, "0");
      const key = `${year}-${month}`;
      aggregatedData[key] = { registered: 0, completed: 0, revenue: 0, received: 0 };
      tempDate.setMonth(tempDate.getMonth() + 1);
    }
  } else {
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, "0");
      const day = String(tempDate.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;
      aggregatedData[key] = { registered: 0, completed: 0, revenue: 0, received: 0 };
      tempDate.setDate(tempDate.getDate() + 1);
    }
  }

  registrationsInPeriod.forEach((reg) => {
    let key;
    if (isMonthly) {
      const year = reg.date.getFullYear();
      const month = String(reg.date.getMonth() + 1).padStart(2, "0");
      key = `${year}-${month}`;
    } else {
      const year = reg.date.getFullYear();
      const month = String(reg.date.getMonth() + 1).padStart(2, "0");
      const day = String(reg.date.getDate()).padStart(2, "0");
      key = `${year}-${month}-${day}`;
    }

    if (!aggregatedData[key]) {
      aggregatedData[key] = { registered: 0, completed: 0, revenue: 0, received: 0 };
    }
    aggregatedData[key].registered += 1;
    if (reg.status === "Completed") {
      aggregatedData[key].completed += 1;
    }
    const regRevenue = (Number(reg.totalAmount) || 0) + (Number(reg.collectionCharge) || 0) - (Number(reg.discountAmount) || 0);
    aggregatedData[key].revenue += regRevenue;

    if ((!reg.payments || reg.payments.length === 0) && Number(reg.receivedAmount || 0) > 0) {
      aggregatedData[key].received += Number(reg.receivedAmount || 0);
    }
  });

  paymentsInPeriod.forEach((payment) => {
    let pKey;
    if (isMonthly) {
      const year = payment.createdAt.getFullYear();
      const month = String(payment.createdAt.getMonth() + 1).padStart(2, "0");
      pKey = `${year}-${month}`;
    } else {
      const year = payment.createdAt.getFullYear();
      const month = String(payment.createdAt.getMonth() + 1).padStart(2, "0");
      const day = String(payment.createdAt.getDate()).padStart(2, "0");
      pKey = `${year}-${month}-${day}`;
    }

    if (!aggregatedData[pKey]) {
      aggregatedData[pKey] = { registered: 0, completed: 0, revenue: 0, received: 0 };
    }
    aggregatedData[pKey].received += Number(payment.amount || 0);
  });

  const chartData = Object.entries(aggregatedData).map(([key, val]) => {
    let label = "";
    if (isMonthly) {
      const [year, month] = key.split("-");
      const dateObj = new Date(Number(year), Number(month) - 1, 1);
      label = dateObj.toLocaleDateString("en-US", { month: "short" });
    } else {
      const [year, month, day] = key.split("-");
      const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return {
      date: key,
      label,
      count: val.registered,
      revenue: val.revenue,
    };
  });

  const summaryTableRows = Object.entries(aggregatedData)
    .map(([key, val]) => {
      let formattedDate = "";
      if (isMonthly) {
        const [year, month] = key.split("-");
        const dateObj = new Date(Number(year), Number(month) - 1, 1);
        formattedDate = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      } else {
        const [year, month, day] = key.split("-");
        const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
        formattedDate = dateObj.toLocaleDateString("en-US", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        });
      }
      return {
        key,
        dateLabel: formattedDate,
        registered: val.registered,
        completed: val.completed,
        revenue: val.revenue,
        received: val.received,
      };
    })
    .sort((a, b) => b.key.localeCompare(a.key));

  const totalBilling = summaryTableRows.reduce((sum, r) => sum + r.revenue, 0);
  const totalCollected = summaryTableRows.reduce((sum, r) => sum + r.received, 0);
  const totalTableRegistered = summaryTableRows.reduce((sum, r) => sum + r.registered, 0);
  const totalTableCompleted = summaryTableRows.reduce((sum, r) => sum + r.completed, 0);
  const dueBalance = totalBilling - totalCollected;

  const formatPeriodDate = (d) => {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  const periodDateRangeStr = `${formatPeriodDate(startDate)} – ${formatPeriodDate(endDate)}`;

  return (
    <Box sx={{ flexGrow: 1, minWidth: 0, pb: 4, pt: 1 }}>

      {/* 1. Header Bar: Minimal, Direct, Impactful */}
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: "12px",
          p: { xs: 2, sm: 2.5 },
          mb: 2.5,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.25rem", sm: "1.45rem" },
              color: "#0F172A",
              letterSpacing: "-0.01em",
            }}
          >
            Welcome, <Box component="span" sx={{ color: "#10b6a5" }}>{admin.name}</Box>
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, display: "block", mt: 0.25 }}>
            {admin.workspaceName || "Diagnostic Laboratory"} • Period: <Box component="span" sx={{ fontWeight: 700, color: "#1E293B" }}>{periodDateRangeStr}</Box>
          </Typography>
        </Box>

        {/* Action + Time Filter (50% each side-by-side on mobile) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Box sx={{ flex: { xs: "1 1 50%", sm: "none" }, width: { xs: "50%", sm: "auto" } }}>
            <DashboardRangeSelector initialRange={range} />
          </Box>

          <Link href="/registration" style={{ textDecoration: "none", flex: "1 1 50%", width: "100%" }}>
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              sx={{
                bgcolor: "#0f766e",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "0.8rem",
                py: 0.8,
                px: 2,
                borderRadius: "8px",
                boxShadow: "none !important",
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: "#115e59" },
              }}
            >
              Patient
            </Button>
          </Link>
        </Box>
      </Box>

      {/* 2. 4 Core Numbers (Instant Understanding - Clickable to /test-report) */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 2.5 }}>

        {/* Total Patients */}
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Link href={`/test-report?range=${range}`} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                bgcolor: "#FFFFFF",
                border: "1.5px solid #E2E8F0",
                borderRadius: "12px",
                p: { xs: 1.5, sm: 2 },
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: "#0f766e",
                  transform: "translateY(-3px)",
                  boxShadow: "0 8px 24px rgba(15, 118, 110, 0.12)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem" }}>
                  Total Patients
                </Typography>
                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "rgba(15, 118, 110, 0.12)", color: "#0f766e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RegisterIcon sx={{ fontSize: 18 }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A", fontSize: { xs: "1.5rem", sm: "1.85rem" }, lineHeight: 1 }}>
                {totalRegistrations}
              </Typography>
              <Typography variant="caption" sx={{ color: "#0f766e", fontWeight: 700, mt: 0.75, display: "block", fontSize: "0.72rem" }}>
                Registered in period →
              </Typography>
            </Card>
          </Link>
        </Grid>

        {/* Pending Tests */}
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Link href={`/test-report?range=${range}&status=Pending`} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                bgcolor: "#FFFFFF",
                border: "1.5px solid #E2E8F0",
                borderRadius: "12px",
                p: { xs: 1.5, sm: 2 },
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: "#D97706",
                  transform: "translateY(-3px)",
                  boxShadow: "0 8px 24px rgba(217, 119, 6, 0.12)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem" }}>
                  Pending Tests
                </Typography>
                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "rgba(245, 158, 11, 0.12)", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PendingIcon sx={{ fontSize: 18 }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: pendingRegistrations > 0 ? "#D97706" : "#0F172A", fontSize: { xs: "1.5rem", sm: "1.85rem" }, lineHeight: 1 }}>
                {pendingRegistrations}
              </Typography>
              <Typography variant="caption" sx={{ color: pendingRegistrations > 0 ? "#D97706" : "#10B981", fontWeight: 700, mt: 0.75, display: "block", fontSize: "0.72rem" }}>
                {pendingRegistrations > 0 ? "⚠️ Awaiting Results →" : "✓ Worklist Clear"}
              </Typography>
            </Card>
          </Link>
        </Grid>

        {/* Completed Tests */}
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Link href={`/test-report?range=${range}&status=Completed`} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                bgcolor: "#FFFFFF",
                border: "1.5px solid #E2E8F0",
                borderRadius: "12px",
                p: { xs: 1.5, sm: 2 },
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: "#10B981",
                  transform: "translateY(-3px)",
                  boxShadow: "0 8px 24px rgba(16, 185, 129, 0.12)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem" }}>
                  Completed Tests
                </Typography>
                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "rgba(16, 185, 129, 0.12)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckedIcon sx={{ fontSize: 18 }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A", fontSize: { xs: "1.5rem", sm: "1.85rem" }, lineHeight: 1 }}>
                {completedRegistrations}
              </Typography>
              <Typography variant="caption" sx={{ color: "#10B981", fontWeight: 700, mt: 0.75, display: "block", fontSize: "0.72rem" }}>
                ✓ Reports Ready →
              </Typography>
            </Card>
          </Link>
        </Grid>

        {/* Collections */}
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Link href={`/test-report?range=${range}`} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                bgcolor: "#FFFFFF",
                border: "1.5px solid #E2E8F0",
                borderRadius: "12px",
                p: { xs: 1.5, sm: 2 },
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: "#2563EB",
                  transform: "translateY(-3px)",
                  boxShadow: "0 8px 24px rgba(37, 99, 235, 0.12)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem" }}>
                  Collections
                </Typography>
                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "rgba(59, 130, 246, 0.12)", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <WalletIcon sx={{ fontSize: 18 }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A", fontSize: { xs: "1.35rem", sm: "1.7rem" }, lineHeight: 1 }}>
                ₹{totalCollected.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </Typography>
              <Typography variant="caption" sx={{ color: dueBalance > 0 ? "#DC2626" : "#10B981", fontWeight: 700, mt: 0.75, display: "block", fontSize: "0.72rem" }}>
                {dueBalance > 0 ? `₹${dueBalance.toLocaleString("en-IN")} due balance →` : "All dues cleared →"}
              </Typography>
            </Card>
          </Link>
        </Grid>
      </Grid>

      {/* 3. Visual Overview: Patient Trend & Department Split */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 2.5 }}>

        {/* Patient Volume Trend */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card elevation={0} sx={{ height: "100%", bgcolor: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: "12px", p: { xs: 2, sm: 2.5 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.95rem" }}>
                Patient Volume Trend
              </Typography>
              <Chip
                label={`${totalRegistrations} Patients`}
                size="small"
                sx={{ fontWeight: 800, bgcolor: "rgba(15, 118, 110, 0.12)", color: "#0f766e", borderRadius: "6px", fontSize: "0.72rem" }}
              />
            </Box>
            <RegistrationChart data={chartData} />
          </Card>
        </Grid>

        {/* Department Breakdown */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card elevation={0} sx={{ height: "100%", bgcolor: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: "12px", p: { xs: 2, sm: 2.5 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.95rem" }}>
              Test Department Split
            </Typography>
            <DepartmentDistributionChart data={departmentData} />
          </Card>
        </Grid>
      </Grid>

      {/* 4. Simple Operational Activity Log */}
      <Card elevation={0} sx={{ bgcolor: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: "12px", p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TableChartIcon sx={{ color: "#0f766e", fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.95rem" }}>
              Recent Activity Breakdown
            </Typography>
          </Box>
          <Link href="/registration" style={{ textDecoration: "none" }}>
            <Typography variant="caption" sx={{ color: "#0f766e", fontWeight: 800, display: "flex", alignItems: "center", gap: 0.5 }}>
              View All Patients <ArrowForwardIcon sx={{ fontSize: 13 }} />
            </Typography>
          </Link>
        </Box>

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            maxHeight: 380,
            overflowX: "auto",
          }}
        >
          <Table stickyHeader size="small" sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, bgcolor: "#F8FAFC", color: "#475569", py: 1.2, fontSize: "0.78rem" }}>
                  Date
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, bgcolor: "#F8FAFC", color: "#475569", py: 1.2, fontSize: "0.78rem" }}>
                  Registered
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, bgcolor: "#F8FAFC", color: "#475569", py: 1.2, fontSize: "0.78rem" }}>
                  Completed
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, bgcolor: "#F8FAFC", color: "#475569", py: 1.2, fontSize: "0.78rem" }}>
                  Invoiced (₹)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, bgcolor: "#F8FAFC", color: "#475569", py: 1.2, fontSize: "0.78rem" }}>
                  Collected (₹)
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {summaryTableRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#64748B" }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>No registrations found for this period.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                summaryTableRows.slice(0, 10).map((row) => (
                  <TableRow
                    key={row.key}
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      "&:hover": { bgcolor: "#F8FAFC" }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: "#0F172A", py: 1.1, fontSize: "0.8rem" }}>
                      {row.dateLabel}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.1 }}>
                      <Box
                        sx={{
                          display: "inline-block",
                          minWidth: 28,
                          px: 0.75,
                          py: 0.2,
                          borderRadius: "4px",
                          fontWeight: 800,
                          fontSize: "0.75rem",
                          bgcolor: row.registered > 0 ? "rgba(16, 182, 165, 0.15)" : "#F1F5F9",
                          color: row.registered > 0 ? "#10b6a5" : "#64748B",
                        }}
                      >
                        {row.registered}
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.1 }}>
                      <Box
                        sx={{
                          display: "inline-block",
                          minWidth: 28,
                          px: 0.75,
                          py: 0.2,
                          borderRadius: "4px",
                          fontWeight: 800,
                          fontSize: "0.75rem",
                          bgcolor: row.completed > 0 ? "rgba(16, 185, 129, 0.15)" : "#F1F5F9",
                          color: row.completed > 0 ? "#059669" : "#64748B",
                        }}
                      >
                        {row.completed}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#0F172A", py: 1.1, fontSize: "0.8rem" }}>
                      ₹{row.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "#059669", py: 1.1, fontSize: "0.8rem" }}>
                      ₹{row.received.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>

            <TableFooter>
              <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                <TableCell sx={{ fontWeight: 800, color: "#0F172A", py: 1.2, fontSize: "0.8rem" }}>
                  Total
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: "#10b6a5", py: 1.2, fontSize: "0.82rem" }}>
                  {totalTableRegistered}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: "#059669", py: 1.2, fontSize: "0.82rem" }}>
                  {totalTableCompleted}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#0F172A", py: 1.2, fontSize: "0.82rem" }}>
                  ₹{totalBilling.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#059669", py: 1.2, fontSize: "0.82rem" }}>
                  ₹{totalCollected.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Card>

    </Box>
  );
}
