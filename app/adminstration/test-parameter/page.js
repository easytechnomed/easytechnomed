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
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, name: "", code: "", price: "", parameters: [] });
  const [initialParameters, setInitialParameters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [parameterDictionary, setParameterDictionary] = useState([]);
  const [draggedKey, setDraggedKey] = useState(null);

  // New parameter catalog & merge-delete states
  const [activeTab, setActiveTab] = useState("tests"); // "tests" or "parameters"
  const [paramSearchQuery, setParamSearchQuery] = useState("");
  const [editParamModalOpen, setEditParamModalOpen] = useState(false);
  const [editParamForm, setEditParamForm] = useState({
    id: null, name: "", unit: "",
    minValMale: "", maxValMale: "", normalRangeMale: "",
    minValFemale: "", maxValFemale: "", normalRangeFemale: "",
    minValBaby: "", maxValBaby: "", normalRangeBaby: "",
    normalRangeDefault: ""
  });
  const [deleteParamConfirmOpen, setDeleteParamConfirmOpen] = useState(false);
  const [paramToDelete, setParamToDelete] = useState(null);
  const [paramUsages, setParamUsages] = useState([]);
  const [mergeTargetParamId, setMergeTargetParamId] = useState("");
  const [loadingUsages, setLoadingUsages] = useState(false);

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

  const handleDragStart = (e, key) => {
    setDraggedKey(key);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedKey(null);
  };

  const handleDragOver = (e, targetIndex) => {
    e.preventDefault();

    // Auto-scroll the TableContainer when dragging near boundaries
    const container = e.currentTarget.closest(".MuiTableContainer-root");
    if (container) {
      const rect = container.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;

      if (relativeY < 60) {
        container.scrollTop -= 12;
      } else if (rect.bottom - e.clientY < 60) {
        container.scrollTop += 12;
      }
    }

    if (draggedKey === null) return;

    setEditForm((prev) => {
      const sourceIndex = prev.parameters.findIndex((p) => p.key === draggedKey);
      if (sourceIndex === -1 || sourceIndex === targetIndex) return prev;

      const updatedParams = [...prev.parameters];
      const [movedParam] = updatedParams.splice(sourceIndex, 1);
      updatedParams.splice(targetIndex, 0, movedParam);

      // Auto adjust order sequence based on index (1-based index)
      const reSequencedParams = updatedParams.map((param, idx) => ({
        ...param,
        order: (idx + 1).toString()
      }));

      return {
        ...prev,
        parameters: reSequencedParams
      };
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedKey(null);
  };

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

  // Prevent text selection across the page while dragging parameter rows
  useEffect(() => {
    const handleSelectStart = (e) => {
      if (draggedKey !== null) {
        e.preventDefault();
      }
    };
    window.addEventListener("selectstart", handleSelectStart);
    return () => {
      window.removeEventListener("selectstart", handleSelectStart);
    };
  }, [draggedKey]);

  // Fetch when page or limit changes
  useEffect(() => {
    fetchTests(page, searchQuery);
    fetchParameterDictionary();
  }, [page, limit]);

  // Reset parameter page when search query or page limit changes
  useEffect(() => {
    setParamPage(1);
  }, [paramSearchQuery, paramLimit]);

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

  const handleEditParamClick = (param, e) => {
    e.stopPropagation();
    setEditParamForm({
      id: param.id,
      name: param.name || "",
      unit: param.unit || "",
      minValMale: param.minValMale !== null && param.minValMale !== undefined ? param.minValMale.toString() : "",
      maxValMale: param.maxValMale !== null && param.maxValMale !== undefined ? param.maxValMale.toString() : "",
      normalRangeMale: param.normalRangeMale || "",
      minValFemale: param.minValFemale !== null && param.minValFemale !== undefined ? param.minValFemale.toString() : "",
      maxValFemale: param.maxValFemale !== null && param.maxValFemale !== undefined ? param.maxValFemale.toString() : "",
      normalRangeFemale: param.normalRangeFemale || "",
      minValBaby: param.minValBaby !== null && param.minValBaby !== undefined ? param.minValBaby.toString() : "",
      maxValBaby: param.maxValBaby !== null && param.maxValBaby !== undefined ? param.maxValBaby.toString() : "",
      normalRangeBaby: param.normalRangeBaby || "",
      normalRangeDefault: param.normalRangeDefault || ""
    });
    setEditParamModalOpen(true);
  };

  const handleSaveParamEdit = async (e) => {
    e.preventDefault();
    if (!editParamForm.name.trim()) {
      toast.error("Parameter name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/adminstration/api/parameters/${editParamForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editParamForm)
      }).then(r => r.json());

      if (res.success) {
        toast.success(res.message || "Parameter updated successfully.");
        setEditParamModalOpen(false);
        await fetchParameterDictionary();
        await fetchTests(); // Refresh tests to sync changes
      } else {
        toast.error(res.error || "Failed to update parameter.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParamClick = async (param, e) => {
    e.stopPropagation();
    setParamToDelete(param);
    setLoadingUsages(true);
    setParamUsages([]);
    setMergeTargetParamId("");
    setDeleteParamConfirmOpen(true);
    try {
      const res = await fetch(`/adminstration/api/parameters/${param.id}/usages`).then(r => r.json());
      if (res.success) {
        setParamUsages(res.tests || []);
      } else {
        toast.error("Failed to load parameter usage links.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading usages.");
    } finally {
      setLoadingUsages(false);
    }
  };

  const handleConfirmDeleteParam = async () => {
    if (!paramToDelete) return;
    setDeleting(true);
    try {
      let res;
      if (paramUsages.length > 0) {
        if (!mergeTargetParamId) {
          toast.error("Please select a target parameter to merge/re-map references.");
          setDeleting(false);
          return;
        }
        res = await fetch(`/adminstration/api/parameters/${paramToDelete.id}/merge-delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetParameterId: mergeTargetParamId })
        }).then(r => r.json());
      } else {
        res = await fetch(`/adminstration/api/parameters/${paramToDelete.id}`, {
          method: "DELETE"
        }).then(r => r.json());
      }

      if (res.success) {
        toast.success(res.message || "Parameter deleted successfully.");
        setDeleteParamConfirmOpen(false);
        setParamToDelete(null);
        await fetchParameterDictionary();
        await fetchTests(); // Refresh tests since mappings might have changed
      } else {
        toast.error(res.error || "Failed to delete parameter.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddNewClick = () => {
    setEditForm({
      id: null,
      name: "",
      code: "",
      price: "0.00",
      parameters: []
    });
    setInitialParameters([]);
    setEditModalOpen(true);
  };

  const handleEditClick = (test, e) => {
    if (e) e.stopPropagation();
    const paramsCopy = test.parameters ? test.parameters.map((p, index) => ({
      key: p.id || `param-${Date.now()}-${index}-${Math.random()}`,
      id: p.id,
      name: p.name || "",
      unit: p.unit || "",
      order: p.order?.toString() || "1",
      minValMale: p.minValMale !== null ? p.minValMale.toString() : "",
      maxValMale: p.maxValMale !== null ? p.maxValMale.toString() : "",
      normalRangeMale: p.normalRangeMale || "",
      minValFemale: p.minValFemale !== null ? p.minValFemale.toString() : "",
      maxValFemale: p.maxValFemale !== null ? p.maxValFemale.toString() : "",
      normalRangeFemale: p.normalRangeFemale || "",
      minValBaby: p.minValBaby !== null ? p.minValBaby.toString() : "",
      maxValBaby: p.maxValBaby !== null ? p.maxValBaby.toString() : "",
      normalRangeBaby: p.normalRangeBaby || "",
      normalRangeDefault: p.normalRangeDefault || ""
    })) : [];

    setEditForm({
      id: test.id,
      name: test.name,
      code: test.code || "",
      price: test.price.toString(),
      parameters: paramsCopy
    });
    setInitialParameters(paramsCopy);
    setEditModalOpen(true);
  };

  const handleAddParamRow = () => {
    const lastParam = editForm.parameters[editForm.parameters.length - 1];
    const defaultUnit = lastParam ? (lastParam.unit || "") : "";

    setEditForm(prev => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        {
          key: `new-${Date.now()}-${Math.random()}`,
          name: "",
          unit: defaultUnit,
          order: (prev.parameters.length + 1).toString(),
          minValMale: "",
          maxValMale: "",
          normalRangeMale: "",
          minValFemale: "",
          maxValFemale: "",
          normalRangeFemale: "",
          minValBaby: "",
          maxValBaby: "",
          normalRangeBaby: "",
          normalRangeDefault: ""
        }
      ]
    }));
  };

  const handleRemoveParamRow = (index) => {
    setEditForm(prev => {
      const filtered = prev.parameters.filter((_, idx) => idx !== index);
      const reSequenced = filtered.map((param, idx) => ({
        ...param,
        order: (idx + 1).toString()
      }));
      return {
        ...prev,
        parameters: reSequenced
      };
    });
  };

  const handleParamChange = (index, field, value) => {
    setEditForm(prev => {
      const updatedParams = [...prev.parameters];
      updatedParams[index] = { ...updatedParams[index], [field]: value };
      return { ...prev, parameters: updatedParams };
    });
  };

  const handleParamNameSelect = (index, name) => {
    if (!name) return;

    // Find the parameter template in our dictionary
    const template = parameterDictionary.find(
      (p) => p.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (template) {
      setEditForm((prev) => {
        const newParams = [...prev.parameters];
        newParams[index] = {
          ...newParams[index],
          name: template.name,
          unit: template.unit || "",
          minValMale: template.minValMale !== null ? template.minValMale.toString() : "",
          maxValMale: template.maxValMale !== null ? template.maxValMale.toString() : "",
          normalRangeMale: template.normalRangeMale || "",
          minValFemale: template.minValFemale !== null ? template.minValFemale.toString() : "",
          maxValFemale: template.maxValFemale !== null ? template.maxValFemale.toString() : "",
          normalRangeFemale: template.normalRangeFemale || "",
          minValBaby: template.minValBaby !== null ? template.minValBaby.toString() : "",
          maxValBaby: template.maxValBaby !== null ? template.maxValBaby.toString() : "",
          normalRangeBaby: template.normalRangeBaby || "",
          normalRangeDefault: template.normalRangeDefault || "",
        };
        return { ...prev, parameters: newParams };
      });
    } else {
      handleParamChange(index, "name", name);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name) {
      toast.error("Test name is required.");
      return;
    }
    if (!editForm.price || isNaN(parseFloat(editForm.price))) {
      toast.error("Valid test price is required.");
      return;
    }

    setSaving(true);
    try {
      const isNew = editForm.id === null;
      const url = isNew ? "/adminstration/api/tests" : `/adminstration/api/tests/${editForm.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          code: editForm.code,
          price: editForm.price,
          parameters: editForm.parameters
        })
      }).then(r => r.json());

      if (res.success) {
        toast.success(res.message || (isNew ? "Test created successfully!" : "Test updated successfully!"));
        setEditModalOpen(false);
        await fetchTests();
        if (isNew && res.test) {
          setSelectedTest(res.test);
        }
      } else {
        toast.error(res.error || `Failed to ${isNew ? "create" : "update"} test.`);
      }
    } catch (error) {
      console.error("Error saving test:", error);
      toast.error("An error occurred while saving.");
    } finally {
      setSaving(false);
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
    <ThemeProvider theme={lightPurpleTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex", height: "100dvh", overflow: "hidden", bgcolor: "background.default" }}>

        {/* Sidebar Navigation */}
        <Box
          component="nav"
          sx={{
            width: { md: desktopDrawerOpen ? drawerWidth : 70 },
            flexShrink: { md: 0 },
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          }}
        >
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
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: desktopDrawerOpen ? drawerWidth : 70,
                borderRight: "1px solid",
                borderColor: "divider",
                transition: (theme) =>
                  theme.transitions.create("width", {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                overflowX: "hidden",
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Right Content Area */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            height: "100%",
            overflow: "hidden",
            width: `calc(100% - ${desktopDrawerOpen ? drawerWidth : 70}px)`,
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          }}
        >
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
                <IconButton
                  color="inherit"
                  onClick={() => setDesktopDrawerOpen(!desktopDrawerOpen)}
                  sx={{ mr: 1, display: { xs: "none", md: "inline-flex" } }}
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
          <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, overflow: "hidden", display: "flex", flexDirection: "column" }}>
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
                                value={searchQuery}
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
                          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", flexGrow: 1, overflowY: "auto" }}>
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
                            <TextField
                              size="small"
                              variant="outlined"
                              placeholder="Search parameters..."
                              value={paramSearchQuery}
                              onChange={(e) => setParamSearchQuery(e.target.value)}
                              sx={{ maxWidth: 220, flexGrow: 1 }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <SearchIcon sx={{ color: "text.secondary" }} />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Box>

                          {/* Parameters Table */}
                          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", flexGrow: 1, overflowY: "auto" }}>
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

                              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", flexGrow: 1, overflowY: "auto" }}>
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
        </Box>
      </Box>

      {/* Edit Test & Parameters Dialog */}
      <Dialog
        open={editModalOpen}
        onClose={() => !saving && setEditModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }
        }}
      >
        <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, flexGrow: 1, overflowY: "auto" }}>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Test Metadata
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Test Name *"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Test Code"
                    value={editForm.code}
                    onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Base Price (₹) *"
                    type="number"
                    inputProps={{ step: "0.01" }}
                    value={editForm.price}
                    onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>

              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto", maxHeight: "330px" }}>
                <Table size="small" stickyHeader sx={{ minWidth: 2000 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 700, width: 30, bgcolor: "#f8fafc" }}></TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, width: 40, bgcolor: "#f8fafc" }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 260, bgcolor: "#f8fafc" }}>Parameter Name *</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 170, bgcolor: "#f8fafc" }}>Unit</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 100, bgcolor: "#f8fafc" }}>Order</TableCell>

                      {/* Male */}
                      <TableCell sx={{ fontWeight: 700, width: 110, bgcolor: "#eff6ff" }}>Male Min</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 110, bgcolor: "#eff6ff" }}>Male Max</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 160, bgcolor: "#eff6ff" }}>Male Range Text</TableCell>

                      {/* Female */}
                      <TableCell sx={{ fontWeight: 700, width: 110, bgcolor: "#fdf2f8" }}>Female Min</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 110, bgcolor: "#fdf2f8" }}>Female Max</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 160, bgcolor: "#fdf2f8" }}>Female Range Text</TableCell>

                      {/* Baby */}
                      <TableCell sx={{ fontWeight: 700, width: 110, bgcolor: "#f0fdf4" }}>Baby Min</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 110, bgcolor: "#f0fdf4" }}>Baby Max</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 180, bgcolor: "#f0fdf4" }}>Baby Range Text</TableCell>

                      {/* Default */}
                      <TableCell sx={{ fontWeight: 700, width: 200, bgcolor: "#fafaf9" }}>Default Range Text</TableCell>

                      <TableCell align="center" sx={{ fontWeight: 700, width: 50, bgcolor: "#f8fafc" }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {editForm.parameters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={16} align="center" sx={{ py: 6, color: "text.secondary" }}>
                          No parameters added yet. Click "Add Parameter" to start.
                        </TableCell>
                      </TableRow>
                    ) : (
                      editForm.parameters.map((param, index) => (
                        <TableRow
                          key={param.key}
                          hover
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={handleDrop}
                          sx={{
                            opacity: draggedKey === param.key ? 0.4 : 1,
                            bgcolor: draggedKey === param.key ? "rgba(124, 58, 237, 0.04)" : "inherit",
                            '&:hover': { bgcolor: "rgba(0,0,0,0.01)" }
                          }}
                        >
                          <TableCell align="center" sx={{ width: 30, p: 0.5 }}>
                            <IconButton
                              size="small"
                              sx={{ cursor: "grab", color: "text.secondary" }}
                              draggable
                              onDragStart={(e) => handleDragStart(e, param.key)}
                              onDragEnd={handleDragEnd}
                            >
                              <DragIndicatorIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>{index + 1}</TableCell>

                          {/* Name */}
                          <TableCell>
                            <Autocomplete
                              freeSolo
                              size="small"
                              options={parameterDictionary.map((option) => option.name)}
                              value={param.name}
                              onChange={(event, newValue) => {
                                handleParamNameSelect(index, newValue);
                              }}
                              onInputChange={(event, newInputValue) => {
                                handleParamChange(index, "name", newInputValue);
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder="Name"
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                />
                              )}
                            />
                          </TableCell>

                          {/* Unit */}
                          <TableCell>
                            <Autocomplete
                              freeSolo
                              size="small"
                              options={COMMON_LAB_UNITS}
                              value={param.unit || ""}
                              onChange={(event, newValue) => {
                                handleParamChange(index, "unit", newValue || "");
                              }}
                              onInputChange={(event, newInputValue) => {
                                handleParamChange(index, "unit", newInputValue);
                              }}
                              onBlur={() => {
                                if (!param.unit || param.unit.trim() === "") {
                                  // 1. Try to restore original unit configured at the time the dialog was opened
                                  const initialParam = initialParameters[index];
                                  if (initialParam && initialParam.unit && initialParam.unit.trim() !== "") {
                                    handleParamChange(index, "unit", initialParam.unit);
                                    return;
                                  }
                                  
                                  // 2. Fallback: Search upwards for closest preceding parameter with a unit
                                  for (let i = index - 1; i >= 0; i--) {
                                    if (editForm.parameters[i].unit && editForm.parameters[i].unit.trim() !== "") {
                                      handleParamChange(index, "unit", editForm.parameters[i].unit);
                                      break;
                                    }
                                  }
                                }
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder="e.g. g/dL"
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                />
                              )}
                            />
                          </TableCell>

                          {/* Order */}
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={param.order}
                              onChange={(e) => handleParamChange(index, "order", e.target.value)}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>

                          {/* Male Min */}
                          <TableCell sx={{ bgcolor: "#f8fafc" }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              inputProps={{ step: "any" }}
                              value={param.minValMale}
                              onChange={(e) => handleParamChange(index, "minValMale", e.target.value)}
                              placeholder="Min"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>

                          {/* Male Max */}
                          <TableCell sx={{ bgcolor: "#f8fafc" }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              inputProps={{ step: "any" }}
                              value={param.maxValMale}
                              onChange={(e) => handleParamChange(index, "maxValMale", e.target.value)}
                              placeholder="Max"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>

                          {/* Male Range Text */}
                          <TableCell sx={{ bgcolor: "#f8fafc" }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={param.normalRangeMale}
                              onChange={(e) => handleParamChange(index, "normalRangeMale", e.target.value)}
                              placeholder="Range text"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>

                          {/* Female Min */}
                          <TableCell sx={{ bgcolor: "#f8fafc" }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              inputProps={{ step: "any" }}
                              value={param.minValFemale}
                              onChange={(e) => handleParamChange(index, "minValFemale", e.target.value)}
                              placeholder="Min"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>

                          {/* Female Max */}
                          <TableCell sx={{ bgcolor: "#f8fafc" }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              inputProps={{ step: "any" }}
                              value={param.maxValFemale}
                              onChange={(e) => handleParamChange(index, "maxValFemale", e.target.value)}
                              placeholder="Max"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>

                          {/* Female Range Text */}
                          <TableCell sx={{ bgcolor: "#f8fafc" }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={param.normalRangeFemale}
                              onChange={(e) => handleParamChange(index, "normalRangeFemale", e.target.value)}
                              placeholder="Range text"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>

                          {/* Baby Min */}
                          <TableCell sx={{ bgcolor: "#f8fafc" }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              inputProps={{ step: "any" }}
                              value={param.minValBaby}
                              onChange={(e) => handleParamChange(index, "minValBaby", e.target.value)}
                              placeholder="Min"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>

                          {/* Baby Max */}
                          <TableCell sx={{ bgcolor: "#f8fafc" }}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              inputProps={{ step: "any" }}
                              value={param.maxValBaby}
                              onChange={(e) => handleParamChange(index, "maxValBaby", e.target.value)}
                              placeholder="Max"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>

                          {/* Baby Range Text */}
                          <TableCell sx={{ bgcolor: "#f8fafc" }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={param.normalRangeBaby}
                              onChange={(e) => handleParamChange(index, "normalRangeBaby", e.target.value)}
                              placeholder="Range text"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>

                          {/* Default Range Text */}
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={param.normalRangeDefault}
                              onChange={(e) => handleParamChange(index, "normalRangeDefault", e.target.value)}
                              placeholder="Default range"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>

                          {/* Delete Action */}
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveParamRow(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddParamRow}
              sx={{ borderRadius: 2 }}
            >
              Add Parameter
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                onClick={() => setEditModalOpen(false)}
                color="inherit"
                disabled={saving}
                variant="text"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={saving}
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : (editForm.id === null ? <AddIcon /> : <EditIcon />)}
              >
                {saving ? "Saving..." : (editForm.id === null ? "Create Test" : "Save Changes")}
              </Button>
            </Box>
          </DialogActions>
        </form>
      </Dialog>

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

      {/* Edit Parameter Dialog */}
      <Dialog
        open={editParamModalOpen}
        onClose={() => !saving && setEditParamModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSaveParamEdit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Edit Parameter Dictionary Entry</DialogTitle>
          <Divider />
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  required
                  fullWidth
                  label="Parameter Name *"
                  size="small"
                  value={editParamForm.name}
                  onChange={(e) => setEditParamForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Unit"
                  size="small"
                  value={editParamForm.unit}
                  onChange={(e) => setEditParamForm(prev => ({ ...prev, unit: e.target.value }))}
                />
              </Grid>
            </Grid>

            <Divider />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Reference Values & Ranges
            </Typography>

            <Grid container spacing={3}>
              {/* Male Ranges */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", display: "block", mb: 1 }}>Male References</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Min Value" value={editParamForm.minValMale} onChange={(e) => setEditParamForm(prev => ({ ...prev, minValMale: e.target.value }))} />
                  <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Max Value" value={editParamForm.maxValMale} onChange={(e) => setEditParamForm(prev => ({ ...prev, maxValMale: e.target.value }))} />
                  <TextField fullWidth size="small" label="Range Text" value={editParamForm.normalRangeMale} onChange={(e) => setEditParamForm(prev => ({ ...prev, normalRangeMale: e.target.value }))} />
                </Box>
              </Grid>

              {/* Female Ranges */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "secondary.main", display: "block", mb: 1 }}>Female References</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Min Value" value={editParamForm.minValFemale} onChange={(e) => setEditParamForm(prev => ({ ...prev, minValFemale: e.target.value }))} />
                  <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Max Value" value={editParamForm.maxValFemale} onChange={(e) => setEditParamForm(prev => ({ ...prev, maxValFemale: e.target.value }))} />
                  <TextField fullWidth size="small" label="Range Text" value={editParamForm.normalRangeFemale} onChange={(e) => setEditParamForm(prev => ({ ...prev, normalRangeFemale: e.target.value }))} />
                </Box>
              </Grid>

              {/* Baby Ranges */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main", display: "block", mb: 1 }}>Baby References</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Min Value" value={editParamForm.minValBaby} onChange={(e) => setEditParamForm(prev => ({ ...prev, minValBaby: e.target.value }))} />
                  <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Max Value" value={editParamForm.maxValBaby} onChange={(e) => setEditParamForm(prev => ({ ...prev, maxValBaby: e.target.value }))} />
                  <TextField fullWidth size="small" label="Range Text" value={editParamForm.normalRangeBaby} onChange={(e) => setEditParamForm(prev => ({ ...prev, normalRangeBaby: e.target.value }))} />
                </Box>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" label="Default Fallback Range Text" value={editParamForm.normalRangeDefault} onChange={(e) => setEditParamForm(prev => ({ ...prev, normalRangeDefault: e.target.value }))} />
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setEditParamModalOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Parameter Delete / Merge Dialog */}
      <Dialog
        open={deleteParamConfirmOpen}
        onClose={() => !deleting && setDeleteParamConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Parameter Entry</DialogTitle>
        <Divider />
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 3 }}>
          {loadingUsages ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={30} /></Box>
          ) : paramUsages.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body2" sx={{ color: "error.main", fontWeight: 700 }}>
                ⚠️ This parameter is currently linked to {paramUsages.length} active default test(s):
              </Typography>
              <Box sx={{ maxHeight: 120, overflowY: "auto", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 1, p: 1.5, bgcolor: "rgba(0,0,0,0.01)" }}>
                {paramUsages.map((t, idx) => (
                  <Typography key={idx} variant="caption" sx={{ display: "block", color: "text.primary" }}>
                    • <strong>{t.name}</strong> ({t.code || "No Code"}) - {t.workspace}
                  </Typography>
                ))}
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                To delete this parameter, you must select another parameter from the library to merge/re-map these active tests to:
              </Typography>
              <Autocomplete
                size="small"
                options={parameterDictionary.filter(p => p.id !== paramToDelete?.id)}
                getOptionLabel={(option) => `${option.name} (${option.unit || "no unit"})`}
                onChange={(event, newValue) => {
                  setMergeTargetParamId(newValue ? newValue.id.toString() : "");
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Select Target Parameter to Merge Into" required />
                )}
              />
            </Box>
          ) : (
            <DialogContentText>
              Are you sure you want to delete parameter <strong>{paramToDelete?.name}</strong>? This entry is not linked to any active tests and will be removed permanently.
            </DialogContentText>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={() => setDeleteParamConfirmOpen(false)} color="inherit" disabled={deleting}>Cancel</Button>
          <Button
            onClick={handleConfirmDeleteParam}
            variant="contained"
            color="error"
            disabled={deleting || (paramUsages.length > 0 && !mergeTargetParamId)}
          >
            {deleting ? "Deleting..." : (paramUsages.length > 0 ? "Merge & Delete" : "Delete Permanent")}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
