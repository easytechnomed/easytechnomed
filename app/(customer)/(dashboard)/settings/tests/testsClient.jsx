"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Pagination,
  Autocomplete,
  Checkbox,
  Select,
  MenuItem
} from "@mui/material";
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  List as ListIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon
} from "@mui/icons-material";
import { useAdminPermissions } from "@/lib/clientAuth";

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
  "U/mL",
  "g/L",
  "mg/L",
  "μg/L",
  "pg/L",
  "fL",
  "pg",
  "%",
  "sec",
  "min",
  "ratio",
  "/μL",
  "x10^6/μL",
  "x10^3/μL",
  "x10^9/L",
  "x10^12/L"
];

export default function TestsClient() {
  const { hasPermission } = useAdminPermissions();
  const canWriteTests = hasPermission("TEST_WRITE");

  // Test Management states
  const [testsList, setTestsList] = useState([]);
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [testPage, setTestPage] = useState(1);
  const [testTotalPages, setTestTotalPages] = useState(1);
  const [testTotalCount, setTestTotalCount] = useState(0);
  const [testsLoading, setTestsLoading] = useState(false);

  const [openAddTestDialog, setOpenAddTestDialog] = useState(false);
  const [newTestName, setNewTestName] = useState("");
  const [newTestCode, setNewTestCode] = useState("");
  const [newTestPrice, setNewTestPrice] = useState("");
  const [isAddingTest, setIsAddingTest] = useState(false);

  const [openEditPriceDialog, setOpenEditPriceDialog] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [editingPrice, setEditingPrice] = useState("");
  const [editingName, setEditingName] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // Test parameter states
  const [openParamsDialog, setOpenParamsDialog] = useState(false);
  const [parameterizingTest, setParameterizingTest] = useState(null);
  const [parametersList, setParametersList] = useState([]);
  const [expandedParams, setExpandedParams] = useState({});
  const [savingParams, setSavingParams] = useState(false);
  const [draggedKey, setDraggedKey] = useState(null);

  // Autocomplete options
  const [testCatalog, setTestCatalog] = useState([]);
  const [parameterDictionary, setParameterDictionary] = useState([]);

  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    // Fetch parameter dictionary
    fetch("/adminstration/api/parameters")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setParameterDictionary(res.parameters || []);
      })
      .catch(() => {});

    // Fetch tests catalog
    fetch("/api/tests?limit=1000")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setTestCatalog(res.tests || []);
      })
      .catch(() => {});
  }, []);

  const autocompleteOptions = React.useMemo(() => [
    ...testCatalog.map((t) => ({ type: "test", id: t.id, name: t.name, parameters: t.parameters || [] })),
    ...parameterDictionary.map((p) => ({ type: "parameter", ...p }))
  ], [testCatalog, parameterDictionary]);

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  // Fetch tests dynamically with page and search query
  const fetchTests = async (page = 1, search = "") => {
    setTestsLoading(true);
    try {
      const res = await fetch(`/api/tests?page=${page}&limit=20&search=${encodeURIComponent(search)}`).then((r) => r.json());
      if (res.success && res.tests) {
        setTestsList(res.tests);
        if (res.pagination) {
          setTestPage(res.pagination.page);
          setTestTotalPages(res.pagination.totalPages);
          setTestTotalCount(res.pagination.totalCount);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch tests.", "error");
    } finally {
      setTestsLoading(false);
    }
  };

  // Trigger test fetch on page or search change (with debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTests(1, testSearchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [testSearchQuery]);
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
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= testTotalPages) {
      fetchTests(newPage, testSearchQuery);
    }
  };

  // Test management actions
  const handleAddTest = async () => {
    if (!newTestName.trim()) {
      showToast("Test name is required.", "error");
      return;
    }
    if (!newTestPrice || isNaN(parseFloat(newTestPrice))) {
      showToast("Please enter a valid price.", "error");
      return;
    }

    setIsAddingTest(true);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTestName.trim(),
          code: newTestCode.trim() || null,
          price: parseFloat(newTestPrice),
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(res.message || "Test added successfully! Please configure its parameters.", "success");
        fetchTests(testPage, testSearchQuery);
        setOpenAddTestDialog(false);
        setNewTestName("");
        setNewTestCode("");
        setNewTestPrice("");

        // Open parameters config immediately as the next step
        const parsedTest = res.test;
        setParameterizingTest(parsedTest);
        setParametersList(parsedTest.parameters || [
          {
            name: "Result",
            unit: "",
            normalRangeDefault: "As per report",
            minValMale: "",
            maxValMale: "",
            normalRangeMale: "",
            minValFemale: "",
            maxValFemale: "",
            normalRangeFemale: "",
            minValBaby: "",
            maxValBaby: "",
            normalRangeBaby: ""
          }
        ]);
        setExpandedParams({});
        setOpenParamsDialog(true);
      } else {
        showToast(res.message || "Failed to add test.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred while adding test.", "error");
    } finally {
      setIsAddingTest(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!editingTest) return;
    if (!editingName.trim()) {
      showToast("Test name is required.", "error");
      return;
    }
    if (!editingPrice || isNaN(parseFloat(editingPrice))) {
      showToast("Please enter a valid price.", "error");
      return;
    }

    setIsUpdatingPrice(true);
    try {
      const res = await fetch("/api/tests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: editingTest.id,
          price: parseFloat(editingPrice),
          name: editingName.trim(),
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(res.message || "Test updated successfully!", "success");
        fetchTests(testPage, testSearchQuery);
        setOpenEditPriceDialog(false);
        setEditingTest(null);
        setEditingPrice("");
        setEditingName("");
      } else {
        showToast(res.message || "Failed to update test details.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred while updating test details.", "error");
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleOpenParams = (test) => {
    setParameterizingTest(test);
    const formattedParams = (test.parameters || []).map((p, index) => ({
      key: p.id || `param-${Date.now()}-${index}-${Math.random()}`,
      id: p.id,
      parameterId: p.parameterId,
      parentId: p.parentId ?? null,
      parentKey: null,
      name: p.name,
      isHeader: p.isHeader || false,
      unit: p.unit || "",
      normalRangeDefault: p.normalRangeDefault || "",
      minValMale: p.minValMale !== null && p.minValMale !== undefined ? String(p.minValMale) : "",
      maxValMale: p.maxValMale !== null && p.maxValMale !== undefined ? String(p.maxValMale) : "",
      normalRangeMale: p.normalRangeMale || "",
      minValFemale: p.minValFemale !== null && p.minValFemale !== undefined ? String(p.minValFemale) : "",
      maxValFemale: p.maxValFemale !== null && p.maxValFemale !== undefined ? String(p.maxValFemale) : "",
      normalRangeFemale: p.normalRangeFemale || "",
      minValBaby: p.minValBaby !== null && p.minValBaby !== undefined ? String(p.minValBaby) : "",
      maxValBaby: p.maxValBaby !== null && p.maxValBaby !== undefined ? String(p.maxValBaby) : "",
      normalRangeBaby: p.normalRangeBaby || "",
    }));
    setParametersList(formattedParams);
    setExpandedParams({});
    setOpenParamsDialog(true);
  };

  const handleAddParameterRow = () => {
    setParametersList((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}-${Math.random()}`,
        id: undefined,
        parameterId: null,
        parentId: null,
        parentKey: null,
        name: "",
        isHeader: false,
        unit: "",
        normalRangeDefault: "",
        minValMale: "",
        maxValMale: "",
        normalRangeMale: "",
        minValFemale: "",
        maxValFemale: "",
        normalRangeFemale: "",
        minValBaby: "",
        maxValBaby: "",
        normalRangeBaby: "",
      },
    ]);
  };

  const handleRemoveParameterRow = (index) => {
    setParametersList((prev) => prev.filter((_, idx) => idx !== index));
    setExpandedParams((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const handleParamRowChange = (index, field, value) => {
    setParametersList((prev) => {
      const updated = [...prev];
      let targetParam = {
        ...updated[index],
        [field]: value,
      };

      if (field === "isHeader" && value === true) {
        targetParam.unit = "";
        targetParam.minValMale = "";
        targetParam.maxValMale = "";
        targetParam.normalRangeMale = "";
        targetParam.minValFemale = "";
        targetParam.maxValFemale = "";
        targetParam.normalRangeFemale = "";
        targetParam.minValBaby = "";
        targetParam.maxValBaby = "";
        targetParam.normalRangeBaby = "";
        targetParam.normalRangeDefault = "";
      }

      // Auto-fill Male range description
      if (field === "minValMale" || field === "maxValMale") {
        const min = field === "minValMale" ? value : targetParam.minValMale;
        const max = field === "maxValMale" ? value : targetParam.maxValMale;
        if (min !== "" && max !== "") {
          targetParam.normalRangeMale = `${min} - ${max}`;
        }
      }

      // Auto-fill Female range description
      if (field === "minValFemale" || field === "maxValFemale") {
        const min = field === "minValFemale" ? value : targetParam.minValFemale;
        const max = field === "maxValFemale" ? value : targetParam.maxValFemale;
        if (min !== "" && max !== "") {
          targetParam.normalRangeFemale = `${min} - ${max}`;
        }
      }

      // Auto-fill Baby range description
      if (field === "minValBaby" || field === "maxValBaby") {
        const min = field === "minValBaby" ? value : targetParam.minValBaby;
        const max = field === "maxValBaby" ? value : targetParam.maxValBaby;
        if (min !== "" && max !== "") {
          targetParam.normalRangeBaby = `${min} - ${max}`;
        }
      }

      updated[index] = targetParam;
      return updated;
    });
  };

  const handleParamNameSelect = (index, name) => {
    if (!name) return;
    const template = parameterDictionary.find(
      (p) => p.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (template) {
      setParametersList((prev) => {
        const newParams = [...prev];
        newParams[index] = {
          ...newParams[index],
          name: template.name,
          unit: template.unit || "",
          parameterId: template.id,
          isHeader: false,
          minValMale: template.minValMale !== null && template.minValMale !== undefined ? template.minValMale.toString() : "",
          maxValMale: template.maxValMale !== null && template.maxValMale !== undefined ? template.maxValMale.toString() : "",
          normalRangeMale: template.normalRangeMale || "",
          minValFemale: template.minValFemale !== null && template.minValFemale !== undefined ? template.minValFemale.toString() : "",
          maxValFemale: template.maxValFemale !== null && template.maxValFemale !== undefined ? template.maxValFemale.toString() : "",
          normalRangeFemale: template.normalRangeFemale || "",
          minValBaby: template.minValBaby !== null && template.minValBaby !== undefined ? template.minValBaby.toString() : "",
          maxValBaby: template.maxValBaby !== null && template.maxValBaby !== undefined ? template.maxValBaby.toString() : "",
          normalRangeBaby: template.normalRangeBaby || "",
          normalRangeDefault: template.normalRangeDefault || ""
        };
        return newParams;
      });
    } else {
      handleParamRowChange(index, "name", name);
    }
  };

  const handleTestBulkInsert = (index, testOption) => {
    if (!testOption || !Array.isArray(testOption.parameters)) return;

    const ts = Date.now();
    const headerKey = `bulk-header-${testOption.id}-${ts}`;

    const headerRow = {
      key: headerKey,
      id: undefined,
      parameterId: null,
      parentId: null,
      parentKey: null,
      name: testOption.name,
      isHeader: true,
      unit: "",
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
    };

    const childRows = testOption.parameters.map((child, i) => ({
      key: `bulk-child-${testOption.id}-${i}-${ts}-${Math.random()}`,
      id: undefined,
      parameterId: child.parameterId || null,
      parentId: null,
      parentKey: headerKey,
      name: child.name || "",
      isHeader: false,
      unit: child.unit || "",
      minValMale: child.minValMale !== null && child.minValMale !== undefined ? child.minValMale.toString() : "",
      maxValMale: child.maxValMale !== null && child.maxValMale !== undefined ? child.maxValMale.toString() : "",
      normalRangeMale: child.normalRangeMale || "",
      minValFemale: child.minValFemale !== null && child.minValFemale !== undefined ? child.minValFemale.toString() : "",
      maxValFemale: child.maxValFemale !== null && child.maxValFemale !== undefined ? child.maxValFemale.toString() : "",
      normalRangeFemale: child.normalRangeFemale || "",
      minValBaby: child.minValBaby !== null && child.minValBaby !== undefined ? child.minValBaby.toString() : "",
      maxValBaby: child.maxValBaby !== null && child.maxValBaby !== undefined ? child.maxValBaby.toString() : "",
      normalRangeBaby: child.normalRangeBaby || "",
      normalRangeDefault: child.normalRangeDefault || ""
    }));

    const newRows = [headerRow, ...childRows];

    setParametersList((prev) => {
      const before = prev.slice(0, index);
      const after = prev.slice(index + 1);
      return [...before, ...newRows, ...after];
    });

    showToast(`"${testOption.name}" added as header + ${childRows.length} child parameter(s)`);
  };

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
        // Dragging close to the top edge -> scroll up
        container.scrollTop -= 12;
      } else if (rect.bottom - e.clientY < 60) {
        // Dragging close to the bottom edge -> scroll down
        container.scrollTop += 12;
      }
    }

    if (draggedKey === null) return;

    setParametersList((prev) => {
      const sourceIndex = prev.findIndex((p) => p.key === draggedKey);
      if (sourceIndex === -1 || sourceIndex === targetIndex) return prev;

      const updatedParams = [...prev];
      const [movedParam] = updatedParams.splice(sourceIndex, 1);
      updatedParams.splice(targetIndex, 0, movedParam);
      return updatedParams;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedKey(null);
  };

  const toggleExpandParam = (index) => {
    setExpandedParams((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSaveParameters = async () => {
    if (!parameterizingTest) return;

    const hasInvalid = parametersList.some((p) => !p.name.trim());
    if (hasInvalid) {
      showToast("Please ensure all parameters have a name.", "error");
      return;
    }

    setSavingParams(true);
    try {
      const res = await fetch(`/api/registrations/${parameterizingTest.id}/parameters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parametersList: parametersList.map((p) => ({
            key: p.key,
            id: p.id,
            parameterId: p.parameterId,
            parentId: p.parentId,
            parentKey: p.parentKey,
            name: p.name.trim(),
            isHeader: p.isHeader || false,
            unit: p.unit || "",
            normalRangeDefault: p.normalRangeDefault || "",
            minValMale: p.minValMale !== "" ? parseFloat(p.minValMale) : null,
            maxValMale: p.maxValMale !== "" ? parseFloat(p.maxValMale) : null,
            normalRangeMale: p.normalRangeMale || "",
            minValFemale: p.minValFemale !== "" ? parseFloat(p.minValFemale) : null,
            maxValFemale: p.maxValFemale !== "" ? parseFloat(p.maxValFemale) : null,
            normalRangeFemale: p.normalRangeFemale || "",
            minValBaby: p.minValBaby !== "" ? parseFloat(p.minValBaby) : null,
            maxValBaby: p.maxValBaby !== "" ? parseFloat(p.maxValBaby) : null,
            normalRangeBaby: p.normalRangeBaby || "",
          })),
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast("Test parameters updated successfully!", "success");
        fetchTests(testPage, testSearchQuery);
        setOpenParamsDialog(false);
        setParameterizingTest(null);
        setParametersList([]);
        setExpandedParams({});
      } else {
        showToast(res.message || "Failed to update parameters.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred while saving parameters.", "error");
    } finally {
      setSavingParams(false);
    }
  };

  const filteredTests = testsList;

  return (
    <Box>
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                🔬 Test Price & Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create new tests or override baseline pricing specifically for your lab workspace.
              </Typography>
            </Box>
            <Tooltip title={!canWriteTests ? "You do not have permission to add custom tests" : ""}>
              <span>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddTestDialog(true)}
                  disabled={!canWriteTests}
                >
                  Add Custom Test
                </Button>
              </span>
            </Tooltip>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {/* Search Bar */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search tests by name or test code..."
            value={testSearchQuery}
            onChange={(e) => setTestSearchQuery(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* Tests Table */}
          {testsLoading ? (
            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 8, gap: 2 }}>
              <CircularProgress size={35} />
              <Typography variant="body2" color="text.secondary">Fetching tests...</Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
                <Table size="small" stickyHeader sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }}>Test Code</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }}>Test Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }} align="right">Default Price (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }} align="right">Your Price (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }} align="center">Scope</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }} align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                          No tests found matching search filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTests.map((test) => (
                        <TableRow key={test.id} hover>
                          <TableCell sx={{ fontMono: "true", fontSize: "0.75rem", fontWeight: 600 }}>{test.code}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{test.name}</TableCell>
                          <TableCell align="right" sx={{ color: "text.secondary" }}>₹{Number(test.globalPrice).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: test.isCustomized ? "success.main" : "text.primary" }}>
                            ₹{Number(test.price).toFixed(2)}
                          </TableCell>
                          <TableCell align="center">
                            {test.isCustomized ? (
                              <Typography variant="caption" sx={{ bgcolor: "success.50", color: "success.700", border: "1px solid", borderColor: "success.200", px: 1, py: 0.2, borderRadius: 1, fontWeight: 700 }}>
                                Workspace Custom
                              </Typography>
                            ) : (
                              <Typography variant="caption" sx={{ bgcolor: "grey.100", color: "grey.700", border: "1px solid", borderColor: "grey.300", px: 1, py: 0.2, borderRadius: 1, fontWeight: 500 }}>
                                Global Default
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                              <Tooltip title={!canWriteTests ? "You do not have permission to edit tests" : "Edit Details & Price"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                      setEditingTest(test);
                                      setEditingPrice(String(test.price));
                                      setEditingName(test.name);
                                      setOpenEditPriceDialog(true);
                                    }}
                                    disabled={!canWriteTests}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={!canWriteTests ? "You do not have permission to configure parameters" : "Configure Parameters"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    color="secondary"
                                    onClick={() => handleOpenParams(test)}
                                    disabled={!canWriteTests}
                                  >
                                    <ListIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination Controls */}
              {testTotalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3, flexWrap: "wrap", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {(testPage - 1) * 20 + 1} - {Math.min(testPage * 20, testTotalCount)} of {testTotalCount} tests
                  </Typography>
                  <Pagination
                    count={testTotalPages}
                    page={testPage}
                    onChange={(e, page) => handlePageChange(page)}
                    color="primary"
                    size="small"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Custom Test Dialog */}
      <Dialog open={openAddTestDialog} onClose={() => setOpenAddTestDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Custom Test</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1.5 }}>
            <TextField
              label="Test Name"
              fullWidth
              size="small"
              value={newTestName}
              onChange={(e) => setNewTestName(e.target.value)}
              required
            />
            <TextField
              label="Test Code (Optional)"
              fullWidth
              size="small"
              value={newTestCode}
              onChange={(e) => setNewTestCode(e.target.value)}
              placeholder="Will be auto-generated if left empty"
            />
            <TextField
              label="Test Price (₹)"
              type="number"
              fullWidth
              size="small"
              value={newTestPrice}
              onChange={(e) => setNewTestPrice(e.target.value)}
              required
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAddTestDialog(false)} color="inherit" disabled={isAddingTest}>
            Cancel
          </Button>
          <Button
            onClick={handleAddTest}
            variant="contained"
            disabled={isAddingTest || !newTestName.trim() || !newTestPrice}
          >
            {isAddingTest ? <CircularProgress size={24} /> : "Add Test"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Test Price Dialog */}
      <Dialog open={openEditPriceDialog} onClose={() => setOpenEditPriceDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Test Details</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1.5 }}>
            <TextField
              label="Test Name"
              fullWidth
              size="small"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              required
            />
            {editingTest && (
              <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>
                Test Code: <strong>{editingTest.code || "N/A"}</strong>
              </Typography>
            )}
            <TextField
              label="Custom Workspace Price (₹)"
              type="number"
              fullWidth
              size="small"
              value={editingPrice}
              onChange={(e) => setEditingPrice(e.target.value)}
              required
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenEditPriceDialog(false)} color="inherit" disabled={isUpdatingPrice}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePrice}
            variant="contained"
            disabled={isUpdatingPrice || !editingPrice || !editingName.trim()}
          >
            {isUpdatingPrice ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Test Parameters Dialog */}
      <Dialog 
        open={openParamsDialog} 
        onClose={() => setOpenParamsDialog(false)} 
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
        <DialogTitle sx={{ fontWeight: 800 }}>
          ⚙️ Configure Parameters: {parameterizingTest?.name || "Test"}
        </DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", flexGrow: 1, overflowY: "auto" }}>
          <Box sx={{ minHeight: "40vh" }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Define the reporting parameters, standard units, and reference ranges. You can set sex/age-specific reference ranges or a generic default range.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto", maxHeight: "50vh", userSelect: "none" }}>
              <Table size="small" stickyHeader sx={{ minWidth: 2000 }}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ fontWeight: 700, width: 80, bgcolor: "#f8fafc" }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 500, bgcolor: "#f8fafc" }}>Parameter Name *</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 180, bgcolor: "#f8fafc" }}>Unit</TableCell>

                    {/* Male */}
                    <TableCell sx={{ fontWeight: 700, width: 120, bgcolor: "#eff6ff" }}>Male Min</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120, bgcolor: "#eff6ff" }}>Male Max</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 180, bgcolor: "#eff6ff" }}>Male Range Text</TableCell>

                    {/* Female */}
                    <TableCell sx={{ fontWeight: 700, width: 120, bgcolor: "#fdf2f8" }}>Female Min</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120, bgcolor: "#fdf2f8" }}>Female Max</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 180, bgcolor: "#fdf2f8" }}>Female Range Text</TableCell>

                    {/* Baby */}
                    <TableCell sx={{ fontWeight: 700, width: 120, bgcolor: "#f0fdf4" }}>Baby Min</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120, bgcolor: "#f0fdf4" }}>Baby Max</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 180, bgcolor: "#f0fdf4" }}>Baby Range Text</TableCell>

                    {/* Default */}
                    <TableCell sx={{ fontWeight: 700, width: 220, bgcolor: "#fafaf9" }}>Default Range Text</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, width: 90, bgcolor: "#f8fafc" }}>Is Header?</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 250, bgcolor: "#fff7ed" }}>Parent Header</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, width: 50, bgcolor: "#f8fafc" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parametersList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} align="center" sx={{ py: 6, color: "text.secondary" }}>
                        No parameters added yet. Click "Add Parameter Row" to start.
                      </TableCell>
                    </TableRow>
                  ) : (
                    parametersList.map((param, idx) => (
                      <TableRow 
                        key={param.key} 
                        hover
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={handleDrop}
                        sx={{
                          opacity: draggedKey === param.key ? 0.4 : 1,
                          bgcolor: draggedKey === param.key ? "rgba(124, 58, 237, 0.04)" : "inherit",
                          '&:hover': { bgcolor: "rgba(0,0,0,0.01)" }
                        }}
                      >
                        <TableCell align="center" sx={{ py: 0.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <IconButton
                              size="small"
                              sx={{ cursor: "grab", color: "text.secondary" }}
                              draggable
                              onDragStart={(e) => handleDragStart(e, param.key)}
                              onDragEnd={handleDragEnd}
                            >
                              <DragIndicatorIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{idx + 1}</Typography>
                          </Box>
                        </TableCell>

                        {/* Name */}
                        <TableCell>
                          <Autocomplete
                            freeSolo
                            size="small"
                            options={autocompleteOptions}
                            groupBy={(option) => typeof option === "string" ? "" : (option.type === "test" ? "📋 Tests (bulk-add all children)" : "🔬 Individual Parameters")}
                            getOptionLabel={(option) => typeof option === "string" ? option : (option.name || "")}
                            isOptionEqualToValue={(option, value) => {
                              const optionName = typeof option === "string" ? option : option.name;
                              const valueName = typeof value === "string" ? value : value?.name;
                              return optionName === valueName;
                            }}
                            value={param.name || ""}
                            onChange={(event, newValue) => {
                              if (!newValue) return;
                              if (typeof newValue === "string") {
                                handleParamRowChange(idx, "name", newValue);
                              } else if (newValue.type === "test") {
                                handleTestBulkInsert(idx, newValue);
                              } else {
                                handleParamNameSelect(idx, newValue.name);
                              }
                            }}
                            onInputChange={(event, newInputValue) => {
                              handleParamRowChange(idx, "name", newInputValue);
                            }}
                            renderOption={(props, option) => {
                              const { key, ...restProps } = props;
                              const isTest = option.type === "test";
                              return (
                                <Box
                                  component="li"
                                  key={key}
                                  {...restProps}
                                  sx={{ display: "flex", alignItems: "center", gap: 1, py: "6px !important" }}
                                >
                                  <Box 
                                    sx={{ 
                                      fontSize: "0.82rem", 
                                      color: isTest ? "#ef4444" : "#2563eb", 
                                      fontWeight: 600 
                                    }}
                                  >
                                    {option.name}
                                  </Box>
                                  {isTest && (
                                    <Box sx={{ fontSize: "0.7rem", color: "#ef4444", opacity: 0.8, ml: "auto", flexShrink: 0, fontStyle: "italic" }}>
                                      ({option.parameters?.length || 0} children)
                                    </Box>
                                  )}
                                </Box>
                              );
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Parameter or Test Name *"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
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
                              handleParamRowChange(idx, "unit", newValue || "");
                            }}
                            onInputChange={(event, newInputValue) => {
                              handleParamRowChange(idx, "unit", newInputValue);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="e.g. g/dL"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                              />
                            )}
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
                            onChange={(e) => handleParamRowChange(idx, "minValMale", e.target.value)}
                            placeholder="Min"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
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
                            onChange={(e) => handleParamRowChange(idx, "maxValMale", e.target.value)}
                            placeholder="Max"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                          />
                        </TableCell>

                        {/* Male Range Text */}
                        <TableCell sx={{ bgcolor: "#f8fafc" }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={param.normalRangeMale}
                            onChange={(e) => handleParamRowChange(idx, "normalRangeMale", e.target.value)}
                            placeholder="Range text"
                            disabled={param.minValMale !== "" && param.maxValMale !== ""}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
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
                            onChange={(e) => handleParamRowChange(idx, "minValFemale", e.target.value)}
                            placeholder="Min"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
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
                            onChange={(e) => handleParamRowChange(idx, "maxValFemale", e.target.value)}
                            placeholder="Max"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                          />
                        </TableCell>

                        {/* Female Range Text */}
                        <TableCell sx={{ bgcolor: "#f8fafc" }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={param.normalRangeFemale}
                            onChange={(e) => handleParamRowChange(idx, "normalRangeFemale", e.target.value)}
                            placeholder="Range text"
                            disabled={param.minValFemale !== "" && param.maxValFemale !== ""}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
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
                            onChange={(e) => handleParamRowChange(idx, "minValBaby", e.target.value)}
                            placeholder="Min"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
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
                            onChange={(e) => handleParamRowChange(idx, "maxValBaby", e.target.value)}
                            placeholder="Max"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                          />
                        </TableCell>

                        {/* Baby Range Text */}
                        <TableCell sx={{ bgcolor: "#f8fafc" }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={param.normalRangeBaby}
                            onChange={(e) => handleParamRowChange(idx, "normalRangeBaby", e.target.value)}
                            placeholder="Range text"
                            disabled={param.minValBaby !== "" && param.maxValBaby !== ""}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                          />
                        </TableCell>

                        {/* Default Range Text */}
                        <TableCell>
                          <TextField
                            fullWidth
                            disabled={!!param.isHeader}
                            size="small"
                            value={param.normalRangeDefault}
                            onChange={(e) => handleParamRowChange(idx, "normalRangeDefault", e.target.value)}
                            placeholder="Default range"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                          />
                        </TableCell>

                        {/* Is Header */}
                        <TableCell align="center" sx={{ bgcolor: "#f8fafc" }}>
                          <Checkbox
                            checked={!!param.isHeader}
                            onChange={(e) => handleParamRowChange(idx, "isHeader", e.target.checked)}
                            color="primary"
                          />
                        </TableCell>

                        {/* Parent Header — link this row to a header group */}
                        <TableCell sx={{ bgcolor: "#fff7ed" }}>
                          {param.isHeader ? (
                            <Box sx={{ fontSize: "0.8rem", color: "text.disabled", pl: 1 }}>—</Box>
                          ) : (
                            <Select
                              size="small"
                              fullWidth
                              displayEmpty
                              value={param.parentKey || (param.parentId ? String(param.parentId) : "")}
                              onChange={(e) => {
                                const selected = e.target.value;
                                if (!selected) {
                                  setParametersList((prev) => {
                                    const p = [...prev];
                                    p[idx] = { ...p[idx], parentKey: null, parentId: null };
                                    return p;
                                  });
                                } else {
                                  const chosenHeader = parametersList.find(
                                    (h) => h.isHeader && (h.key === selected || String(h.id) === selected)
                                  );
                                  setParametersList((prev) => {
                                    const p = [...prev];
                                    p[idx] = {
                                      ...p[idx],
                                      parentKey: chosenHeader?.key || null,
                                      parentId: chosenHeader?.id ? chosenHeader.id : null,
                                    };
                                    return p;
                                  });
                                }
                              }}
                              sx={{ fontSize: "0.8rem" }}
                            >
                              <MenuItem value="">
                                <Box component="span" sx={{ color: "text.secondary", fontStyle: "italic", fontSize: "0.78rem" }}>
                                  (None – standalone)
                                </Box>
                              </MenuItem>
                              {parametersList
                                .filter((h) => h.isHeader && h.name)
                                .map((h) => (
                                  <MenuItem
                                    key={h.key}
                                    value={h.key || String(h.id)}
                                    sx={{ fontSize: "0.82rem" }}
                                  >
                                    {h.name}
                                  </MenuItem>
                                ))
                              }
                            </Select>
                          )}
                        </TableCell>

                        {/* Delete Action */}
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveParameterRow(idx)}
                            disabled={parametersList.length === 1}
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
          <Tooltip title={!canWriteTests ? "You do not have permission to configure tests" : ""}>
            <span>
              <Button
                variant="outlined"
                onClick={handleAddParameterRow}
                startIcon={<AddIcon />}
                disabled={!canWriteTests}
                sx={{ borderRadius: 2 }}
              >
                Add Parameter
              </Button>
            </span>
          </Tooltip>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={() => setOpenParamsDialog(false)} color="inherit" disabled={savingParams}>
              Cancel
            </Button>
            <Tooltip title={!canWriteTests ? "You do not have permission to configure tests" : ""}>
              <span>
                <Button
                  onClick={handleSaveParameters}
                  variant="contained"
                  disabled={savingParams || parametersList.length === 0 || !canWriteTests}
                  startIcon={savingParams ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  {savingParams ? "Saving..." : "Save Parameters"}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
