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
  Pagination
} from "@mui/material";
import {
  ExitToApp as LogoutIcon,
  Business as WorkspaceIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  CloudUpload as UploadIcon,
  Menu as MenuIcon,
  Science as ScienceIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Info as InfoIcon
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

export default function DefaultTestsPage() {
  const router = useRouter();
  const isMdUp = useMediaQuery(lightPurpleTheme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Deletion state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTests = async (currentPage = page, query = searchQuery) => {
    setLoading(true);
    try {
      const url = `/adminstration/api/tests?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(query)}`;
      const res = await fetch(url).then((r) => r.json());

      if (!res.success && (res.error === "NEXT_REDIRECT" || res.error === "Unauthorized")) {
        router.push("/adminstration/login");
        return;
      }

      if (res.success) {
        setTests(res.tests);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.totalCount);
        // Preserve selectedTest reference if it still exists in the fresh list
        if (selectedTest) {
          const freshSelected = res.tests.find((t) => t.id === selectedTest.id);
          setSelectedTest(freshSelected || null);
        }
      } else {
        toast.error(res.error || "Failed to load default tests.");
      }
    } catch (error) {
      console.error("Error fetching default tests:", error);
      toast.error("Failed to load default tests.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page changes
  useEffect(() => {
    fetchTests(page, searchQuery);
  }, [page]);

  // Handle search text changes
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setPage(1); // will trigger page useEffect if page is not 1
    if (page === 1) {
      fetchTests(1, val);
    }
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

  const handleDeleteClick = (test, e) => {
    e.stopPropagation(); // Avoid triggering row selection click
    setTestToDelete(test);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!testToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/adminstration/api/tests/${testToDelete.id}`, {
        method: "DELETE",
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message || "Test deleted successfully.");
        if (selectedTest?.id === testToDelete.id) {
          setSelectedTest(null);
        }
        setDeleteConfirmOpen(false);
        setTestToDelete(null);
        await fetchTests();
      } else {
        toast.error(res.error || "Failed to delete test.");
      }
    } catch (error) {
      console.error("Error deleting test:", error);
      toast.error("An error occurred while deleting the test.");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered tests is now managed server-side

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
          {menuItems.map((item) => {
            const isActive = item.index === 4;
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
                  <ListItemIcon>{item.icon}</ListItemIcon>
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

        {/* Right Content Area */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Header AppBar */}
          <AppBar
            position="static"
            color="inherit"
            elevation={0}
            sx={{ borderBottom: "1px solid", borderColor: "divider" }}
          >
            <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: 3 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={() => setMobileOpen(true)}
                  sx={{ mr: 1, display: { md: "none" } }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap sx={{ fontWeight: 800, color: "text.primary" }}>
                  Default Tests & Parameters
                </Typography>
              </Box>

              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{ borderRadius: 2 }}
              >
                Logout
              </Button>
            </Toolbar>
          </AppBar>

          {/* Main Workspace Body */}
          <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, overflow: "auto" }}>
            {loading && tests.length === 0 ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
                <CircularProgress color="primary" />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {/* Left Side: Test Directory list */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            Global Test Catalog
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Manage default tests automatically copied to new client workspaces.
                          </Typography>
                        </Box>
                      </Box>

                      {/* Search Input */}
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        placeholder="Search test catalog by name or code..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: "text.secondary" }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      {/* Test Catalog Table */}
                      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", maxHeight: "calc(100vh - 280px)" }}>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Test Name</TableCell>
                              <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Code</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Base Price</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "#f8fafc", width: 80 }}>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {tests.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                  No default tests found matching current filters.
                                </TableCell>
                              </TableRow>
                            ) : (
                              tests.map((test) => {
                                const isSelected = selectedTest?.id === test.id;
                                return (
                                  <TableRow
                                    key={test.id}
                                    hover
                                    onClick={() => setSelectedTest(test)}
                                    sx={{
                                      cursor: "pointer",
                                      backgroundColor: isSelected ? "rgba(124, 58, 237, 0.06)" : "transparent",
                                      "&:hover": {
                                        backgroundColor: isSelected ? "rgba(124, 58, 237, 0.1)" : "rgba(0,0,0,0.02)",
                                      },
                                    }}
                                  >
                                    <TableCell sx={{ fontWeight: 600, color: isSelected ? "primary.main" : "text.primary" }}>
                                      {test.name}
                                    </TableCell>
                                    <TableCell sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                                      {test.code || "-"}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 500 }}>
                                      ₹{parseFloat(test.price).toFixed(2)}
                                    </TableCell>
                                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={(e) => handleDeleteClick(test, e)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                          <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(e, val) => setPage(val)}
                            color="primary"
                            size="small"
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Right Side: Parameter Detail Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                  {selectedTest ? (
                    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                        <Box sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                            Selected Test Parameter configuration
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>
                            {selectedTest.name}
                          </Typography>
                          {selectedTest.code && (
                            <Typography variant="caption" sx={{ display: "inline-block", bgcolor: "rgba(0,0,0,0.05)", px: 1, py: 0.2, borderRadius: 1, fontFamily: "monospace", mt: 0.5 }}>
                              Code: {selectedTest.code}
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ flexGrow: 1 }}>
                          {(!selectedTest.parameters || selectedTest.parameters.length === 0) ? (
                            <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                              <InfoIcon sx={{ fontSize: 40, color: "text.secondary", opacity: 0.5 }} />
                              <Typography variant="body2" color="text.secondary" align="center">
                                No clinical parameters defined for this default test.
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Clinical Parameters ({selectedTest.parameters.length})
                              </Typography>
                              
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: "calc(100vh - 280px)", overflowY: "auto", pr: 0.5 }}>
                                {selectedTest.parameters.map((param, index) => (
                                  <Paper
                                    key={param.id}
                                    variant="outlined"
                                    sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc" }}
                                  >
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                                        {index + 1}. {param.name}
                                      </Typography>
                                      {param.unit && (
                                        <Typography variant="caption" sx={{ bgcolor: "primary.light", color: "primary.contrastText", px: 1, py: 0.1, borderRadius: 1, fontWeight: 600 }}>
                                          {param.unit}
                                        </Typography>
                                      )}
                                    </Box>
                                    
                                    <Divider sx={{ my: 1, borderColor: "rgba(0,0,0,0.04)" }} />
                                    
                                    <Grid container spacing={1.5}>
                                      {/* Male Range */}
                                      <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                          Male Range:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {param.normalRangeMale || (param.minValMale !== null || param.maxValMale !== null
                                            ? `${param.minValMale ?? 0} - ${param.maxValMale ?? 0}`
                                            : "N/A")}
                                        </Typography>
                                      </Grid>

                                      {/* Female Range */}
                                      <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                          Female Range:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {param.normalRangeFemale || (param.minValFemale !== null || param.maxValFemale !== null
                                            ? `${param.minValFemale ?? 0} - ${param.maxValFemale ?? 0}`
                                            : "N/A")}
                                        </Typography>
                                      </Grid>

                                      {/* Baby Range */}
                                      <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                          Baby Range:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {param.normalRangeBaby || (param.minValBaby !== null || param.maxValBaby !== null
                                            ? `${param.minValBaby ?? 0} - ${param.maxValBaby ?? 0}`
                                            : "N/A")}
                                        </Typography>
                                      </Grid>

                                      {/* Default Range */}
                                      <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                          Default Range:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {param.normalRangeDefault || "N/A"}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  </Paper>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card sx={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
                      <CardContent sx={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <Box sx={{ p: 2.5, borderRadius: "50%", bgcolor: "rgba(124, 58, 237, 0.06)", color: "primary.main" }}>
                          <ScienceIcon sx={{ fontSize: 40 }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            No Test Selected
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mt: 0.5 }}>
                            Select a default test from the list on the left to inspect its configured parameters and references.
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              </Grid>
            )}
          </Box>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" sx={{ fontWeight: 800 }}>
          Delete Default Test?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the test <strong>{testToDelete?.name}</strong>?
            This action will soft delete the default test and all its associated reference parameters.
            Workspaces created after this deletion will not receive this test.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            color="inherit"
            disabled={deleting}
            variant="text"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            autoFocus
            disabled={deleting}
            variant="contained"
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? "Deleting..." : "Soft Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
