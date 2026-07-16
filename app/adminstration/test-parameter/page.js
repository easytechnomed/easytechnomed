"use client";

import React, { useState, useEffect, useMemo } from "react";
import { debounce } from "../../utils/debounce";
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
  Autocomplete,
  Tooltip
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
  Info as InfoIcon,
  Edit as EditIcon,
  Add as AddIcon,
  DragIndicator as DragIndicatorIcon,
  TrendingUp as TrendingUpIcon,
  Email as EmailIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from "@mui/icons-material";
import { toast } from "sonner";
import EditTestDialog from "./component/EditTestDialog";
import DeleteTestDialog from "./component/DeleteTestDialog";
import EditParamDialog from "./component/EditParamDialog";
import DeleteParamDialog from "./component/DeleteParamDialog";

const drawerWidth = 260;

const COMMON_LAB_UNITS = [
  "g/dL",
  "mg/dL",
  "μg/dL",
  "ng/mL",
  "pg/mL",
  "mIU/L",
  "μIU/mL",
  "mEQ/L",
  "mmol/L",
  "μmol/L",
  "U/L",
  "IU/L",
  "IU/mL",
  "fL",
  "%",
  "cells/cu.mm",
  "million/cu.mm",
  "10^3/µL",
  "10^6/µL",
  "/HPF",
  "/LPF",
  "Ratio",
  "Index",
  "g/L",
  "mg/L"
];

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
  const pathname = usePathname();
  const isMdUp = useMediaQuery(lightPurpleTheme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(true);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchVal, setSearchVal] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Parameter Library Pagination states
  const [paramPage, setParamPage] = useState(1);
  const [paramLimit, setParamLimit] = useState(50); // Default 50 rows per page for parameters

  // Deletion state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);

  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [testToEdit, setTestToEdit] = useState(null);
  const [parameterDictionary, setParameterDictionary] = useState([]);

  // New parameter catalog & merge-delete states
  const [activeTab, setActiveTab] = useState("tests"); // "tests" or "parameters"
  const [paramSearchQuery, setParamSearchQuery] = useState("");
  const [editParamModalOpen, setEditParamModalOpen] = useState(false);
  const [paramToEdit, setParamToEdit] = useState(null);
  const [deleteParamConfirmOpen, setDeleteParamConfirmOpen] = useState(false);
  const [paramToDelete, setParamToDelete] = useState(null);

  // Derive filtered and paginated parameters client-side
  const allFilteredParams = parameterDictionary.filter(p =>
    (p.name || "").toLowerCase().includes(paramSearchQuery.toLowerCase())
  );
  const paramTotalCount = allFilteredParams.length;
  const paramTotalPages = Math.ceil(paramTotalCount / paramLimit) || 1;
  const paginatedParams = allFilteredParams.slice(
    (paramPage - 1) * paramLimit,
    (paramPage - 1) * paramLimit + paramLimit
  );

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

  const fetchParameterDictionary = async () => {
    try {
      const res = await fetch("/adminstration/api/parameters").then((r) => r.json());
      if (res.success) {
        setParameterDictionary(res.parameters || []);
      }
    } catch (err) {
      console.error("Error fetching parameter dictionary:", err);
    }
  };

  // Fetch when page, limit, or searchQuery changes
  useEffect(() => {
    Promise.resolve().then(() => {
      fetchTests(page, searchQuery);
      fetchParameterDictionary();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchQuery]);

  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        Promise.resolve().then(() => {
          setSearchQuery(val);
          setPage(1);
        });
      }, 400),
    []
  );

  // Handle search text changes
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);
    debouncedSearch(val);
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

  const handleEditParamClick = (param, e) => {
    e.stopPropagation();
    setParamToEdit(param);
    setEditParamModalOpen(true);
  };

  const handleAddNewParamClick = () => {
    setParamToEdit(null);
    setEditParamModalOpen(true);
  };

  const handleDeleteParamClick = (param, e) => {
    e.stopPropagation();
    setParamToDelete(param);
    setDeleteParamConfirmOpen(true);
  };

  const handleAddNewClick = () => {
    setTestToEdit(null);
    setEditModalOpen(true);
  };

  const handleEditClick = (test, e) => {
    if (e) e.stopPropagation();
    setTestToEdit(test);
    setEditModalOpen(true);
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
      <Toolbar sx={{ display: "flex", flexDirection: "column", alignItems: desktopDrawerOpen ? "flex-start" : "center", justifyContent: "center", px: desktopDrawerOpen ? 3 : 1, py: 2.5, gap: 0.5 }}>
        {desktopDrawerOpen ? (
          <Box component="img" src="/logo/logobg.png" alt="EasyTechnoMed Logo" sx={{ height: 45, objectFit: "contain" }} />
        ) : (
          <ScienceIcon color="primary" sx={{ fontSize: 32 }} />
        )}
        {desktopDrawerOpen && (
          <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", letterSpacing: "1px", textTransform: "uppercase" }}>
            SuperAdmin Console
          </Typography>
        )}
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
                    px: desktopDrawerOpen ? 2 : 0,
                    justifyContent: desktopDrawerOpen ? "initial" : "center",
                    backgroundColor: isActive ? "rgba(124, 58, 237, 0.08)" : "transparent",
                    color: isActive ? "primary.main" : "text.secondary",
                    "&:hover": {
                      backgroundColor: isActive ? "rgba(124, 58, 237, 0.12)" : "rgba(124, 58, 237, 0.04)",
                      color: isActive ? "primary.main" : "primary.main",
                      "& .MuiListItemIcon-root": {
                        color: "primary.main",
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{
                    color: isActive ? "primary.main" : "text.secondary",
                    minWidth: 0,
                    mr: desktopDrawerOpen ? 2 : 0,
                    justifyContent: "center"
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {desktopDrawerOpen && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "0.9rem",
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}

          {/* Lead Management Group */}
          <Divider sx={{ my: 1.5 }} />
          {desktopDrawerOpen ? (
            <ListItem sx={{ px: 2, pb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "text.disabled", letterSpacing: "1px", textTransform: "uppercase" }}>
                Lead Management
              </Typography>
            </ListItem>
          ) : null}

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={!desktopDrawerOpen ? "Leads" : ""} placement="right" arrow>
              <ListItemButton
                onClick={() => {
                  setMobileOpen(false);
                  router.push("/adminstration/leads");
                }}
                sx={{
                  borderRadius: "8px",
                  py: 1.2,
                  px: desktopDrawerOpen ? 2 : 0,
                  justifyContent: desktopDrawerOpen ? "initial" : "center",
                  backgroundColor: pathname === "/adminstration/leads" ? "rgba(124, 58, 237, 0.08)" : "transparent",
                  color: pathname === "/adminstration/leads" ? "primary.main" : "text.secondary",
                  "&:hover": {
                    backgroundColor: "rgba(124, 58, 237, 0.12)",
                    color: "primary.main",
                    "& .MuiListItemIcon-root": { color: "primary.main" }
                  }
                }}
              >
                <ListItemIcon sx={{
                  color: pathname === "/adminstration/leads" ? "primary.main" : "text.secondary",
                  minWidth: 0,
                  mr: desktopDrawerOpen ? 2 : 0,
                  justifyContent: "center"
                }}>
                  <TrendingUpIcon />
                </ListItemIcon>
                {desktopDrawerOpen && (
                  <ListItemText
                    primary="Leads"
                    primaryTypographyProps={{ fontWeight: pathname === "/adminstration/leads" ? 700 : 500, fontSize: "0.9rem" }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={!desktopDrawerOpen ? "Contact Inquiries" : ""} placement="right" arrow>
              <ListItemButton
                onClick={() => {
                  setMobileOpen(false);
                  router.push("/adminstration/contact");
                }}
                sx={{
                  borderRadius: "8px",
                  py: 1.2,
                  px: desktopDrawerOpen ? 2 : 0,
                  justifyContent: desktopDrawerOpen ? "initial" : "center",
                  backgroundColor: pathname === "/adminstration/contact" ? "rgba(124, 58, 237, 0.08)" : "transparent",
                  color: pathname === "/adminstration/contact" ? "primary.main" : "text.secondary",
                  "&:hover": {
                    backgroundColor: "rgba(124, 58, 237, 0.12)",
                    color: "primary.main",
                    "& .MuiListItemIcon-root": { color: "primary.main" }
                  }
                }}
              >
                <ListItemIcon sx={{
                  color: pathname === "/adminstration/contact" ? "primary.main" : "text.secondary",
                  minWidth: 0,
                  mr: desktopDrawerOpen ? 2 : 0,
                  justifyContent: "center"
                }}>
                  <EmailIcon />
                </ListItemIcon>
                {desktopDrawerOpen && (
                  <ListItemText
                    primary="Contact Inquiries"
                    primaryTypographyProps={{ fontWeight: pathname === "/adminstration/contact" ? 700 : 500, fontSize: "0.9rem" }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 2, bgcolor: "rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: 1.5, justifyContent: desktopDrawerOpen ? "flex-start" : "center" }}>
        <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 40, height: 40, fontWeight: 700 }}>
          S
        </Avatar>
        {desktopDrawerOpen && (
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: "text.primary" }}>
              System Admin
            </Typography>
            <Typography variant="caption" noWrap sx={{ display: "block", color: "text.secondary" }}>
              superadmin@easytechnomed.com
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", width: "100%", maxWidth: "100%", minWidth: 0 }}>
            {loading && tests.length === 0 ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
                <CircularProgress color="primary" />
              </Box>
            ) : (
              <Grid container spacing={3} sx={{ flexGrow: 1, height: "100%", minHeight: 0 }}>
                {/* Left Side: Test Directory list / Parameter Dictionary List */}
                <Grid size={{ xs: 12, md: 6 }} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <Card sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2, height: "100%", overflow: "hidden" }}>
                      
                      {/* Tab switching bar */}
                      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            onClick={() => setActiveTab("tests")}
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.85rem",
                              color: activeTab === "tests" ? "primary.main" : "text.secondary",
                              borderBottom: activeTab === "tests" ? "3px solid" : "none",
                              borderColor: "primary.main",
                              borderRadius: 0,
                              px: 1.5,
                              pb: 1,
                              minWidth: 0
                            }}
                          >
                            Tests Catalog
                          </Button>
                          <Button
                            onClick={() => setActiveTab("parameters")}
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.85rem",
                              color: activeTab === "parameters" ? "primary.main" : "text.secondary",
                              borderBottom: activeTab === "parameters" ? "3px solid" : "none",
                              borderColor: "primary.main",
                              borderRadius: 0,
                              px: 1.5,
                              pb: 1,
                              minWidth: 0
                            }}
                          >
                            Parameters Library
                          </Button>
                        </Box>
                      </Box>

                      {activeTab === "tests" ? (
                        <>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>
                              Default Tests
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1, justifyContent: "flex-end" }}>
                              <TextField
                                size="small"
                                variant="outlined"
                                placeholder="Search tests..."
                                value={searchVal}
                                onChange={handleSearchChange}
                                sx={{ maxWidth: 180, flexGrow: 1 }}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <SearchIcon sx={{ color: "text.secondary" }} />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={handleAddNewClick}
                                sx={{ borderRadius: 2, whiteSpace: "nowrap" }}
                              >
                                Add Test
                              </Button>
                            </Box>
                          </Box>

                          {/* Test Catalog Table */}
                          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", flexGrow: 1, overflowY: "auto", overflowX: "auto", width: "100%", maxWidth: "100%", minWidth: 0 }}>
                            <Table stickyHeader size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc", width: 60 }}>S.No</TableCell>
                                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Test Name</TableCell>
                                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Code</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Base Price</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "#f8fafc", width: 80 }}>Action</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {tests.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                      No default tests found matching current filters.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  tests.map((test, idx) => {
                                    const isSelected = selectedTest?.id === test.id;
                                    const sNo = (page - 1) * limit + idx + 1;
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
                                        <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>{sNo}</TableCell>
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
                                          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                                            <IconButton
                                              size="small"
                                              color="primary"
                                              onClick={(e) => handleEditClick(test, e)}
                                            >
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                              size="small"
                                              color="error"
                                              onClick={(e) => handleDeleteClick(test, e)}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>

                          {/* Custom Pagination Bar for Tests */}
                          {totalCount > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: { xs: "column", sm: "row" },
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: { xs: 2, sm: 0 },
                                pt: 2,
                                mt: 1,
                                borderTop: "1px solid",
                                borderColor: "divider",
                                bgcolor: "#ffffff",
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
                        </>
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, overflow: "hidden" }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>
                              Parameters Library
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1, justifyContent: "flex-end" }}>
                              <TextField
                                size="small"
                                variant="outlined"
                                placeholder="Search parameters..."
                                value={paramSearchQuery}
                                onChange={(e) => {
                                  setParamSearchQuery(e.target.value);
                                  setParamPage(1);
                                }}
                                sx={{ maxWidth: 180, flexGrow: 1 }}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <SearchIcon sx={{ color: "text.secondary" }} />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={handleAddNewParamClick}
                                sx={{ borderRadius: 2, whiteSpace: "nowrap" }}
                              >
                                Add Parameter
                              </Button>
                            </Box>
                          </Box>

                          {/* Parameters Table */}
                          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", flexGrow: 1, overflowY: "auto", overflowX: "auto", width: "100%", maxWidth: "100%", minWidth: 0 }}>
                            <Table stickyHeader size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc", width: 60 }}>S.No</TableCell>
                                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Name</TableCell>
                                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Unit</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "#f8fafc", width: 90 }}>Action</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {paginatedParams.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                      No parameters found matching current search.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  paginatedParams.map((param, idx) => {
                                    const sNo = (paramPage - 1) * paramLimit + idx + 1;
                                    return (
                                      <TableRow key={param.id} hover>
                                        <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>{sNo}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{param.name}</TableCell>
                                      <TableCell sx={{ color: "text.secondary" }}>{param.unit || "-"}</TableCell>
                                      <TableCell align="center">
                                        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={(e) => handleEditParamClick(param, e)}
                                          >
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={(e) => handleDeleteParamClick(param, e)}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              )}
                              </TableBody>
                            </Table>
                          </TableContainer>

                          {/* Custom Pagination Bar for Parameters */}
                          {paramTotalCount > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: { xs: "column", sm: "row" },
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: { xs: 2, sm: 0 },
                                pt: 2,
                                mt: 1,
                                borderTop: "1px solid",
                                borderColor: "divider",
                                bgcolor: "#ffffff",
                              }}
                            >
                              {/* Left Side */}
                              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                                {`${(paramPage - 1) * paramLimit + 1}-${Math.min(paramPage * paramLimit, paramTotalCount)} of ${paramTotalCount}`}
                              </Typography>

                              {/* Right Side Controls */}
                              <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: { xs: 2, sm: 3 } }}>
                                {/* Rows per page */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.82rem" }}>
                                    Rows per page
                                  </Typography>
                                  <select
                                    value={paramLimit}
                                    onChange={(e) => {
                                      setParamLimit(parseInt(e.target.value, 10));
                                      setParamPage(1);
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
                                    value={paramPage}
                                    onChange={(e) => setParamPage(parseInt(e.target.value, 10))}
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
                                    {Array.from({ length: paramTotalPages }, (_, i) => i + 1).map((pNum) => (
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
                                    disabled={paramPage === 1}
                                    onClick={() => setParamPage((prev) => Math.max(prev - 1, 1))}
                                    sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "6px", p: "4px" }}
                                  >
                                    <ChevronLeftIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    disabled={paramPage >= paramTotalPages}
                                    onClick={() => setParamPage((prev) => Math.min(prev + 1, paramTotalPages))}
                                    sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "6px", p: "4px" }}
                                  >
                                    <ChevronRightIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Right Side: Parameter Detail Card */}
                <Grid size={{ xs: 12, md: 6 }} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  {selectedTest ? (
                    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2, height: "100%", overflow: "hidden" }}>
                        <Box sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", minWidth: 0, gap: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flexShrink: 1 }}>
                            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, textOverflow: "ellipsis", overflow: "hidden" }}>
                              {selectedTest.name}
                            </Typography>
                            {selectedTest.code && (
                              <Typography variant="caption" sx={{ bgcolor: "rgba(0,0,0,0.05)", px: 1, py: 0.2, borderRadius: 1, fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>
                                Code: {selectedTest.code}
                              </Typography>
                            )}
                          </Box>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={(e) => handleEditClick(selectedTest, e)}
                            sx={{ borderRadius: 2, flexShrink: 0 }}
                          >
                            Edit Test
                          </Button>
                        </Box>

                        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                          {(!selectedTest.parameters || selectedTest.parameters.length === 0) ? (
                            <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                              <InfoIcon sx={{ fontSize: 40, color: "text.secondary", opacity: 0.5 }} />
                              <Typography variant="body2" color="text.secondary" align="center">
                                No clinical parameters defined for this default test.
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, overflow: "hidden" }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Clinical Parameters ({selectedTest.parameters.length})
                              </Typography>

                              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", flexGrow: 1, overflowY: "auto", overflowX: "auto", width: "100%", maxWidth: "100%", minWidth: 0 }}>
                                <Table stickyHeader size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Name</TableCell>
                                      <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Unit</TableCell>
                                      <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Male Range</TableCell>
                                      <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Female Range</TableCell>
                                      <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Baby Range</TableCell>
                                      <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Default Range</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {selectedTest.parameters.map((param) => {
                                      const maleRange = param.normalRangeMale || (param.minValMale !== null || param.maxValMale !== null
                                        ? `${param.minValMale ?? 0} - ${param.maxValMale ?? 0}`
                                        : "-");
                                      const femaleRange = param.normalRangeFemale || (param.minValFemale !== null || param.maxValFemale !== null
                                        ? `${param.minValFemale ?? 0} - ${param.maxValFemale ?? 0}`
                                        : "-");
                                      const babyRange = param.normalRangeBaby || (param.minValBaby !== null || param.maxValBaby !== null
                                        ? `${param.minValBaby ?? 0} - ${param.maxValBaby ?? 0}`
                                        : "-");

                                      return (
                                        <TableRow key={param.id} hover>
                                          <TableCell sx={{ fontWeight: 600 }}>{param.name}</TableCell>
                                          <TableCell sx={{ color: "text.secondary" }}>{param.unit || "-"}</TableCell>
                                          <TableCell sx={{ fontSize: "0.82rem" }}>{maleRange}</TableCell>
                                          <TableCell sx={{ fontSize: "0.82rem" }}>{femaleRange}</TableCell>
                                          <TableCell sx={{ fontSize: "0.82rem" }}>{babyRange}</TableCell>
                                          <TableCell sx={{ fontSize: "0.82rem" }}>{param.normalRangeDefault || "-"}</TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
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

      {editModalOpen && (
        <EditTestDialog
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          test={testToEdit}
          parameterDictionary={parameterDictionary}
          onSaveSuccess={async (savedTest, isNew) => {
            await fetchTests();
            if (isNew && savedTest) {
              setSelectedTest(savedTest);
            }
          }}
        />
      )}

      {deleteConfirmOpen && (
        <DeleteTestDialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          test={testToDelete}
          onDeleteSuccess={async (deletedTest) => {
            if (selectedTest?.id === deletedTest.id) {
              setSelectedTest(null);
            }
            await fetchTests();
          }}
        />
      )}

      {editParamModalOpen && (
        <EditParamDialog
          open={editParamModalOpen}
          onClose={() => setEditParamModalOpen(false)}
          param={paramToEdit}
          onSaveSuccess={async () => {
            await fetchParameterDictionary();
            await fetchTests(); // Refresh tests to sync changes
          }}
        />
      )}

      {deleteParamConfirmOpen && (
        <DeleteParamDialog
          open={deleteParamConfirmOpen}
          onClose={() => setDeleteParamConfirmOpen(false)}
          param={paramToDelete}
          parameterDictionary={parameterDictionary}
          onDeleteSuccess={async () => {
            await fetchParameterDictionary();
            await fetchTests(); // Refresh tests since mappings might have changed
          }}
        />
      )}
    </>
  );
}
