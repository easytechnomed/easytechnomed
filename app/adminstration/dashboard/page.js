"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Avatar,
  Divider,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip
} from "@mui/material";
import {
  Shield as ShieldIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExitToApp as LogoutIcon,
  Business as WorkspaceIcon,
  People as PeopleIcon,
  AppRegistration as RegIcon,
  Security as SecurityIcon
} from "@mui/icons-material";
import { toast } from "sonner";

// Server Action imports removed - using REST API instead

// Custom dark theme for superadmin dashboard
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#14b8a6", // Teal 500
    },
    background: {
      default: "#0f172a", // Slate 900
      paper: "#1e293b", // Slate 800
    },
    divider: "rgba(255, 255, 255, 0.08)",
  },
  typography: {
    fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
  },
});

const AVAILABLE_PERMISSIONS = [
  { value: "admin:view", label: "Read Workspace Data (view patient reports, stats)" },
  { value: "admin:create", label: "Create patient registrations" },
  { value: "admin:write", label: "Update patient registrations & enter lab parameters" },
  { value: "admin:delete", label: "Delete patient registrations" },
  { value: "admin:approve", label: "Approve users" },
  { value: "admin:reject", label: "Reject users" },
];

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [workspaces, setWorkspaces] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Forms state
  const [workspaceForm, setWorkspaceForm] = useState({ name: "", slug: "" });
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "", workspaceId: "", roleId: "" });
  const [roleForm, setRoleForm] = useState({ name: "", permissions: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wsRes, adminRes, roleRes] = await Promise.all([
        fetch("/adminstration/api/workspaces").then((r) => r.json()),
        fetch("/adminstration/api/admins").then((r) => r.json()),
        fetch("/adminstration/api/roles").then((r) => r.json())
      ]);

      if (wsRes.success) {
        setWorkspaces(wsRes.workspaces);
      } else {
        toast.error(wsRes.error || "Failed to load workspaces.");
      }

      if (adminRes.success) {
        setAdmins(adminRes.admins);
      } else {
        toast.error(adminRes.error || "Failed to load admins.");
      }

      if (roleRes.success) {
        setRoles(roleRes.roles);
      } else {
        toast.error(roleRes.error || "Failed to load roles.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogout = async () => {
    const res = await fetch("/adminstration/api/auth/logout", { method: "POST" }).then((r) => r.json());
    if (res.success) {
      toast.success("Logged out successfully.");
      router.push(res.redirect);
    } else {
      toast.error(res.message);
    }
  };

  // Toggle Workspace Status
  const handleToggleWorkspace = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const res = await fetch(`/adminstration/api/workspaces/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: newStatus }),
    }).then((r) => r.json());
    if (res.success) {
      toast.success(res.message);
      setWorkspaces(prev =>
        prev.map(ws => (ws.id === id ? { ...ws, isActive: newStatus } : ws))
      );
    } else {
      toast.error(res.error || "Failed to change workspace status.");
    }
  };

  // Toggle Admin Status
  const handleToggleAdmin = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const res = await fetch(`/adminstration/api/admins/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: newStatus }),
    }).then((r) => r.json());
    if (res.success) {
      toast.success(res.message);
      setAdmins(prev =>
        prev.map(admin => (admin.id === id ? { ...admin, isActive: newStatus } : admin))
      );
    } else {
      toast.error(res.error || "Failed to change admin status.");
    }
  };

  // Delete Workspace
  const handleDeleteWorkspace = async (id) => {
    if (!confirm("Are you sure you want to delete this workspace? This will cascade delete ALL connected admins, registrations, and results!")) {
      return;
    }

    const res = await fetch(`/adminstration/api/workspaces/${id}`, { method: "DELETE" }).then((r) => r.json());
    if (res.success) {
      toast.success(res.message);
      fetchData();
    } else {
      toast.error(res.error || "Failed to delete workspace.");
    }
  };

  // Delete Admin Role
  const handleDeleteRole = async (id) => {
    if (id === 1) {
      toast.error("Cannot delete default Admin role.");
      return;
    }

    if (!confirm("Are you sure you want to delete this role? Any admins holding this role will lose their custom permissions.")) {
      return;
    }

    const res = await fetch(`/adminstration/api/roles/${id}`, { method: "DELETE" }).then((r) => r.json());
    if (res.success) {
      toast.success(res.message);
      fetchData();
    } else {
      toast.error(res.error || "Failed to delete role.");
    }
  };

  // Handle Workspace Create Submit
  const handleWorkspaceSubmit = async (e) => {
    e.preventDefault();
    if (!workspaceForm.name || !workspaceForm.slug) {
      toast.error("All fields are required.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/adminstration/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(workspaceForm),
    }).then((r) => r.json());
    if (res.success) {
      toast.success(res.message);
      setWorkspaceModalOpen(false);
      fetchData();
    } else {
      toast.error(res.error || "Failed to create workspace.");
    }
    setSubmitting(false);
  };

  // Handle Admin Create Submit
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
      fetchData();
    } else {
      toast.error(res.error || "Failed to create admin account.");
    }
    setSubmitting(false);
  };

  // Handle Role Create Submit
  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleForm.name) {
      toast.error("Role name is required.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/adminstration/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roleForm),
    }).then((r) => r.json());
    if (res.success) {
      toast.success(res.message);
      setRoleModalOpen(false);
      fetchData();
    } else {
      toast.error(res.error || "Failed to create role.");
    }
    setSubmitting(false);
  };

  // Generate slug dynamically from name
  const handleWorkspaceNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    setWorkspaceForm({ name, slug });
  };

  // Handle Role Permissions Checkbox Change
  const handlePermissionChange = (permValue) => {
    setRoleForm(prev => {
      const isChecked = prev.permissions.includes(permValue);
      const newPermissions = isChecked
        ? prev.permissions.filter(p => p !== permValue)
        : [...prev.permissions, permValue];
      return { ...prev, permissions: newPermissions };
    });
  };

  // Total stats calculations
  const totalWorkspaces = workspaces.length;
  const totalAdmins = admins.length;
  const totalRegToday = workspaces.reduce((sum, ws) => sum + (ws.stats?.today || 0), 0);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4, px: { xs: 2, md: 4 } }}>
        
        {/* Navbar */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ShieldIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                SuperAdmin Administration
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pathlab Laboratories Workspace Controller
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ fontWeight: 600 }}
          >
            Logout
          </Button>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(20, 184, 166, 0.08)", color: "primary.main" }}>
                  <WorkspaceIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                    Total Labs
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {loading ? <CircularProgress size={24} /> : totalWorkspaces}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(20, 184, 166, 0.08)", color: "primary.main" }}>
                  <PeopleIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                    Total Connected Admins
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {loading ? <CircularProgress size={24} /> : totalAdmins}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(20, 184, 166, 0.08)", color: "primary.main" }}>
                  <RegIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                    Global Registrations Today
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {loading ? <CircularProgress size={24} /> : totalRegToday}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Dashboard Tabs & Actions */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Tabs value={tabValue} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
            <Tab label="Workspaces (Labs)" sx={{ fontWeight: 700 }} />
            <Tab label="Admin Accounts" sx={{ fontWeight: 700 }} />
            <Tab label="Roles & Permissions" sx={{ fontWeight: 700 }} />
          </Tabs>

          {tabValue === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setWorkspaceModalOpen(true)}
              sx={{ fontWeight: 600 }}
            >
              New Workspace
            </Button>
          )}

          {tabValue === 1 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAdminModalOpen(true)}
              sx={{ fontWeight: 600 }}
            >
              New Admin Account
            </Button>
          )}

          {tabValue === 2 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setRoleForm({ name: "", permissions: [] });
                setRoleModalOpen(true);
              }}
              sx={{ fontWeight: 600 }}
            >
              New Role
            </Button>
          )}
        </Box>

        {/* Tab Contents */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <>
            {/* WORKSPACES TAB */}
            {tabValue === 0 && (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                <Table>
                  <TableHead sx={{ bgcolor: "background.paper" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Workspace Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Slug</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Admins</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Reg Today</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Reg Last 7 Days</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Active Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workspaces.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                          No workspaces found. Create one to begin.
                        </TableCell>
                      </TableRow>
                    ) : (
                      workspaces.map((ws) => (
                        <TableRow key={ws.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{ws.name}</TableCell>
                          <TableCell sx={{ color: "text.secondary" }}>/{ws.slug}</TableCell>
                          <TableCell sx={{ maxWidth: 220 }}>
                            {ws.admins.length === 0 ? (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                                No admins
                              </Typography>
                            ) : (
                              ws.admins.map((adm) => adm.name).join(", ")
                            )}
                          </TableCell>
                          <TableCell align="center">{ws.stats?.today || 0}</TableCell>
                          <TableCell align="center">{ws.stats?.last7Days || 0}</TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={ws.isActive}
                              onChange={() => handleToggleWorkspace(ws.id, ws.isActive)}
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton color="error" onClick={() => handleDeleteWorkspace(ws.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* ADMINS TAB */}
            {tabValue === 1 && (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                <Table>
                  <TableHead sx={{ bgcolor: "background.paper" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Admin Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Laboratory Workspace</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Approval</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Active Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {admins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                          No admin accounts found. Create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      admins.map((admin) => (
                        <TableRow key={admin.id} hover>
                          <TableCell sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32, fontSize: "0.85rem" }}>
                              {admin.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {admin.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{admin.email}</TableCell>
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
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* ROLES TAB */}
            {tabValue === 2 && (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                <Table>
                  <TableHead sx={{ bgcolor: "background.paper" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Role Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Permissions Granted</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 6, color: "text.secondary" }}>
                          No custom roles found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      roles.map((role) => (
                        <TableRow key={role.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{role.name}</TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                              {role.permissions.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                                  No permissions assigned (Read-only default)
                                </Typography>
                              ) : (
                                role.permissions.map(perm => (
                                  <Chip key={perm} label={perm} size="small" color="teal" variant="outlined" />
                                ))
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {role.id !== 1 ? (
                              <IconButton color="error" onClick={() => handleDeleteRole(role.id)}>
                                <DeleteIcon />
                              </IconButton>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                System Default
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* Create Workspace Dialog */}
        <Dialog open={workspaceModalOpen} onClose={() => setWorkspaceModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Register New Lab Workspace</DialogTitle>
          <form onSubmit={handleWorkspaceSubmit}>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
              <TextField
                label="Workspace Name"
                value={workspaceForm.name}
                onChange={handleWorkspaceNameChange}
                fullWidth
                required
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Slug / URL Path prefix"
                value={workspaceForm.slug}
                onChange={(e) => setWorkspaceForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                fullWidth
                required
                size="small"
                helperText="URL prefix e.g. alpha-lab"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setWorkspaceModalOpen(false)} variant="outlined" color="inherit" disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Creating..." : "Create Workspace"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Create Admin Dialog */}
        <Dialog open={adminModalOpen} onClose={() => setAdminModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Register New Admin Account</DialogTitle>
          <form onSubmit={handleAdminSubmit}>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
              <TextField
                label="Full Name"
                value={adminForm.name}
                onChange={(e) => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                required
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Email Address"
                type="email"
                value={adminForm.email}
                onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                fullWidth
                required
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Password"
                type="password"
                value={adminForm.password}
                onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                fullWidth
                required
                size="small"
                inputProps={{ minLength: 8 }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <FormControl fullWidth size="small" required>
                <InputLabel shrink>Assign to Workspace</InputLabel>
                <Select
                  value={adminForm.workspaceId}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, workspaceId: e.target.value }))}
                  displayEmpty
                  notched
                >
                  <MenuItem value="" disabled>Select Lab...</MenuItem>
                  {workspaces.map((ws) => (
                    <MenuItem key={ws.id} value={ws.id}>
                      {ws.name} (/{ws.slug})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" required>
                <InputLabel shrink>Role</InputLabel>
                <Select
                  value={adminForm.roleId}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, roleId: e.target.value }))}
                  displayEmpty
                  notched
                >
                  <MenuItem value="" disabled>Select Role...</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setAdminModalOpen(false)} variant="outlined" color="inherit" disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Register..." : "Create Admin Account"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Create Role Dialog */}
        <Dialog open={roleModalOpen} onClose={() => setRoleModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Create Custom Role</DialogTitle>
          <form onSubmit={handleRoleSubmit}>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
              <TextField
                label="Role Name"
                value={roleForm.name}
                onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                required
                size="small"
                placeholder="e.g. Lab Technician, Report Viewer"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Permissions Settings
              </Typography>
              <FormGroup>
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <FormControlLabel
                    key={perm.value}
                    control={
                      <Checkbox
                        checked={roleForm.permissions.includes(perm.value)}
                        onChange={() => handlePermissionChange(perm.value)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {perm.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {perm.label}
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 1.5, alignItems: "flex-start" }}
                  />
                ))}
              </FormGroup>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setRoleModalOpen(false)} variant="outlined" color="inherit" disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Creating..." : "Create Role"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

      </Box>
    </ThemeProvider>
  );
}
