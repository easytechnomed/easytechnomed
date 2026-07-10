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
} from "@mui/material";
import {
  Add as AddIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  AccessTime as AccessTimeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
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
    try {
      const res = await fetch(`/adminstration/api/admins/${admin.id}/tracking`).then((r) => r.json());
      if (res.success) {
        setTrackingLogs(res.trackings);
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

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2.5, md: 4 }, bgcolor: "background.default", overflowY: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
          Workspace Administrators
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage all lab admin accounts across every workspace.
        </Typography>
      </Box>

      {/* Toolbar */}
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
                  <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Laboratory Workspace</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Approval</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Active</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Activity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No admin accounts found. Create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 32, height: 32, fontSize: "0.85rem" }}>
                            {admin.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{admin.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{admin.mobileNumber || "—"}</TableCell>
                      <TableCell sx={{ color: "primary.main", fontWeight: 600 }}>
                        {admin.workspace ? admin.workspace.name : "N/A (Global)"}
                      </TableCell>
                      <TableCell>
                        <Chip label={admin.role?.name || "Admin"} size="small" variant="outlined" color="primary" />
                      </TableCell>
                      <TableCell>{admin.isApproved ? "Approved" : "Pending"}</TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={admin.isActive}
                          onChange={() => handleToggleAdmin(admin.id, admin.isActive)}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Activity Log">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenTracking(admin)}
                            size="small"
                          >
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination Bar */}
          {totalCount > 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: "center",
                gap: { xs: 2, sm: 0 },
                p: 2,
                borderTop: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              {/* Left Side */}
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                {`${(page - 1) * limit + 1}-${Math.min(page * limit, totalCount)} of ${totalCount}`}
              </Typography>

              {/* Right Side Controls */}
              <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: { xs: 2, sm: 3 } }}>
                {/* Rows per page */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.82rem" }}>
                    Rows per page
                  </Typography>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(parseInt(e.target.value, 10));
                      setPage(1);
                    }}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(0,0,0,0.15)",
                      backgroundColor: "transparent",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "inherit",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size} style={{ color: "#334155" }}>
                        {size}
                      </option>
                    ))}
                  </select>
                </Box>

                {/* Go to Page */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.82rem" }}>
                    Go to Page
                  </Typography>
                  <select
                    value={page}
                    onChange={(e) => setPage(parseInt(e.target.value, 10))}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(0,0,0,0.15)",
                      backgroundColor: "transparent",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "inherit",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                      <option key={pNum} value={pNum} style={{ color: "#334155" }}>
                        {pNum}
                      </option>
                    ))}
                  </select>
                </Box>

                {/* Prev/Next buttons */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconButton
                    size="small"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "6px", p: "4px" }}
                  >
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "6px", p: "4px" }}
                  >
                    <ChevronRightIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Create Admin Dialog */}
      <Dialog open={adminModalOpen} onClose={() => setAdminModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Register New Admin Account</DialogTitle>
        <form onSubmit={handleAdminSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            <TextField
              label="Full Name" value={adminForm.name}
              onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))}
              fullWidth required size="small" slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Email Address" type="email" value={adminForm.email}
              onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))}
              fullWidth required size="small" slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Password" type="password" value={adminForm.password}
              onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))}
              fullWidth required size="small" inputProps={{ minLength: 8 }} slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl fullWidth size="small" required>
              <InputLabel shrink>Assign to Workspace</InputLabel>
              <Select
                value={adminForm.workspaceId}
                onChange={(e) => setAdminForm((p) => ({ ...p, workspaceId: e.target.value }))}
                displayEmpty notched
              >
                <MenuItem value="" disabled>Select Lab...</MenuItem>
                {workspaces.map((ws) => (
                  <MenuItem key={ws.id} value={ws.id}>{ws.name} (/{ws.slug})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" required>
              <InputLabel shrink>Role</InputLabel>
              <Select
                value={adminForm.roleId}
                onChange={(e) => setAdminForm((p) => ({ ...p, roleId: e.target.value }))}
                displayEmpty notched
              >
                <MenuItem value="" disabled>Select Role...</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setAdminModalOpen(false)} variant="outlined" color="inherit" disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Creating..." : "Create Admin Account"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Admin Tracking Drawer */}
      <Drawer
        anchor="right"
        open={trackingOpen}
        onClose={() => setTrackingOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 550 },
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              borderTopLeftRadius: { xs: 0, sm: 16 },
              borderBottomLeftRadius: { xs: 0, sm: 16 },
              boxShadow: 24,
            },
          },
        }}
      >
        {selectedAdmin && (
          <>
            {/* Drawer Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
                  Activity Tracking
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Detailed session logs for {selectedAdmin.name}
                </Typography>
              </Box>
              <Button
                onClick={() => setTrackingOpen(false)}
                variant="outlined"
                color="inherit"
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Close
              </Button>
            </Box>

            {/* Admin Mini Profile */}
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: "action.hover",
                display: "flex",
                alignItems: "center",
                gap: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  width: 48,
                  height: 48,
                  fontSize: "1.2rem",
                  fontWeight: 700,
                }}
              >
                {selectedAdmin.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {selectedAdmin.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {selectedAdmin.email}
                </Typography>
                <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600 }}>
                  Workspace: {selectedAdmin.workspace ? selectedAdmin.workspace.name : "N/A (Global)"}
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* Metrics Row */}
            <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.8, textTransform: "uppercase", fontWeight: 700 }}>
                  Total Sessions
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {trackingLogs.length}
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.8, textTransform: "uppercase", fontWeight: 700 }}>
                  Total Duration
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {trackingLogs.reduce((acc, curr) => acc + (curr.durationInMin || 0), 0).toFixed(1)}m
                </Typography>
              </Box>
            </Box>

            {/* Session Logs List */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", mt: 1 }}>
              Session History
            </Typography>

            {loadingTracking ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flexGrow: 1, py: 8 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : trackingLogs.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flexGrow: 1,
                  py: 8,
                  px: 3,
                  textAlign: "center",
                  bgcolor: "background.default",
                  borderRadius: 3,
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <HistoryIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  No tracking logs found
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  This administrator has not established any tracked sessions yet.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 0.5 }}>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, py: 1 }}>Start Time</TableCell>
                        <TableCell sx={{ fontWeight: 700, py: 1 }} align="right">Duration</TableCell>
                        <TableCell sx={{ fontWeight: 700, py: 1 }} align="center">Mode</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trackingLogs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {new Date(log.startUTC).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(log.startUTC).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                              <AccessTimeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {log.durationInMin >= 60
                                  ? `${(log.durationInMin / 60).toFixed(1)} hrs`
                                  : `${Math.round(log.durationInMin)} mins`}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Chip
                              label={log.mode || "online"}
                              size="small"
                              variant="filled"
                              color={log.mode === "offline" ? "default" : "success"}
                              sx={{
                                textTransform: "capitalize",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                height: 20,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </>
        )}
      </Drawer>
    </Box>
  );
}
