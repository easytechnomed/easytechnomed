"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  useMediaQuery
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
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  Science as ScienceIcon,
  TrendingUp as TrendingUpIcon,
  Email as EmailIcon
} from "@mui/icons-material";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const drawerWidth = 260;

// Custom light purple theme for superadmin dashboard (makeover matching standard admin UI style)
const lightPurpleTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#7c3aed", // Purple 600
      light: "#c084fc", // Purple 400
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
  { value: "ALL", label: "Full Administrator bypass (unrestricted access)" },
  { value: "REGISTRATION_READ", label: "View registration records, patient lists & billing history" },
  { value: "REGISTRATION_WRITE", label: "Create patient registrations, edit records, enter report results & process payments" },
  { value: "REGISTRATION_DELETE", label: "Delete patient registrations" },
  { value: "TEST_READ", label: "View baseline tests and pricing" },
  { value: "TEST_WRITE", label: "Add custom tests, modify pricing, and configure baseline parameters" },
  { value: "SETTINGS_READ", label: "View workspace settings and office address details" },
  { value: "SETTINGS_WRITE", label: "Modify settings, upload letterhead PDFs, update addresses, and profiles" },
  { value: "MEMBER_READ", label: "View workspace members list and roles list" },
  { value: "MEMBER_WRITE", label: "Create and configure new laboratory admin members" },
  { value: "DOCTOR_READ", label: "View referral doctors list and access doctor summaries" },
  { value: "DOCTOR_WRITE", label: "Add and modify doctor referral details" },
  { value: "APPROVAL_READ", label: "View customer portal registration approvals list" },
  { value: "APPROVAL_WRITE", label: "Approve/reject customer registrations and assign roles" },
];

function SuperAdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tab = searchParams.get("tab");

  const [tabValue, setTabValue] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync tabValue with query parameter
  useEffect(() => {
    if (tab === "admins") {
      setTabValue(1);
    } else if (tab === "importer") {
      setTabValue(3);
    } else {
      setTabValue(0);
    }
  }, [tab]);
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

  // Import tests state
  const [importWorkspaceId, setImportWorkspaceId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [excelDataRows, setExcelDataRows] = useState([]);
  const [mappedFields, setMappedFields] = useState({ name: "", code: "", price: "" });
  const [importStep, setImportStep] = useState(1);
  const [importingProgress, setImportingProgress] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          toast.error("The uploaded file is empty.");
          return;
        }
        
        const headers = jsonData[0].map(h => String(h || "").trim()).filter(Boolean);
        setExcelHeaders(headers);
        setExcelDataRows(jsonData.slice(1));
        
        // Auto-detect mappings based on header name
        const detected = { name: "", code: "", price: "" };
        headers.forEach(h => {
          const lower = h.toLowerCase();
          if (lower.includes("name") || lower.includes("test")) {
            detected.name = h;
          } else if (lower.includes("code") || lower.includes("id")) {
            detected.code = h;
          } else if (lower.includes("price") || lower.includes("rate") || lower.includes("charge") || lower.includes("cost")) {
            detected.price = h;
          }
        });
        setMappedFields(detected);
        setImportStep(2); // Go to step 2 (Column Mapping)
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse the Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = async () => {
    if (importWorkspaceId === "") {
      toast.error("Please select a target workspace.");
      setImportStep(1);
      return;
    }

    setImportingProgress(true);
    
    // Map headers index
    const nameColIdx = excelHeaders.indexOf(mappedFields.name);
    const codeColIdx = mappedFields.code ? excelHeaders.indexOf(mappedFields.code) : -1;
    const priceColIdx = excelHeaders.indexOf(mappedFields.price);

    const formattedTests = excelDataRows.map(row => {
      const name = nameColIdx !== -1 ? String(row[nameColIdx] || "").trim() : "";
      const code = codeColIdx !== -1 ? String(row[codeColIdx] || "").trim() : "";
      const price = priceColIdx !== -1 ? String(row[priceColIdx] || "").trim() : "";
      return { name, code, price };
    }).filter(t => t.name !== ""); // filter empty rows

    try {
      const res = await fetch("/adminstration/api/tests/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: importWorkspaceId === "global" ? null : importWorkspaceId,
          tests: formattedTests
        })
      }).then(r => r.json());

      if (res.success) {
        setImportResult(res);
        setImportStep(4);
        toast.success(`Successfully imported tests!`);
      } else {
        toast.error(res.error || "Failed to import tests.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during the import.");
    } finally {
      setImportingProgress(false);
    }
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

  const menuItems = [
    { text: "Workspace Controller", icon: <WorkspaceIcon />, tabIndex: 0 },
    { text: "Administrators", icon: <PeopleIcon />, tabIndex: 1 },
    { text: "Admin Roles", icon: <SecurityIcon />, tabIndex: 2 },
    { text: "Import Lab Tests", icon: <UploadIcon />, tabIndex: 3 },
    { text: "Default Tests & Params", icon: <ScienceIcon />, tabIndex: 4 },
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
            const isActive = tabValue === item.tabIndex;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    setMobileOpen(false);
                    if (item.tabIndex === 2) {
                      router.push("/adminstration/adminRole");
                    } else if (item.tabIndex === 4) {
                      router.push("/adminstration/test-parameter");
                    } else {
                      const paths = {
                        0: "/adminstration/dashboard?tab=workspaces",
                        1: "/adminstration/dashboard?tab=admins",
                        3: "/adminstration/dashboard?tab=importer"
                      };
                      router.push(paths[item.tabIndex]);
                    }
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

          {/* Lead Management Group */}
          <Divider sx={{ my: 1.5 }} />
          <ListItem sx={{ px: 2, pb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.disabled", letterSpacing: "1px", textTransform: "uppercase" }}>
              Lead Management
            </Typography>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                setMobileOpen(false);
                router.push("/adminstration/leads");
              }}
              sx={{
                borderRadius: "8px",
                py: 1.2,
                px: 2,
                backgroundColor: pathname === "/adminstration/leads" ? "rgba(124, 58, 237, 0.08)" : "transparent",
                color: pathname === "/adminstration/leads" ? "primary.main" : "text.secondary",
                "&:hover": {
                  backgroundColor: "rgba(124, 58, 237, 0.12)",
                  color: "primary.main",
                  "& .MuiListItemIcon-root": { color: "primary.main" }
                },
                "& .MuiListItemIcon-root": { color: pathname === "/adminstration/leads" ? "primary.main" : "text.secondary", minWidth: 40 }
              }}
            >
              <ListItemIcon><TrendingUpIcon /></ListItemIcon>
              <ListItemText
                primary="Leads"
                primaryTypographyProps={{ fontWeight: pathname === "/adminstration/leads" ? 700 : 500, fontSize: "0.9rem" }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                setMobileOpen(false);
                router.push("/adminstration/contact");
              }}
              sx={{
                borderRadius: "8px",
                py: 1.2,
                px: 2,
                backgroundColor: pathname === "/adminstration/contact" ? "rgba(124, 58, 237, 0.08)" : "transparent",
                color: pathname === "/adminstration/contact" ? "primary.main" : "text.secondary",
                "&:hover": {
                  backgroundColor: "rgba(124, 58, 237, 0.12)",
                  color: "primary.main",
                  "& .MuiListItemIcon-root": { color: "primary.main" }
                },
                "& .MuiListItemIcon-root": { color: pathname === "/adminstration/contact" ? "primary.main" : "text.secondary", minWidth: 40 }
              }}
            >
              <ListItemIcon><EmailIcon /></ListItemIcon>
              <ListItemText
                primary="Contact Inquiries"
                primaryTypographyProps={{ fontWeight: pathname === "/adminstration/contact" ? 700 : 500, fontSize: "0.9rem" }}
              />
            </ListItemButton>
          </ListItem>
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
                  {menuItems[tabValue]?.text}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {/* Purple text header display showing System Admin */}
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
                Welcome back, System Admin!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Here is the current overview of your laboratory operations, workspaces, and accounts.
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
              <>
                {/* WORKSPACES TAB */}
                {tabValue === 0 && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                        Registered Workspaces (Labs)
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setWorkspaceModalOpen(true)}
                        sx={{ fontWeight: 600 }}
                      >
                        New Workspace
                      </Button>
                    </Box>
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
                  </Box>
                )}

                {/* ADMINS TAB */}
                {tabValue === 1 && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                        Workspace Administrators
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setAdminModalOpen(true)}
                        sx={{ fontWeight: 600 }}
                      >
                        New Admin Account
                      </Button>
                    </Box>
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
                                  <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 32, height: 32, fontSize: "0.85rem" }}>
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
                  </Box>
                )}

                {/* ROLES TAB */}
                {tabValue === 2 && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                        Workspace Roles & Permissions
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

                {/* IMPORT TESTS TAB */}
                {tabValue === 3 && (
                  <Box sx={{ maxWidth: 800, mx: "auto", mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                      Excel Bulk Lab Test Importer
                    </Typography>
                    <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: "background.paper", p: 3 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
                        🧪 Import Tests from Excel
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Bulk upload new tests and update prices in one go. Upload an Excel or CSV file, map the columns, preview the results in real-time, and import.
                      </Typography>

                      {/* Step indicators */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4, px: 2 }}>
                        {[
                          { label: "1. Upload File", active: importStep === 1, done: importStep > 1 },
                          { label: "2. Column Mapping", active: importStep === 2, done: importStep > 2 },
                          { label: "3. Preview Data", active: importStep === 3, done: importStep > 3 },
                          { label: "4. Done", active: importStep === 4, done: importStep > 4 }
                        ].map((step, idx) => (
                          <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                fontSize: "0.825rem",
                                fontWeight: 700,
                                bgcolor: step.active ? "primary.main" : step.done ? "success.main" : "rgba(0,0,0,0.06)",
                                color: step.active || step.done ? "#ffffff" : "text.secondary"
                              }}
                            >
                              {idx + 1}
                            </Avatar>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: step.active || step.done ? 700 : 500,
                                color: step.active ? "primary.main" : step.done ? "success.main" : "text.secondary",
                                display: { xs: "none", sm: "block" }
                              }}
                            >
                              {step.label}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      <Divider sx={{ mb: 4 }} />

                      {/* STEP 1: SELECT WORKSPACE & FILE */}
                      {importStep === 1 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel shrink>Target Workspace (Lab)</InputLabel>
                            <Select
                              value={importWorkspaceId}
                              onChange={(e) => setImportWorkspaceId(e.target.value)}
                              displayEmpty
                              notched
                            >
                              <MenuItem value="" disabled>Select target laboratory...</MenuItem>
                              <MenuItem value="global" sx={{ fontWeight: 700, color: "primary.main" }}>[GLOBAL TEMPLATE] Add to global default tests</MenuItem>
                              {workspaces.map((ws) => (
                                <MenuItem key={ws.id} value={ws.id}>
                                  {ws.name} (/{ws.slug})
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <Box
                            sx={{
                              border: "2px dashed",
                              borderColor: "divider",
                              borderRadius: 3,
                              p: 4,
                              textAlign: "center",
                              bgcolor: "rgba(0,0,0,0.01)",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              "&:hover": {
                                borderColor: "primary.main",
                                bgcolor: "rgba(124, 58, 237, 0.02)"
                              }
                            }}
                            component="label"
                          >
                            <input
                              type="file"
                              accept=".xlsx, .xls, .csv"
                              style={{ display: "none" }}
                              onChange={handleFileChange}
                              onClick={(e) => { e.target.value = null; }}
                            />
                            <UploadIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                              Click to upload test directory file
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Supports Excel files (.xlsx, .xls) and CSV sheets
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* STEP 2: COLUMN MAPPING */}
                      {importStep === 2 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Map columns from your Excel sheet to lab database fields:
                          </Typography>

                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}>
                              <FormControl fullWidth size="small">
                                <InputLabel shrink>Test Name *</InputLabel>
                                <Select
                                  value={mappedFields.name}
                                  onChange={(e) => setMappedFields(prev => ({ ...prev, name: e.target.value }))}
                                  displayEmpty
                                  notched
                                >
                                  <MenuItem value="" disabled>Select column...</MenuItem>
                                  {excelHeaders.map((h) => (
                                    <MenuItem key={h} value={h}>{h}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                              <FormControl fullWidth size="small">
                                <InputLabel shrink>Test Code / ID (Optional)</InputLabel>
                                <Select
                                  value={mappedFields.code}
                                  onChange={(e) => setMappedFields(prev => ({ ...prev, code: e.target.value }))}
                                  displayEmpty
                                  notched
                                >
                                  <MenuItem value="">[Auto-Generate Codes]</MenuItem>
                                  {excelHeaders.map((h) => (
                                    <MenuItem key={h} value={h}>{h}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                              <FormControl fullWidth size="small">
                                <InputLabel shrink>Base Price (INR) *</InputLabel>
                                <Select
                                  value={mappedFields.price}
                                  onChange={(e) => setMappedFields(prev => ({ ...prev, price: e.target.value }))}
                                  displayEmpty
                                  notched
                                >
                                  <MenuItem value="" disabled>Select column...</MenuItem>
                                  {excelHeaders.map((h) => (
                                    <MenuItem key={h} value={h}>{h}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                          </Grid>

                          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                            <Button variant="outlined" onClick={() => setImportStep(1)}>
                              Back
                            </Button>
                            <Button
                              variant="contained"
                              disabled={!mappedFields.name || !mappedFields.price}
                              onClick={() => setImportStep(3)}
                            >
                              Preview Data
                            </Button>
                          </Box>
                        </Box>
                      )}

                      {/* STEP 3: PREVIEW DATA */}
                      {importStep === 3 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Previewing first 5 rows to verify mappings:
                          </Typography>

                          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                              <TableHead sx={{ bgcolor: "background.paper" }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 700 }}>Row</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>Test Name</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {excelDataRows.slice(0, 5).map((row, idx) => {
                                  const getValue = (field) => {
                                    const headerName = mappedFields[field];
                                    if (!headerName) return null;
                                    const colIdx = excelHeaders.indexOf(headerName);
                                    return colIdx !== -1 ? String(row[colIdx] || "").trim() : null;
                                  };

                                  const testName = getValue("name");
                                  const testCode = getValue("code");
                                  const testPrice = getValue("price");

                                  return (
                                    <TableRow key={idx}>
                                      <TableCell>{idx + 1}</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>
                                        {testName !== null ? (testName || <span style={{ color: "#ef4444" }}>[Empty Value]</span>) : <span style={{ color: "rgba(0,0,0,0.3)", fontStyle: "italic" }}>[Not Mapped]</span>}
                                      </TableCell>
                                      <TableCell sx={{ color: "text.secondary" }}>
                                        {mappedFields.code === "" ? (
                                          <span style={{ color: "#7c3aed", fontStyle: "italic" }}>[Auto-Gen e.g. CBC100]</span>
                                        ) : (
                                          testCode !== null ? (testCode || <span style={{ color: "#ef4444" }}>[Empty Value]</span>) : <span style={{ color: "rgba(0,0,0,0.3)", fontStyle: "italic" }}>[Not Mapped]</span>
                                        )}
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>
                                        {testPrice !== null ? (
                                          testPrice && !isNaN(parseFloat(testPrice)) ? `₹${parseFloat(testPrice).toFixed(2)}` : <span style={{ color: "#ef4444" }}>[Invalid Value]</span>
                                        ) : <span style={{ color: "rgba(0,0,0,0.3)", fontStyle: "italic" }}>[Not Mapped]</span>}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>

                          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                            <Button variant="outlined" onClick={() => setImportStep(2)} disabled={importingProgress}>
                              Back
                            </Button>
                            <Button
                              variant="contained"
                              color="success"
                              disabled={!mappedFields.name || !mappedFields.price || importingProgress}
                              onClick={handleExecuteImport}
                              startIcon={importingProgress ? <CircularProgress size={16} color="inherit" /> : null}
                            >
                              {importingProgress ? "Importing..." : "Start Import"}
                            </Button>
                          </Box>
                        </Box>
                      )}

                      {/* STEP 4: IMPORT RESULTS */}
                      {importStep === 4 && importResult && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, textAlign: "center" }}>
                          <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                            {importResult.errors && importResult.errors.length > 0 ? (
                              <ErrorIcon color="warning" sx={{ fontSize: 64 }} />
                            ) : (
                              <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
                            )}
                          </Box>

                          <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            {importResult.errors && importResult.errors.length > 0 ? "Import Completed with Warnings" : "Import Completed Successfully!"}
                          </Typography>

                          <Grid container spacing={3} sx={{ mt: 1, mb: 2 }}>
                            <Grid item xs={6}>
                              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(124, 58, 237, 0.04)" }}>
                                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800 }}>
                                  {importResult.createdCount}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Tests Created
                                </Typography>
                              </Card>
                            </Grid>
                            <Grid item xs={6}>
                              <Card variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(34, 197, 94, 0.04)" }}>
                                <Typography variant="h4" color="success.main" sx={{ fontWeight: 800 }}>
                                  {importResult.updatedCount}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Tests Updated / Repriced
                                </Typography>
                              </Card>
                            </Grid>
                          </Grid>

                          {importResult.errors && importResult.errors.length > 0 && (
                            <Box sx={{ textAlign: "left" }}>
                              <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 700, mb: 1 }}>
                                Warnings / Skip Logs ({importResult.errors.length}):
                              </Typography>
                              <Paper variant="outlined" sx={{ p: 2, maxHeight: 150, overflowY: "auto", bgcolor: "rgba(0, 0, 0, 0.03)", borderRadius: 2 }}>
                                {importResult.errors.map((err, index) => (
                                  <Typography key={index} variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                                    • {err}
                                  </Typography>
                                ))}
                              </Paper>
                            </Box>
                          )}

                          <Box sx={{ mt: 3 }}>
                            <Button
                              variant="contained"
                              onClick={() => {
                                setImportStep(1);
                                setSelectedFile(null);
                                setExcelHeaders([]);
                                setExcelDataRows([]);
                                setMappedFields({ name: "", code: "", price: "" });
                                setImportResult(null);
                                fetchData(); // Reload workspaces stats
                              }}
                            >
                              Import Another File
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Card>
                  </Box>
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

          </Box> {/* End Main content body */}
        </Box> {/* End Right Area */}
      </Box> {/* End Root flex Box */}
    </ThemeProvider>
  );
}

export default function SuperAdminDashboardPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: "#f8fafc" }}>
        <CircularProgress color="primary" />
      </Box>
    }>
      <SuperAdminDashboard />
    </Suspense>
  );
}
