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
  DialogContentText,
  DialogActions,
  TextField,
  Divider,
  ThemeProvider,
  createTheme,
  CssBaseline,
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
  InputAdornment,
  useMediaQuery,
  Pagination,
  Tooltip
} from "@mui/material";
import {
  ExitToApp as LogoutIcon,
  Business as WorkspaceIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  CloudUpload as UploadIcon,
  Science as ScienceIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Email as EmailIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from "@mui/icons-material";
import { toast } from "sonner";

const drawerWidth = 260;

// Custom light purple theme matching other SuperAdmin pages
const lightPurpleTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#7c3aed",
      light: "#a78bfa",
      dark: "#6d28d9",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f9fafb",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        },
      },
    },
  },
});

export default function LeadsAdminPage() {
  const router = useRouter();
  const currentPath = usePathname();
  const isMdUp = useMediaQuery(lightPurpleTheme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Leads state
  const [leads, setLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Metric stats
  const [emailCount, setEmailCount] = useState(0);
  const [mobileCount, setMobileCount] = useState(0);

  // Deletion state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLeads = async (currentPage = page, query = searchQuery) => {
    setLoading(true);
    try {
      const url = `/adminstration/api/leads?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(query)}`;
      const res = await fetch(url).then((r) => r.json());

      if (!res.success && (res.error === "NEXT_REDIRECT" || res.error === "Unauthorized")) {
        router.push("/adminstration/login");
        return;
      }

      if (res.success) {
        setLeads(res.leads);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.totalCount);

        // Compute local breakdown
        const emailLeads = res.leads.filter(l => l.type === "email").length;
        setEmailCount(emailLeads);
        setMobileCount(res.leads.length - emailLeads);
      } else {
        toast.error(res.error || "Failed to fetch leads.");
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("An error occurred while loading leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset to page 1 on new search query
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchLeads(page);
  }, [page, limit]);

  const handleLogout = async () => {
    try {
      await fetch("/adminstration/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/adminstration/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleDeleteClick = (lead, e) => {
    if (e) e.stopPropagation();
    setLeadToDelete(lead);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/adminstration/api/leads?id=${leadToDelete.id}`, {
        method: "DELETE"
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message || "Lead deleted successfully.");
        setDeleteConfirmOpen(false);
        setLeadToDelete(null);
        fetchLeads();
      } else {
        toast.error(res.error || "Failed to delete lead.");
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("An error occurred while deleting lead.");
    } finally {
      setDeleting(false);
    }
  };

  const menuItems = [
    { text: "Workspace Controller", icon: <WorkspaceIcon />, path: "/adminstration/dashboard?tab=workspaces", index: 0 },
    { text: "Administrators", icon: <PeopleIcon />, path: "/adminstration/dashboard?tab=admins", index: 1 },
    { text: "Admin Roles", icon: <SecurityIcon />, path: "/adminstration/adminRole", index: 2 },
    { text: "Import Lab Tests", icon: <UploadIcon />, path: "/adminstration/dashboard?tab=importer", index: 3 },
    { text: "Default Tests & Params", icon: <ScienceIcon />, path: "/adminstration/test-parameter", index: 4 },
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
          {menuItems.map((item) => (
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
                  color: "text.secondary",
                  "&:hover": {
                    backgroundColor: "rgba(124, 58, 237, 0.04)",
                    color: "primary.main",
                    "& .MuiListItemIcon-root": { color: "primary.main" }
                  },
                  "& .MuiListItemIcon-root": { color: "text.secondary", minWidth: 40 }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: 500, fontSize: "0.9rem" }}
                />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Lead Management Header */}
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
                backgroundColor: currentPath === "/adminstration/leads" ? "rgba(124, 58, 237, 0.08)" : "transparent",
                color: currentPath === "/adminstration/leads" ? "primary.main" : "text.secondary",
                "&:hover": {
                  backgroundColor: "rgba(124, 58, 237, 0.12)",
                  color: "primary.main",
                  "& .MuiListItemIcon-root": { color: "primary.main" }
                },
                "& .MuiListItemIcon-root": { color: currentPath === "/adminstration/leads" ? "primary.main" : "text.secondary", minWidth: 40 }
              }}
            >
              <ListItemIcon><TrendingUpIcon /></ListItemIcon>
              <ListItemText
                primary="Leads"
                primaryTypographyProps={{ fontWeight: currentPath === "/adminstration/leads" ? 700 : 500, fontSize: "0.9rem" }}
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
                backgroundColor: currentPath === "/adminstration/contact" ? "rgba(124, 58, 237, 0.08)" : "transparent",
                color: currentPath === "/adminstration/contact" ? "primary.main" : "text.secondary",
                "&:hover": {
                  backgroundColor: "rgba(124, 58, 237, 0.12)",
                  color: "primary.main",
                  "& .MuiListItemIcon-root": { color: "primary.main" }
                },
                "& .MuiListItemIcon-root": { color: currentPath === "/adminstration/contact" ? "primary.main" : "text.secondary", minWidth: 40 }
              }}
            >
              <ListItemIcon><EmailIcon /></ListItemIcon>
              <ListItemText
                primary="Contact Inquiries"
                primaryTypographyProps={{ fontWeight: currentPath === "/adminstration/contact" ? 700 : 500, fontSize: "0.9rem" }}
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

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", width: { md: `calc(100% - ${drawerWidth}px)` } }}>
          <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
            <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 2, display: { md: "none" } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 800, flexGrow: 1, color: "text.primary" }}>
                Lead Management - Leads
              </Typography>
              <Button
                color="primary"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{ fontWeight: 700 }}
              >
                Logout
              </Button>
            </Toolbar>
          </AppBar>

          <Box sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Metric Summary Cards */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card>
                  <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                        Total Leads
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "text.primary" }}>
                        {totalCount}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "primary.light", color: "primary.main", width: 48, height: 48 }}>
                      <TrendingUpIcon />
                    </Avatar>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card>
                  <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                        Mobile Leads
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "text.primary" }}>
                        {mobileCount}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.08)", color: "#10b981", width: 48, height: 48 }}>
                      <TrendingUpIcon />
                    </Avatar>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card>
                  <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                        Email Leads
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "text.primary" }}>
                        {emailCount}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "rgba(59, 130, 246, 0.08)", color: "#3b82f6", width: 48, height: 48 }}>
                      <EmailIcon />
                    </Avatar>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Table & Search */}
            <Card variant="outlined" sx={{ border: "1px solid rgba(0,0,0,0.06)", bgcolor: "background.paper" }}>
              <Box sx={{ p: 2.5, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                  All Captures
                </Typography>
                <TextField
                  size="small"
                  placeholder="Search contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "text.secondary", fontSize: "1.2rem" }} />
                        </InputAdornment>
                      )
                    }
                  }}
                  sx={{ width: { xs: "100%", sm: 280 } }}
                />
              </Box>
              <Divider />
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="medium">
                  <TableHead sx={{ bgcolor: "#fafafa" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 80 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Contact Detail</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 150 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 220 }}>Captured At</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, width: 100 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <CircularProgress size={30} />
                        </TableCell>
                      </TableRow>
                    ) : leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                          No leads captured yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead, idx) => (
                        <TableRow key={lead.id} hover sx={{ '&:hover': { bgcolor: "rgba(0,0,0,0.01)" } }}>
                          <TableCell sx={{ fontWeight: 600 }}>{(page - 1) * limit + idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>{lead.contact}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "inline-flex",
                                px: 1.5,
                                py: 0.5,
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                bgcolor: lead.type === "email" ? "rgba(59, 130, 246, 0.08)" : "rgba(16, 185, 129, 0.08)",
                                color: lead.type === "email" ? "#3b82f6" : "#10b981"
                              }}
                            >
                              {lead.type}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary" }}>
                            {new Date(lead.createdAt).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Delete Lead" arrow>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => handleDeleteClick(lead, e)}
                              >
                                <DeleteIcon fontSize="small" />
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
                    bgcolor: "#ffffff",
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12,
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
                          backgroundColor: "#ffffff",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "#334155",
                          outline: "none",
                          cursor: "pointer"
                        }}
                      >
                        {[10, 25, 50, 100].map((size) => (
                          <option key={size} value={size}>
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
                          backgroundColor: "#ffffff",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "#334155",
                          outline: "none",
                          cursor: "pointer"
                        }}
                      >
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                          <option key={pNum} value={pNum}>
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
            </Card>
          </Box>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete lead <strong>{leadToDelete?.contact}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
