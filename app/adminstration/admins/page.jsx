"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Avatar,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Drawer,
  IconButton,
  Tooltip,
  Divider,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  AccessTime as AccessTimeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CalendarToday as CalendarTodayIcon,
  Today as TodayIcon,
  ListAlt as ListAltIcon,
} from "@mui/icons-material";
import { toast } from "sonner";

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "", workspaceId: "", roleId: "" });

  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingLogs, setTrackingLogs] = useState([]);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showRawSessions, setShowRawSessions] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async (pageNum = page, limitNum = limit) => {
    setLoading(true);
    try {
      const [adminRes, wsRes, roleRes] = await Promise.all([
        fetch(`/adminstration/api/admins?page=${pageNum}&limit=${limitNum}`).then((r) => r.json()),
        fetch("/adminstration/api/workspaces").then((r) => r.json()),
        fetch("/adminstration/api/roles").then((r) => r.json()),
      ]);

      if (!adminRes.success && (adminRes.error === "Unauthorized" || adminRes.error === "NEXT_REDIRECT")) {
        router.push("/adminstration/login");
        return;
      }

      if (adminRes.success) {
        setAdmins(adminRes.admins);
        if (adminRes.pagination) {
          setTotalCount(adminRes.pagination.totalCount);
          setTotalPages(adminRes.pagination.totalPages);
        }
      } else {
        toast.error(adminRes.error || "Failed to load admins.");
      }

      if (wsRes.success) setWorkspaces(wsRes.workspaces);
      if (roleRes.success) setRoles(roleRes.roles);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load admins data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page, limit);
  }, [page, limit]);

  const handleToggleAdmin = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const res = await fetch(`/adminstration/api/admins/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: newStatus }),
    }).then((r) => r.json());
    if (res.success) {
      toast.success(res.message);
      setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: newStatus } : a)));
    } else {
      toast.error(res.error || "Failed to change admin status.");
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!adminForm.name || !adminForm.email || !adminForm.password || !adminForm.workspaceId || !adminForm.roleId) {
      toast.error("All fields are required.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/adminstration/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminForm),
    }).then((r) => r.json());
    if (res.success) {
      toast.success(res.message);
      setAdminModalOpen(false);
      setAdminForm({ name: "", email: "", password: "", workspaceId: "", roleId: "" });
      setPage(1);
      fetchData(1, limit);
    } else {
      toast.error(res.error || "Failed to create admin account.");
    }
    setSubmitting(false);
  };

  const handleOpenTracking = async (admin) => {
    setSelectedAdmin(admin);
    setTrackingOpen(true);
    setLoadingTracking(true);
    setTrackingLogs([]);
    setWeekOffset(0);
    setShowRawSessions(false);
    try {
      const res = await fetch(`/adminstration/api/admins/${admin.id}/tracking`).then((r) => r.json());
      if (res.success) {
        setTrackingLogs(res.trackings || []);
      } else {
        toast.error(res.error || "Failed to load tracking data.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tracking data.");
    } finally {
      setLoadingTracking(false);
    }
  };

  const formatHourInterval = (hour24) => {
    const period1 = hour24 >= 12 ? "PM" : "AM";
    const h1 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const nextHour24 = (hour24 + 1) % 24;
    const period2 = nextHour24 >= 12 ? "PM" : "AM";
    const h2 = nextHour24 % 12 === 0 ? 12 : nextHour24 % 12;
    return `${h1}:00 ${period1} – ${h2}:00 ${period2}`;
  };

  const formatMinutes = (minutes) => {
    if (!minutes || minutes <= 0) return "0 min";
    return `${Math.round(minutes)} min`;
  };

  const currentWeekData = React.useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday + weekOffset * 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const TOTAL_SLOTS = 96; // 15-minute resolution per day (4 slots * 24 hours)
    const SLOT_DURATION_MS = 15 * 60 * 1000;

    const days = [];
    let weekTotalMinutes = 0;
    let activeDaysCount = 0;

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      dayDate.setHours(0, 0, 0, 0);

      const dayStartMs = dayDate.getTime();
      const slots = [];
      let dayTotalMinutes = 0;

      for (let s = 0; s < TOTAL_SLOTS; s++) {
        const slotStart = dayStartMs + s * SLOT_DURATION_MS;
        const slotEnd = slotStart + SLOT_DURATION_MS;

        let slotMinutes = 0;
        let slotSessionCount = 0;

        for (const log of trackingLogs) {
          const logStart = new Date(log.startUTC).getTime();
          const logEnd = log.ENDUTC
            ? new Date(log.ENDUTC).getTime()
            : logStart + (log.durationInMin || 0) * 60 * 1000;

          if (logStart < slotEnd && logEnd > slotStart) {
            const overlapStart = Math.max(logStart, slotStart);
            const overlapEnd = Math.min(logEnd, slotEnd);
            const overlapMin = Math.max(0, (overlapEnd - overlapStart) / (60 * 1000));

            slotMinutes += overlapMin;
            slotSessionCount++;
          }
        }

        const activeMinutes = Math.min(15, Math.round(slotMinutes));
        dayTotalMinutes += activeMinutes;
        const isFuture = slotStart > now.getTime();

        const startDate = new Date(slotStart);
        const endDate = new Date(slotEnd);
        const timeRangeStr = `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

        slots.push({
          index: s,
          timeRangeStr,
          activeMinutes,
          isActive: activeMinutes > 0,
          sessionCount: slotSessionCount,
          isFuture,
        });
      }

      const isToday = now.toDateString() === dayDate.toDateString();
      const isFutureDay = dayDate.getTime() > now.getTime() && !isToday;

      if (dayTotalMinutes > 0) activeDaysCount++;
      weekTotalMinutes += dayTotalMinutes;

      days.push({
        date: dayDate,
        dayShort: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
        dayFull: dayDate.toLocaleDateString("en-US", { weekday: "long" }),
        dateFormatted: dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        isToday,
        isFutureDay,
        totalMinutes: dayTotalMinutes,
        slots,
      });
    }

    const startLabel = startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endLabel = endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    let relativeLabel = "This Week";
    if (weekOffset === -1) relativeLabel = "Last Week";
    else if (weekOffset < -1) relativeLabel = `${Math.abs(weekOffset)} Weeks Ago`;
    else if (weekOffset === 1) relativeLabel = "Next Week";
    else if (weekOffset > 1) relativeLabel = `In ${weekOffset} Weeks`;

    const weekStartMs = startOfWeek.getTime();
    const weekEndMs = endOfWeek.getTime();
    const weekSessions = trackingLogs.filter((log) => {
      const logStart = new Date(log.startUTC).getTime();
      const logEnd = log.ENDUTC ? new Date(log.ENDUTC).getTime() : logStart + (log.durationInMin || 0) * 60 * 1000;
      return logStart <= weekEndMs && logEnd >= weekStartMs;
    });

    return {
      startOfWeek,
      endOfWeek,
      dateRangeLabel: `${startLabel} – ${endLabel}`,
      relativeLabel,
      days,
      weekTotalMinutes,
      activeDaysCount,
      dailyAverageMinutes: activeDaysCount > 0 ? Math.round(weekTotalMinutes / activeDaysCount) : 0,
      weekSessions,
    };
  }, [trackingLogs, weekOffset]);

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2.5, md: 4 }, bgcolor: "background.default", overflowY: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
          Workspace Administrators
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage all lab admin accounts across every workspace.
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PeopleIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            All Admins ({loading ? "…" : admins.length})
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAdminModalOpen(true)}
          sx={{ fontWeight: 600 }}
        >
          New Admin Account
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead sx={{ bgcolor: "background.paper" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Admin Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Workspace</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Active Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Activity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No admin accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: "primary.main", width: 34, height: 34, fontSize: "0.875rem", fontWeight: 700 }}>
                            {admin.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {admin.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        {admin.workspace ? (
                          <Chip
                            label={admin.workspace.name}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">Global (All)</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={admin.role?.name || "No Role"}
                          size="small"
                          color={admin.role?.name === "SUPER_ADMIN" ? "secondary" : "default"}
                          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={admin.isActive}
                          onChange={() => handleToggleAdmin(admin.id, admin.isActive)}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Activity Tracking & Active Hours">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<HistoryIcon sx={{ fontSize: 16 }} />}
                            onClick={() => handleOpenTracking(admin)}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}
                          >
                            Activity Logs
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                borderTop: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Showing {admins.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalCount)} of {totalCount} admins
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ChevronLeftIcon />}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  sx={{ borderRadius: 2 }}
                >
                  Previous
                </Button>
                <Typography variant="body2" sx={{ fontWeight: 700, px: 1 }}>
                  Page {page} of {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<ChevronRightIcon />}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  sx={{ borderRadius: 2 }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      <Dialog open={adminModalOpen} onClose={() => setAdminModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Register New Admin Account</DialogTitle>
        <form onSubmit={handleAdminSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Full Name" value={adminForm.name}
              onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))}
              fullWidth required size="small"
            />
            <TextField
              label="Email Address" type="email" value={adminForm.email}
              onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))}
              fullWidth required size="small"
            />
            <TextField
              label="Password" type="password" value={adminForm.password}
              onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))}
              fullWidth required size="small"
            />
            <FormControl fullWidth size="small" required>
              <InputLabel>Workspace</InputLabel>
              <Select
                value={adminForm.workspaceId}
                label="Workspace"
                onChange={(e) => setAdminForm((p) => ({ ...p, workspaceId: e.target.value }))}
              >
                {workspaces.map((ws) => <MenuItem key={ws.id} value={ws.id}>{ws.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" required>
              <InputLabel>Role</InputLabel>
              <Select
                value={adminForm.roleId}
                label="Role"
                onChange={(e) => setAdminForm((p) => ({ ...p, roleId: e.target.value }))}
              >
                {roles.map((role) => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setAdminModalOpen(false)} variant="outlined" color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Drawer
        anchor="right"
        open={trackingOpen}
        onClose={() => setTrackingOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", md: "75vw" },
            minWidth: { md: "780px" },
            maxWidth: "100vw",
            p: { xs: 2.5, sm: 3.5, md: 4 },
            bgcolor: "#f8fafc",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            borderTopLeftRadius: { xs: 0, sm: 20 },
            borderBottomLeftRadius: { xs: 0, sm: 20 },
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            boxSizing: "border-box",
          },
        }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", md: "75vw" },
              minWidth: { md: "780px" },
              maxWidth: "100vw",
              p: { xs: 2.5, sm: 3.5, md: 4 },
              bgcolor: "#f8fafc",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
              borderTopLeftRadius: { xs: 0, sm: 20 },
              borderBottomLeftRadius: { xs: 0, sm: 20 },
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              boxSizing: "border-box",
            },
          },
        }}
        PaperProps={{
          sx: {
            width: { xs: "100%", md: "75vw" },
            minWidth: { md: "780px" },
            maxWidth: "100vw",
            p: { xs: 2.5, sm: 3.5, md: 4 },
            bgcolor: "#f8fafc",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            borderTopLeftRadius: { xs: 0, sm: 20 },
            borderBottomLeftRadius: { xs: 0, sm: 20 },
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            boxSizing: "border-box",
          },
        }}
      >
        {selectedAdmin && (
          <>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: "-0.02em" }}>
                  Activity & Active Hours
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Weekly active timeline and health status for <strong>{selectedAdmin.name}</strong>
                </Typography>
              </Box>
              <Button
                onClick={() => setTrackingOpen(false)}
                variant="outlined"
                color="inherit"
                size="small"
                sx={{ borderRadius: 2.5, px: 2, fontWeight: 700 }}
              >
                Close
              </Button>
            </Box>

            {/* Admin Profile Banner */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: "white",
                display: "flex",
                alignItems: "center",
                gap: 2,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <Avatar sx={{ bgcolor: "primary.main", color: "white", width: 52, height: 52, fontWeight: 700, fontSize: "1.2rem" }}>
                {selectedAdmin.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {selectedAdmin.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.8rem" }}>
                  {selectedAdmin.email}
                </Typography>
                <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, fontSize: "0.75rem" }}>
                  Workspace: {selectedAdmin.workspace ? selectedAdmin.workspace.name : "N/A (Global)"}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right", pl: 2, borderLeft: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem" }}>
                  All-Time Total
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.main" }}>
                  {trackingLogs.reduce((acc, curr) => acc + (curr.durationInMin || 0), 0).toFixed(1)}m
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {trackingLogs.length} sessions
                </Typography>
              </Box>
            </Box>

            {/* Week Navigation Header */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <IconButton
                  size="small"
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  sx={{ bgcolor: "grey.100", "&:hover": { bgcolor: "grey.200" }, borderRadius: 2, p: 0.8 }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.2, fontSize: "0.95rem" }}>
                    {currentWeekData.dateRangeLabel}
                  </Typography>
                  <Chip
                    label={currentWeekData.relativeLabel}
                    size="small"
                    color={weekOffset === 0 ? "primary" : "default"}
                    sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, mt: 0.3 }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {weekOffset !== 0 && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<TodayIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setWeekOffset(0)}
                    sx={{ fontSize: "0.78rem", textTransform: "none", fontWeight: 700, py: 0.5, px: 1.5 }}
                  >
                    Current Week
                  </Button>
                )}
                <IconButton
                  size="small"
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  sx={{ bgcolor: "grey.100", "&:hover": { bgcolor: "grey.200" }, borderRadius: 2, p: 0.8 }}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>

            {/* Weekly Metrics Summary Cards */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" sx={{ color: "#065f46", textTransform: "uppercase", fontWeight: 800, fontSize: "0.7rem" }}>
                  Week Active Time
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#047857", mt: 0.5 }}>
                  {formatMinutes(currentWeekData.weekTotalMinutes)}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" sx={{ color: "#1e40af", textTransform: "uppercase", fontWeight: 800, fontSize: "0.7rem" }}>
                  Active Days
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#1d4ed8", mt: 0.5 }}>
                  {currentWeekData.activeDaysCount} / 7 Days
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" sx={{ color: "#3730a3", textTransform: "uppercase", fontWeight: 800, fontSize: "0.7rem" }}>
                  Daily Average
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#4338ca", mt: 0.5 }}>
                  {formatMinutes(currentWeekData.dailyAverageMinutes)}
                </Typography>
              </Box>
            </Box>

            {/* Health Status UI - 7 Day Rows */}
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                bgcolor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              {/* Health Status Header Banner */}
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: 2.5,
                  bgcolor: currentWeekData.activeDaysCount > 0 ? "rgba(16, 185, 129, 0.08)" : "grey.50",
                  border: "1px solid",
                  borderColor: currentWeekData.activeDaysCount > 0 ? "rgba(16, 185, 129, 0.2)" : "divider",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: currentWeekData.activeDaysCount > 0 ? "#10b981" : "#94a3b8",
                      boxShadow: currentWeekData.activeDaysCount > 0 ? "0 0 0 3px rgba(16, 185, 129, 0.25)" : "none",
                    }}
                  />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: currentWeekData.activeDaysCount > 0 ? "#065f46" : "text.primary", lineHeight: 1.2 }}>
                      {currentWeekData.activeDaysCount > 0 ? "Active & Operational" : "No Activity This Week"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: currentWeekData.activeDaysCount > 0 ? "#047857" : "text.secondary", fontSize: "0.75rem" }}>
                      Weekly health status • {currentWeekData.activeDaysCount} active days ({formatMinutes(currentWeekData.weekTotalMinutes)})
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: "#10b981" }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#065f46" }}>Active</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: "#e2e8f0" }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.72rem", color: "text.secondary" }}>Inactive</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Time Milestone Markers Directly Above the Rows */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  pl: "82px",
                  pr: "84px",
                  mb: 1.5,
                  pb: 0.5,
                  borderBottom: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <Box sx={{ flex: 1, display: "flex", justifyContent: "space-between", px: 0.5 }}>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 800, color: "text.secondary" }}>
                    12 AM (00:00)
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: "text.disabled" }}>
                    3 AM
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 800, color: "text.secondary" }}>
                    6 AM
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: "text.disabled" }}>
                    9 AM
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 800, color: "text.secondary" }}>
                    12 PM (Noon)
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: "text.disabled" }}>
                    3 PM
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 800, color: "text.secondary" }}>
                    6 PM
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: "text.disabled" }}>
                    9 PM
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 800, color: "text.secondary" }}>
                    11:59 PM (24:00)
                  </Typography>
                </Box>
              </Box>

              {loadingTracking ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {currentWeekData.days.map((day, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1,
                        borderRadius: 2,
                        bgcolor: day.isToday ? "rgba(59, 130, 246, 0.04)" : "transparent",
                        border: day.isToday ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid transparent",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          bgcolor: day.isToday ? "rgba(59, 130, 246, 0.08)" : "action.hover",
                        },
                      }}
                    >
                      {/* Left: Day & Date */}
                      <Box sx={{ width: 68, flexShrink: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: day.isToday ? "primary.main" : "text.primary", lineHeight: 1.1 }}>
                            {day.dayShort}
                          </Typography>
                          {day.isToday && (
                            <Chip
                              label="TODAY"
                              size="small"
                              color="primary"
                              sx={{ height: 15, fontSize: "0.52rem", fontWeight: 800, px: 0.3 }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem", fontWeight: 600 }}>
                          {day.dateFormatted}
                        </Typography>
                      </Box>

                      {/* Middle: 96 Segmented Health Status Bars (Matching Reference Image) */}
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: "1.5px",
                          height: 30,
                          px: 0.5,
                        }}
                      >
                        {day.slots.map((slot) => {
                          let bgColor = "#e2e8f0";
                          let opacity = 1;
                          let shadow = "none";

                          if (slot.isActive) {
                            if (slot.activeMinutes >= 10) {
                              bgColor = "#059669";
                            } else if (slot.activeMinutes >= 5) {
                              bgColor = "#10b981";
                            } else {
                              bgColor = "#34d399";
                            }
                            shadow = "0 1px 2px rgba(16, 185, 129, 0.3)";
                          } else if (slot.isFuture) {
                            bgColor = "#f1f5f9";
                            opacity = 0.5;
                          }

                          const tooltipTitle = (
                            <Box sx={{ p: 0.5, textAlign: "center", minWidth: 130 }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, display: "block", color: "white" }}>
                                {day.dayFull}, {day.dateFormatted}
                              </Typography>
                              <Typography variant="caption" sx={{ display: "block", color: "rgba(255,255,255,0.85)", fontSize: "0.72rem" }}>
                                🕒 {slot.timeRangeStr}
                              </Typography>
                              <Divider sx={{ my: 0.5, borderColor: "rgba(255,255,255,0.2)" }} />
                              {slot.isActive ? (
                                <>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#86efac", display: "block" }}>
                                    🟢 Active: {slot.activeMinutes} min
                                  </Typography>
                                  {slot.sessionCount > 0 && (
                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.7rem" }}>
                                      {slot.sessionCount} session{slot.sessionCount > 1 ? "s" : ""}
                                    </Typography>
                                  )}
                                </>
                              ) : slot.isFuture ? (
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                                  Upcoming Slot
                                </Typography>
                              ) : (
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                  ⚪ Inactive (0 min)
                                </Typography>
                              )}
                            </Box>
                          );

                          return (
                            <Tooltip key={slot.index} title={tooltipTitle} arrow placement="top">
                              <Box
                                sx={{
                                  flex: 1,
                                  height: "100%",
                                  borderRadius: "1.5px",
                                  bgcolor: bgColor,
                                  opacity,
                                  boxShadow: shadow,
                                  cursor: "pointer",
                                  transition: "all 0.12s ease-in-out",
                                  "&:hover": {
                                    transform: "scaleY(1.25)",
                                    zIndex: 10,
                                    bgcolor: slot.isActive ? "#047857" : "#94a3b8",
                                  },
                                }}
                              />
                            </Tooltip>
                          );
                        })}
                      </Box>

                      {/* Right: Day Total Active Duration Chip */}
                      <Box sx={{ width: 72, textAlign: "right", flexShrink: 0 }}>
                        <Chip
                          label={formatMinutes(day.totalMinutes)}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            height: 22,
                            borderRadius: "6px",
                            bgcolor: day.totalMinutes > 0 ? "rgba(16, 185, 129, 0.12)" : "grey.100",
                            color: day.totalMinutes > 0 ? "#065f46" : "text.secondary",
                            border: day.totalMinutes > 0 ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}

              {/* Time Scale Footer (24 Hours) */}
              <Box sx={{ display: "flex", alignItems: "center", pl: "82px", pr: "84px", mt: 1.5, pt: 1, borderTop: "1px dashed", borderColor: "divider" }}>
                <Box sx={{ flex: 1, display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: "text.disabled" }}>00:00 (12 AM)</Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: "text.disabled" }}>06:00</Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: "text.disabled" }}>12:00 (Noon)</Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: "text.disabled" }}>18:00</Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: "text.disabled" }}>23:59 (12 AM)</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Collapsible Session List */}
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, bgcolor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                onClick={() => setShowRawSessions((prev) => !prev)}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ListAltIcon color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.9rem" }}>
                    Detailed Session Logs ({currentWeekData.weekSessions.length} in this week)
                  </Typography>
                </Box>
                <Button size="small" variant="text" sx={{ fontWeight: 700, fontSize: "0.78rem", textTransform: "none" }}>
                  {showRawSessions ? "Hide List" : "Show List"}
                </Button>
              </Box>

              {showRawSessions && (
                <Box sx={{ mt: 2 }}>
                  {currentWeekData.weekSessions.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4, bgcolor: "grey.50", borderRadius: 2.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        No individual session logs recorded for this week.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer sx={{ maxHeight: 260 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: "grey.50" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, py: 1 }}>Active Interval</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 1 }} align="right">Duration</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 1 }} align="center">Mode</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {currentWeekData.weekSessions.map((log) => {
                            const startDate = new Date(log.startUTC);
                            const endDate = log.ENDUTC ? new Date(log.ENDUTC) : startDate;
                            const startStr = startDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
                            const endStr = endDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
                            const dateStr = startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });

                            return (
                              <TableRow key={log.id} hover>
                                <TableCell sx={{ py: 1.2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.85rem", color: "text.primary" }}>
                                    {dateStr} • {startStr} – {endStr}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ py: 1.2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.85rem", color: "success.dark" }}>
                                    {Number(log.durationInMin).toFixed(1)} min
                                  </Typography>
                                </TableCell>
                                <TableCell align="center" sx={{ py: 1.2 }}>
                                  <Chip
                                    label={log.mode || "online"}
                                    size="small"
                                    variant="filled"
                                    color={log.mode === "offline" ? "default" : "success"}
                                    sx={{
                                      textTransform: "capitalize",
                                      fontWeight: 700,
                                      fontSize: "0.72rem",
                                      height: 20,
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </Paper>
          </>
        )}
      </Drawer>
    </Box>
  );
}
