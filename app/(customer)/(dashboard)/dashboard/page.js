import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DashboardRangeSelector from "./RangeSelector";
import { RegistrationChart, RevenueChart, DepartmentDistributionChart, ReferralChart } from "./DashboardCharts";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Paper,
  Avatar,
  Badge,
  Chip
} from "@mui/material";
import {
  People as PeopleIcon,
  AppRegistration as RegisterIcon,
  Assignment as ReportIcon,
  SupervisorAccount as DoctorIcon,
  CheckCircle as CheckedIcon,
  PendingActions as PendingIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as TimeIcon,
  TableChart as TableChartIcon,
  CalendarMonth as CalendarIcon
} from "@mui/icons-material";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({ searchParams }) {
  // Ensure user is admin
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

  // Calculate dynamic date filters
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  // Set times to cover full days
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

  // Fetch counts from DB within selected range
  const totalRegistrations = await prisma.registration.count({ where: { workspaceId: admin.workspaceId, isDeleted: false, date: dateFilter } });
  const pendingRegistrations = await prisma.registration.count({ where: { status: "Pending", workspaceId: admin.workspaceId, isDeleted: false, date: dateFilter } });
  const completedRegistrations = await prisma.registration.count({ where: { status: "Completed", workspaceId: admin.workspaceId, isDeleted: false, date: dateFilter } });

  // Calculate Average Turnaround Time (TAT) in hours for Completed registrations
  const completedRegs = await prisma.registration.findMany({
    where: { workspaceId: admin.workspaceId, isDeleted: false, status: "Completed", date: dateFilter },
    select: { createdAt: true, updatedAt: true },
  });
  let avgTAT = "0.0";
  if (completedRegs.length > 0) {
    const totalDiffMs = completedRegs.reduce((acc, reg) => {
      return acc + (new Date(reg.updatedAt) - new Date(reg.createdAt));
    }, 0);
    const avgDiffHours = (totalDiffMs / completedRegs.length) / (1000 * 60 * 60);
    avgTAT = avgDiffHours.toFixed(1);
  }

  // Fetch test department distribution
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

  // Doctor Referral Distribution
  const doctorRefs = await prisma.registration.findMany({
    where: {
      workspaceId: admin.workspaceId,
      isDeleted: false,
      date: dateFilter,
    },
    include: {
      refBy: true,
    },
  });
  const refAggregation = {};
  doctorRefs.forEach((reg) => {
    const docName = reg.refBy?.name || "Self";
    refAggregation[docName] = (refAggregation[docName] || 0) + 1;
  });
  const referralData = Object.entries(refAggregation)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Fetch all registrations in the selected date range
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

  // Fetch all payment transactions received during this period
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
      registrationId: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Determine whether to group by month or date (> 31 days => Monthly, <= 31 days => Daily)
  const isMonthly = ["3months", "6months", "year"].includes(range);
  const aggregatedData = {};

  if (isMonthly) {
    // Generate month keys from startDate to endDate (e.g. YYYY-MM)
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
    // Generate daily keys YYYY-MM-DD
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

  // Populate registrations data (registered count, completed count, revenue)
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

    // Fallback: If legacy registration has receivedAmount > 0 and no RegistrationPayment rows
    if ((!reg.payments || reg.payments.length === 0) && Number(reg.receivedAmount || 0) > 0) {
      aggregatedData[key].received += Number(reg.receivedAmount || 0);
    }
  });

  // Populate cash/online collections received on that specific date/month
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

  // Prepare chart data (in chronological order)
  const chartData = Object.entries(aggregatedData).map(([key, val]) => {
    let label = "";
    if (isMonthly) {
      const [year, month] = key.split("-");
      const dateObj = new Date(Number(year), Number(month) - 1, 1);
      label = dateObj.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
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

  // Prepare Table Rows (sorted newest first)
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
          year: "numeric",
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

  // Totals for summary footer & financial overview
  const totalBilling = summaryTableRows.reduce((sum, r) => sum + r.revenue, 0);
  const totalCollected = summaryTableRows.reduce((sum, r) => sum + r.received, 0);
  const totalTableRegistered = summaryTableRows.reduce((sum, r) => sum + r.registered, 0);
  const totalTableCompleted = summaryTableRows.reduce((sum, r) => sum + r.completed, 0);
  const totalTableRevenue = totalBilling;
  const totalTableReceived = totalCollected;

  const formatPeriodDate = (d) => {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const periodDateRangeStr = `${formatPeriodDate(startDate)} - ${formatPeriodDate(endDate)}`;

  const statCards = [
    {
      title: "Registrations",
      value: totalRegistrations,
      icon: <RegisterIcon sx={{ fontSize: 32, color: "#0f766e" }} />,
      bgColor: "#ccfbf1",
    },
    {
      title: "Pending Reports",
      value: pendingRegistrations,
      icon: <PendingIcon sx={{ fontSize: 32, color: "#d97706" }} />,
      bgColor: "#fef3c7",
    },
    {
      title: "Completed Tests",
      value: completedRegistrations,
      icon: <CheckedIcon sx={{ fontSize: 32, color: "#16a34a" }} />,
      bgColor: "#dcfce7",
    },
    // {
    //   title: "Avg Turnaround Time",
    //   value: `${avgTAT}h`,
    //   icon: <TimeIcon sx={{ fontSize: 32, color: "#4f46e5" }} />,
    //   bgColor: "#e0e7ff",
    // },
  ];

  return (
    <Box sx={{ flexGrow: 1, overflowX: "hidden", pt: 2 }}>
      {/* Header Overview */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
            Welcome back, {admin.name}!
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Here is the current overview of your laboratory operations, patient registrations, and accounts.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "flex-start", sm: "flex-end" }, gap: 0.5 }}>
          <DashboardRangeSelector initialRange={range} />
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, mt: 0.5 }}>
            Period: {periodDateRangeStr}
          </Typography>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
            <Card variant="outlined">
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: stat.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {stat.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dynamic Trends Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Patient Registrations Trend
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isMonthly ? "Monthly count of patient registrations in this period" : "Daily count of patient registrations in this period"}
              </Typography>
              <RegistrationChart data={chartData} />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Revenue Collection Trend
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isMonthly ? "Monthly invoiced billing amount (₹) in this period" : "Daily invoiced billing amount (₹) in this period"}
              </Typography>
              <RevenueChart data={chartData} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Daily / Monthly Operational & Financial Breakdown Table */}
      <Card variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1, color: "text.primary" }}>
                <TableChartIcon sx={{ color: "primary.main", fontSize: 22 }} />
                {isMonthly ? "Monthly Operational & Revenue Summary" : "Daily Operational & Revenue Summary"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isMonthly
                  ? "Month-wise breakdown of registrations, completed tests, billed revenue, and cash collections"
                  : "Date-wise breakdown of registrations, completed tests, billed revenue, and cash collections"}
              </Typography>
            </Box>
            <Chip
              icon={<CalendarIcon sx={{ fontSize: "16px !important" }} />}
              label={isMonthly ? "Month-wise View" : "Date-wise View"}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700, borderRadius: 1.5 }}
            />
          </Box>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              maxHeight: 440,
              overflow: "auto",
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "background.paper", width: { xs: "30%", sm: "28%" }, py: 1.5 }}>
                    {isMonthly ? "Month" : "Date"}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "background.paper", width: "18%", py: 1.5 }}>
                    Registered
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "background.paper", width: "18%", py: 1.5 }}>
                    Completed
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "background.paper", width: "18%", py: 1.5 }}>
                    Revenue (₹)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "background.paper", width: "18%", py: 1.5 }}>
                    Received (₹)
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {summaryTableRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      <Typography variant="body2">No registration or revenue activity found for this period.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  summaryTableRows.map((row) => (
                    <TableRow
                      key={row.key}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: "text.primary", py: 1.2 }}>
                        {row.dateLabel}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.2 }}>
                        <Chip
                          size="small"
                          label={row.registered}
                          sx={{
                            fontWeight: 700,
                            minWidth: 38,
                            bgcolor: row.registered > 0 ? "rgba(15, 118, 110, 0.1)" : "action.hover",
                            color: row.registered > 0 ? "#0f766e" : "text.secondary",
                            borderRadius: 1.5,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.2 }}>
                        <Chip
                          size="small"
                          label={row.completed}
                          sx={{
                            fontWeight: 700,
                            minWidth: 38,
                            bgcolor: row.completed > 0 ? "#dcfce7" : "action.hover",
                            color: row.completed > 0 ? "#15803d" : "text.secondary",
                            borderRadius: 1.5,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: row.revenue > 0 ? "text.primary" : "text.secondary", py: 1.2 }}>
                        ₹{row.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: row.received > 0 ? "success.main" : "text.secondary", py: 1.2 }}>
                        ₹{row.received.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>

              <TableFooter>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell sx={{ fontWeight: 800, color: "text.primary", py: 1.5 }}>
                    Total ({summaryTableRows.length} {isMonthly ? "Months" : "Days"})
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: "primary.main", py: 1.5 }}>
                    {totalTableRegistered}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: "#15803d", py: 1.5 }}>
                    {totalTableCompleted}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "text.primary", py: 1.5 }}>
                    ₹{totalTableRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "success.main", py: 1.5 }}>
                    ₹{totalTableReceived.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Financials & Quick Links & Recent items */}
      <Grid container spacing={4}>
        {/* Left column: Financials summary and Quick links */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Revenue Card */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUpIcon color="primary" /> Financial Overview
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Total Invoiced Billing:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{totalBilling.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Total Cash Collected:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>₹{totalCollected.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Due Balance:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                  ₹{(totalBilling - totalCollected).toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: Analytical Charts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Test Department Split
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Distribution of ordered tests by laboratory section
                  </Typography>
                  <DepartmentDistributionChart data={departmentData} />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Top Referrals
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Top 5 referring doctors / clinical partners
                  </Typography>
                  <ReferralChart data={referralData} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

