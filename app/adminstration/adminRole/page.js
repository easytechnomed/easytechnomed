"use client";

import React, { useState, useEffect } from "react";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Avatar,
  CircularProgress
} from "@mui/material";
import {
  Shield as ShieldIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExitToApp as LogoutIcon,
  Business as WorkspaceIcon,
  People as PeopleIcon,
  AppRegistration as RegIcon,
  Security as SecurityIcon,
  CloudUpload as UploadIcon,
  Menu as MenuIcon
} from "@mui/icons-material";
import { toast } from "sonner";

const drawerWidth = 260;

// Custom light purple theme matching the SuperAdmin dashboard theme
const lightPurpleTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#7c3aed", // Purple 600
      light: "#a78bfa", // Purple 400
      dark: "#6d28d9", // Purple 700
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#db2777", // Pink 600
    },
    background: {
      default: "#f8fafc", // Slate 50
      paper: "#ffffff", // Card backgrounds
    },
    text: {
      primary: "#0f172a", // Slate 900
      secondary: "#475569", // Slate 600
    },
    divider: "rgba(0, 0, 0, 0.08)",
  },
  typography: {
    fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
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

export default function AdminRolesPage() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form State
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: "", permissions: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wsRes, adminRes, roleRes] = await Promise.all([
        fetch("/adminstration/api/workspaces").then((r) => r.json()),
        fetch("/adminstration/api/admins").then((r) => r.json()),
        fetch("/adminstration/api/roles").then((r) => r.json())
      ]);

      if (!wsRes.success && (wsRes.error === "NEXT_REDIRECT" || wsRes.error === "Unauthorized")) {
        router.push("/adminstration/login");
        return;
      }
      if (!adminRes.success && (adminRes.error === "NEXT_REDIRECT" || adminRes.error === "Unauthorized")) {
        router.push("/adminstration/login");
        return;
      }
      if (!roleRes.success && (roleRes.error === "NEXT_REDIRECT" || roleRes.error === "Unauthorized")) {
        router.push("/adminstration/login");
        return;
      }

      if (wsRes.success) setWorkspaces(wsRes.workspaces);
      if (adminRes.success) setAdmins(adminRes.admins);
      if (roleRes.success) {
        setRoles(roleRes.roles);
      } else {
        toast.error(roleRes.error || "Failed to load roles.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load roles dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    const res = await fetch("/adminstration/api/auth/logout", { method: "POST" }).then((r) => r.json());
    if (res.success) {
      toast.success("Logged out successfully.");
      router.push(res.redirect);
    } else {
      toast.error(res.message);
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

  const menuItems = [
    { text: "Workspace Controller", icon: <WorkspaceIcon />, path: "/adminstration/dashboard?tab=workspaces", index: 0 },
    { text: "Administrators", icon: <PeopleIcon />, path: "/adminstration/dashboard?tab=admins", index: 1 },
    { text: "Admin Roles", icon: <SecurityIcon />, path: "/adminstration/adminRole", index: 2 },
    { text: "Import Lab Tests", icon: <UploadIcon />, path: "/adminstration/dashboard?tab=importer", index: 3 },
  ];

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", px: 3, py: 2.5, gap: 0.5 }}>
        <Box component="img" src="/logo/logobg.png" alt="EasyTechnoMed Logo" sx={{ height: 45, objectFit: "contain" }} />
        <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", letterSpacing: "1px", textTransform: "uppercase" }}>
          SuperAdmin Console
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: "auto", flexGrow: 1, py: 2 }}>
        <List sx={{ px: 2 }}>
          {menuItems.map((item) => {
            const isActive = item.index === 2; // Admin Roles is active on this page
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    setMobileOpen(false);
                    router.push(item.path);
                  }}
                  sx={{
                    borderRadius: "8px",
                    py: 1.2,
                    px: 2,
                    backgroundColor: isActive ? "rgba(124, 58, 237, 0.08)" : "transparent",
                    color: isActive ? "primary.main" : "text.secondary",
                    "&:hover": {
                      backgroundColor: isActive ? "rgba(124, 58, 237, 0.12)" : "rgba(124, 58, 237, 0.04)",
                      color: isActive ? "primary.main" : "primary.main",
                      "& .MuiListItemIcon-root": {
                        color: "primary.main",
                      },
                    },
                    "& .MuiListItemIcon-root": {
                      color: isActive ? "primary.main" : "text.secondary",
                      minWidth: 40,
                    },
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.9rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 2, bgcolor: "rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 40, height: 40, fontWeight: 700 }}>
          S
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: "text.primary" }}>
            System Admin
          </Typography>
          <Typography variant="caption" noWrap sx={{ display: "block", color: "text.secondary" }}>
            superadmin@easytechnomed.com
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={lightPurpleTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        
        {/* Sidebar Navigation */}
        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
          {/* Mobile Drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, borderRight: "1px solid", borderColor: "divider" },
            }}
          >
            {drawerContent}
          </Drawer>

          {/* Desktop Drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, borderRight: "1px solid", borderColor: "divider" },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Right Area */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Header AppBar */}
          <AppBar
            position="static"
            color="inherit"
            elevation={0}
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: 4 } }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  sx={{ mr: 2, display: { md: "none" } }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap sx={{ fontWeight: 800, fontSize: "1.25rem", color: "primary.main" }}>
                  Admin Roles
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 32, height: 32, fontSize: "0.875rem", fontWeight: 700 }}>
                    S
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                    System Admin
                  </Typography>
                </Box>
                <Divider orientation="vertical" variant="middle" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
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
            </Toolbar>
          </AppBar>

          {/* Main content body */}
          <Box sx={{ flexGrow: 1, p: { xs: 2.5, md: 4 }, bgcolor: "background.default" }}>
            
            {/* Welcome banner */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
                Workspace Roles & Permissions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure roles and permissions governing workspace data read/write accesses.
              </Typography>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(124, 58, 237, 0.08)", color: "primary.main" }}>
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
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(124, 58, 237, 0.08)", color: "primary.main" }}>
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
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(124, 58, 237, 0.08)", color: "primary.main" }}>
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

            {/* Active Content panel */}
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                    Configure Roles & Capabilities
                  </Typography>
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
                </Box>
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
                                    <Chip key={perm} label={perm} size="small" color="primary" variant="outlined" />
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
              </Box>
            )}

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

          </Box> {/* End Main content body */}
        </Box> {/* End Right Area */}
      </Box> {/* End Root flex Box */}
    </ThemeProvider>
  );
}
