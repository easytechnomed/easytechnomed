"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  CircularProgress,
  Alert,
  AlertTitle
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
  Menu as MenuIcon,
  Science as ScienceIcon,
  TrendingUp as TrendingUpIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
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

const PERMISSION_GROUPS = [
  {
    title: "Administrative Access",
    permissions: [
      { value: "ALL", label: "Full Administrator bypass (unrestricted access)" }
    ]
  },
  {
    title: "Dashboard View",
    permissions: [
      { value: "DASHBOARD_VIEW", label: "Access and view the main workspace analytics dashboard" }
    ]
  },
  {
    title: "Registrations & Patient Records",
    permissions: [
      { value: "REGISTRATION_READ", label: "View registration records, patient lists & billing history" },
      { value: "REGISTRATION_WRITE", label: "Create patient registrations, edit records, enter report results & process payments" },
      { value: "REGISTRATION_DELETE", label: "Delete patient registrations" }
    ]
  },
  {
    title: "Tests & Parameter Configuration",
    permissions: [
      { value: "TEST_READ", label: "View baseline tests and pricing" },
      { value: "TEST_WRITE", label: "Add custom tests, modify pricing, and configure baseline parameters" }
    ]
  },
  {
    title: "Workspace Settings & Profiles",
    permissions: [
      { value: "SETTINGS_READ", label: "View workspace settings and office address details" },
      { value: "SETTINGS_WRITE", label: "Modify settings, upload letterhead PDFs, update addresses, and profiles" }
    ]
  },
  {
    title: "Workspace Member Accounts",
    permissions: [
      { value: "MEMBER_READ", label: "View workspace members list and roles list" },
      { value: "MEMBER_WRITE", label: "Create and configure new laboratory admin members" }
    ]
  },
  {
    title: "Referral Doctors Management",
    permissions: [
      { value: "DOCTOR_READ", label: "View referral doctors list and access doctor summaries" },
      { value: "DOCTOR_WRITE", label: "Add and modify doctor referral details" }
    ]
  },
  {
    title: "Onboarding & Portal Approvals",
    permissions: [
      { value: "APPROVAL_READ", label: "View customer portal registration approvals list" },
      { value: "APPROVAL_WRITE", label: "Approve/reject customer registrations and assign roles" }
    ]
  }
];

export default function AdminRolesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal & Form State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, name: "", permissions: [] });

  // Modal & Form State for creating a role
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: "", permissions: [] });

  const handleNewRolePermissionChange = (permValue) => {
    setRoleForm(prev => {
      const isChecked = prev.permissions.includes(permValue);
      const newPermissions = isChecked
        ? prev.permissions.filter(p => p !== permValue)
        : [...prev.permissions, permValue];
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleEditRoleClick = (role) => {
    setEditForm({
      id: role.id,
      name: role.name,
      permissions: [...role.permissions]
    });
    setEditModalOpen(true);
  };

  const handleEditPermissionChange = (permValue) => {
    if (editForm.id === 1) return; // Prevent modifying default Admin role permissions
    setEditForm(prev => {
      const isChecked = prev.permissions.includes(permValue);
      const newPermissions = isChecked
        ? prev.permissions.filter(p => p !== permValue)
        : [...prev.permissions, permValue];
      return { ...prev, permissions: newPermissions };
    });
  };

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
      body: JSON.stringify({ name: roleForm.name, permissions: roleForm.permissions }),
    }).then((r) => r.json());
    if (res.success) {
      toast.success(res.message);
      setRoleModalOpen(false);
      await fetchData();
    } else {
      toast.error(res.error || "Failed to create role.");
    }
    setSubmitting(false);
  };

  // Handle Role Edit Submit
  const handleEditRoleSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name) {
      toast.error("Role name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/adminstration/api/roles/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name, permissions: editForm.permissions }),
      }).then((r) => r.json());
      if (res.success) {
        toast.success(res.message || "Role updated successfully!");
        setEditModalOpen(false);
        fetchData();
      } else {
        toast.error(res.error || "Failed to update role.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating the role.");
    } finally {
      setSubmitting(false);
    }
  };

  // Total stats calculations
  const totalWorkspaces = workspaces.length;
  const totalAdmins = admins.length;
  const totalRegToday = workspaces.reduce((sum, ws) => sum + (ws.stats?.today || 0), 0);

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2.5, md: 4 }, bgcolor: "background.default", overflowY: "auto" }}>

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
        <Grid size={{ xs: 12, sm: 4 }}>
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

        <Grid size={{ xs: 12, sm: 4 }}>
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

        <Grid size={{ xs: 12, sm: 4 }}>
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
      {loading && roles.length === 0 ? (
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
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Table>
              <TableHead sx={{ bgcolor: "background.paper" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: "25%" }}>Role Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "60%" }}>Permissions Granted</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "15%" }} align="center">Actions</TableCell>
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
                    <TableRow
                      key={role.id}
                      hover
                      onClick={() => handleEditRoleClick(role)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {role.name}
                          {role.id === 1 && (
                            <Chip label="System Default" size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {role.permissions.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                              No permissions assigned (Read-only default)
                            </Typography>
                          ) : (
                            role.permissions.map(perm => (
                              <Chip key={perm} label={perm} size="small" color="primary" variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 600 }} />
                            ))
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        {role.id !== 1 ? (
                          <IconButton color="error" onClick={() => handleDeleteRole(role.id)} size="small">
                            <DeleteIcon fontSize="small" />
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
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Select Initial Permissions
            </Typography>
            <Box sx={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2.5, pr: 1 }}>
              {PERMISSION_GROUPS.map((group) => (
                <Box key={group.title}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", display: "block", mb: 1, textTransform: "uppercase", fontSize: "0.7rem" }}>
                    {group.title}
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pl: 1 }}>
                    {group.permissions.map((perm) => {
                      const isChecked = roleForm.permissions.includes(perm.value);
                      return (
                        <FormControlLabel
                          key={perm.value}
                          control={
                            <Checkbox
                              checked={isChecked}
                              onChange={() => handleNewRolePermissionChange(perm.value)}
                              color="primary"
                              size="small"
                              sx={{ py: 0.2 }}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.85rem", color: isChecked ? "primary.main" : "text.primary" }}>
                                {perm.value}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                                {perm.label}
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: "flex-start", m: 0, mb: 0.5 }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
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

      {/* Edit Role Dialog */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editForm.id === 1 ? "View System Default Role" : "Edit Role Capabilities"}
        </DialogTitle>
        <form onSubmit={handleEditRoleSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            {editForm.id === 1 && (
              <Alert severity="info" variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
                <AlertTitle sx={{ fontWeight: 700 }}>Predefined Access Role</AlertTitle>
                This is a system default role. Its capabilities cannot be modified.
              </Alert>
            )}
            <TextField
              label="Role Name"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
              disabled={editForm.id === 1}
              size="small"
              placeholder="e.g. Lab Technician, Report Viewer"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Configure Permissions
            </Typography>
            <Box sx={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2.5, pr: 1 }}>
              {PERMISSION_GROUPS.map((group) => (
                <Box key={group.title}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", display: "block", mb: 1, textTransform: "uppercase", fontSize: "0.7rem" }}>
                    {group.title}
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pl: 1 }}>
                    {group.permissions.map((perm) => {
                      const isChecked = editForm.permissions.includes(perm.value);
                      return (
                        <FormControlLabel
                          key={perm.value}
                          control={
                            <Checkbox
                              checked={isChecked}
                              onChange={() => handleEditPermissionChange(perm.value)}
                              disabled={editForm.id === 1 || submitting}
                              color="primary"
                              size="small"
                              sx={{ py: 0.2 }}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.85rem", color: isChecked ? "primary.main" : "text.primary" }}>
                                {perm.value}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                                {perm.label}
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: "flex-start", m: 0, mb: 0.5 }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setEditModalOpen(false)} variant="outlined" color="inherit" disabled={submitting}>
              Close
            </Button>
            {editForm.id !== 1 && (
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
}
