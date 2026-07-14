"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
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
  CircularProgress,
  Autocomplete,
  Tabs,
  Tab,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  DragIndicator as DragIndicatorIcon,
  Science as ScienceIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import { toast } from "sonner";

const evaluateExpression = (formulaStr, valuesMap) => {
  if (!formulaStr) return null;

  // Replace exponentiation operator ^ with JS standard **
  let prepared = formulaStr.replace(/\^/g, "**");

  // Identify variable tokens (excluding function keywords and null/boolean literals)
  const tokenRegex = /\b(?!ROUND|ABS|SQRT|MIN|MAX|IF|null|NULL\b)[a-zA-Z_][a-zA-Z0-9_]*\b/g;

  const substituted = prepared.replace(tokenRegex, (match) => {
    if (valuesMap[match] !== undefined && valuesMap[match] !== null) {
      return valuesMap[match];
    }
    return match;
  });

  // Sanitize the expression to allow only numbers, math operators, logic characters, and allowed keywords
  const sanitized = substituted.replace(/[^0-9+\-*/%().\s*<>!=&|?:,a-zA-Z_]/g, "");

  const allowedKeywords = /^(ROUND|ABS|SQRT|MIN|MAX|IF|null|NULL|true|false)$/i;
  const unknownTokens = sanitized.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  for (const token of unknownTokens) {
    if (!allowedKeywords.test(token)) {
      return null;
    }
  }

  try {
    const context = {
      ROUND: (val, dec = 0) => {
        if (val === null || val === undefined || isNaN(val)) return null;
        return Number(Math.round(val + "e" + dec) + "e-" + dec);
      },
      ABS: Math.abs,
      SQRT: Math.sqrt,
      MIN: Math.min,
      MAX: Math.max,
      IF: (cond, tVal, fVal) => cond ? tVal : fVal,
      NULL: null
    };

    const keys = Object.keys(context);
    const values = Object.values(context);

    const fn = new Function(...keys, `return (${sanitized});`);
    const result = fn(...values);

    if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
      return result;
    }
    return null;
  } catch (err) {
    return null;
  }
};

const checkFormulaDependencies = (formulaStr, valuesMap) => {
  if (!formulaStr) return false;

  const tokenRegex = /\b(?!ROUND|ABS|SQRT|MIN|MAX|IF|null|NULL\b)[a-zA-Z_][a-zA-Z0-9_]*\b/g;
  const matches = formulaStr.match(tokenRegex) || [];

  for (const match of matches) {
    if (valuesMap[match] === undefined || valuesMap[match] === null || valuesMap[match] === "") {
      return false;
    }
  }
  return true;
};


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

export default function EditTestDialog({ open, onClose, test, parameterDictionary, onSaveSuccess }) {
  const [activeTab, setActiveTab] = useState(0); // 0: Parameters, 1: Formulas
  const [editForm, setEditForm] = useState(() => {
    if (test) {
      const paramsCopy = test.parameters
        ? test.parameters.map((p, index) => ({
          key: p.id || `param-${Date.now()}-${index}-${Math.random()}`,
          id: p.id,
          parameterId: p.parameterId,
          parentId: p.parentId ?? null,     // DB id of parent isHeader row (null = standalone)
          parentKey: null,                   // client-side only; set during bulk-insert
          name: p.name || "",
          isHeader: p.isHeader || false,
          unit: p.unit || "",
          order: p.order?.toString() || "1",
          editable: p.editable !== undefined ? p.editable : true,
          isCalculated: p.isCalculated !== undefined ? p.isCalculated : false,
          minValMale: p.minValMale !== null && p.minValMale !== undefined ? p.minValMale.toString() : "",
          maxValMale: p.maxValMale !== null && p.maxValMale !== undefined ? p.maxValMale.toString() : "",
          normalRangeMale: p.normalRangeMale || "",
          minValFemale: p.minValFemale !== null && p.minValFemale !== undefined ? p.minValFemale.toString() : "",
          maxValFemale: p.maxValFemale !== null && p.maxValFemale !== undefined ? p.maxValFemale.toString() : "",
          normalRangeFemale: p.normalRangeFemale || "",
          minValBaby: p.minValBaby !== null && p.minValBaby !== undefined ? p.minValBaby.toString() : "",
          maxValBaby: p.maxValBaby !== null && p.maxValBaby !== undefined ? p.maxValBaby.toString() : "",
          normalRangeBaby: p.normalRangeBaby || "",
          normalRangeDefault: p.normalRangeDefault || ""
        }))
        : [];

      return {
        id: test.id,
        name: test.name,
        code: test.code || "",
        price: test.price.toString(),
        parameters: paramsCopy
      };
    } else {
      return {
        id: null,
        name: "",
        code: "",
        price: "0.00",
        parameters: []
      };
    }
  });

  const [initialParameters] = useState(() => editForm.parameters);
  const [saving, setSaving] = useState(false);
  const [draggedKey, setDraggedKey] = useState(null);

  // Test catalog for bulk-insert autocomplete
  const [testCatalog, setTestCatalog] = useState([]);

  // Formulas state
  const [formulas, setFormulas] = useState([]);
  const [loadingFormulas, setLoadingFormulas] = useState(false);
  const [formulaBuilderOpen, setFormulaBuilderOpen] = useState(false);
  const [formulaToEdit, setFormulaToEdit] = useState(null);
  const [formulaTesterOpen, setFormulaTesterOpen] = useState(false);

  // Custom interactive simulation states
  const [editedFormulas, setEditedFormulas] = useState({});
  const [simValues, setSimValues] = useState({});

  // Fetch test catalog for bulk-insert autocomplete on dialog open
  useEffect(() => {
    fetch("/adminstration/api/tests/all")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setTestCatalog(res.tests || []);
      })
      .catch(() => { });
  }, []);

  // Combined autocomplete options: tests first (type="test"), then individual params (type="parameter")
  const autocompleteOptions = useMemo(() => [
    ...testCatalog.map((t) => ({ type: "test", id: t.id, name: t.name, parameters: t.parameters || [] })),
    ...parameterDictionary.map((p) => ({ type: "parameter", ...p }))
  ], [testCatalog, parameterDictionary]);

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

  const fetchFormulas = async () => {
    setLoadingFormulas(true);
    try {
      const res = await fetch(`/adminstration/api/tests/${editForm.id}/formulas`).then((r) => r.json());
      if (res.success) {
        const fetched = res.formulas || [];
        setFormulas(fetched);

        const initialFormulas = {};
        fetched.forEach((f) => {
          initialFormulas[f.outputParameterId] = {
            formulaStr: f.formula || "",
            id: f.id,
            description: f.description || ""
          };
        });
        setEditedFormulas(initialFormulas);
      } else {
        toast.error("Failed to load test formulas.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading formulas.");
    } finally {
      setLoadingFormulas(false);
    }
  };

  // ── Inline Formula Tab helpers ───────────────────────────────────────────
  const getParamCode = (paramName) => {
    const match = parameterDictionary.find(
      (p) => p.name.toLowerCase().trim() === paramName.toLowerCase().trim()
    );
    if (match && match.code) return match.code;
    return paramName.replace(/[^a-zA-Z0-9_]/g, "");
  };

  const evaluateSimFormula = (formulaExpr) => {
    if (!formulaExpr) return "";
    let expr = formulaExpr;
    Object.keys(simValues).forEach((key) => {
      const val = parseFloat(simValues[key]);
      if (!isNaN(val)) {
        expr = expr.split(key).join(String(val));
      }
    });
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function("return (" + expr + ")")();
      if (typeof result === "number" && isFinite(result)) {
        return parseFloat(result.toFixed(4));
      }
      return "";
    } catch {
      return "";
    }
  };

  const handleInlineFormulaChange = (outputParamId, value) => {
    setEditedFormulas((prev) => ({
      ...prev,
      [outputParamId]: { ...(prev[outputParamId] || {}), formulaStr: value }
    }));
  };

  const handleSaveInlineFormula = async (param) => {
    const entry = editedFormulas[param.parameterId] || {};
    const formulaExpr = (entry.formulaStr || "").trim();
    if (!formulaExpr) {
      toast.error("Formula cannot be empty.");
      return;
    }
    const existing = formulas.find((f) => f.outputParameterId === param.parameterId);
    try {
      const res = await fetch("/adminstration/api/tests/" + editForm.id + "/formulas", {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existing ? existing.id : undefined,
          outputParameterId: param.parameterId,
          formula: formulaExpr,
          description: entry.description || ""
        })
      }).then((r) => r.json());
      if (res.success) {
        toast.success("Formula saved!");
        fetchFormulas();
      } else {
        toast.error(res.error || "Failed to save formula.");
      }
    } catch (err) {
      toast.error("Error saving formula.");
    }
  };

  const handleDeleteInlineFormula = async (param) => {
    const existing = formulas.find((f) => f.outputParameterId === param.parameterId);
    if (!existing) {
      setEditedFormulas((prev) => {
        const next = { ...prev };
        delete next[param.parameterId];
        return next;
      });
      return;
    }
    if (!confirm("Delete this formula?")) return;
    try {
      const res = await fetch(
        "/adminstration/api/tests/" + editForm.id + "/formulas?formulaId=" + existing.id,
        { method: "DELETE" }
      ).then((r) => r.json());
      if (res.success) {
        toast.success("Formula deleted.");
        setEditedFormulas((prev) => {
          const next = { ...prev };
          delete next[param.parameterId];
          return next;
        });
        fetchFormulas();
      } else {
        toast.error(res.error || "Failed to delete formula.");
      }
    } catch {
      toast.error("Error deleting formula.");
    }
  };

  const formulaVisibleParams = editForm && editForm.parameters
    ? editForm.parameters.filter((p) => !p.isHeader && p.name && p.name.trim() !== "")
    : [];

  const formulaSimInputParams = formulaVisibleParams.filter((p) => {
    const code = getParamCode(p.name);
    return Object.values(editedFormulas).some(
      (e) => e.formulaStr && e.formulaStr.includes(code)
    );
  });

  const hasAnyFormula = formulaVisibleParams.some(
    (p) => editedFormulas[p.parameterId] && editedFormulas[p.parameterId].formulaStr && editedFormulas[p.parameterId].formulaStr.trim()
  );
  // ─────────────────────────────────────────────────────────────────────────

  const handleTabChange = (e, newVal) => {
    setActiveTab(newVal);
    if (newVal === 1 && editForm.id) {
      fetchFormulas();
    }
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

  const handleAddParamRow = () => {
    const lastParam = editForm.parameters[editForm.parameters.length - 1];
    const defaultUnit = lastParam ? lastParam.unit || "" : "";

    setEditForm((prev) => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        {
          key: `new-${Date.now()}-${Math.random()}`,
          name: "",
          unit: defaultUnit,
          order: (prev.parameters.length + 1).toString(),
          parameterId: null,
          parentId: null,
          parentKey: null,
          isHeader: false,
          editable: true,
          isCalculated: false,
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
    setEditForm((prev) => {
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
    setEditForm((prev) => {
      const updatedParams = [...prev.parameters];
      let updatedRow = { ...updatedParams[index], [field]: value };
      if (field === "isHeader" && value === true) {
        updatedRow.unit = "";
        updatedRow.minValMale = "";
        updatedRow.maxValMale = "";
        updatedRow.normalRangeMale = "";
        updatedRow.minValFemale = "";
        updatedRow.maxValFemale = "";
        updatedRow.normalRangeFemale = "";
        updatedRow.minValBaby = "";
        updatedRow.maxValBaby = "";
        updatedRow.normalRangeBaby = "";
        updatedRow.normalRangeDefault = "";
        updatedRow.isCalculated = false;
      }
      updatedParams[index] = updatedRow;
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
          parameterId: template.id,
          isHeader: false,
          editable: template.editable !== undefined ? template.editable : true,
          isCalculated: template.isCalculated !== undefined ? template.isCalculated : false,
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
        return { ...prev, parameters: newParams };
      });
    } else {
      handleParamChange(index, "name", name);
    }
  };

  /**
   * Bulk-insert all child parameters of a selected test at the given row index.
   * - First row  → test name, isHeader: true  (acts as the group header)
   * - Rest rows  → child parameters, isHeader: false, parentKey → header row's key
   * The placeholder row at `index` is removed and replaced by this block.
   * Existing rows above and below are preserved.
   */
  const handleTestBulkInsert = (index, testOption) => {
    if (!testOption || !Array.isArray(testOption.parameters)) return;

    const ts = Date.now();
    const headerKey = `bulk-header-${testOption.id}-${ts}`;

    // Header row — the test name itself, marked as isHeader
    const headerRow = {
      key: headerKey,
      id: undefined,
      parameterId: null,
      parentId: null,      // headers have no parent
      parentKey: null,
      name: testOption.name,
      isHeader: true,
      unit: "",
      order: "1",
      editable: true,
      isCalculated: false,
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

    // Child rows — all isHeader: false, linked to header via parentKey
    const childRows = testOption.parameters.map((child, i) => ({
      key: `bulk-child-${testOption.id}-${i}-${ts}-${Math.random()}`,
      id: undefined,
      parameterId: child.parameterId || null,
      parentId: null,               // will be set to header's DB id by the API after save
      parentKey: headerKey,          // ← client-side link to the header row
      name: child.name || "",
      isHeader: false,
      unit: child.unit || "",
      order: "1",
      editable: child.editable !== undefined ? child.editable : true,
      isCalculated: child.isCalculated !== undefined ? child.isCalculated : false,
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

    setEditForm((prev) => {
      const before = prev.parameters.slice(0, index);
      const after = prev.parameters.slice(index + 1);
      const merged = [...before, ...newRows, ...after];
      const reSequenced = merged.map((p, idx) => ({ ...p, order: (idx + 1).toString() }));
      return { ...prev, parameters: reSequenced };
    });

    toast.success(`"${testOption.name}" added as header + ${childRows.length} child parameter(s)`);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (activeTab === 1) return; // Ignore form submit on calculation tab

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
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message || (isNew ? "Test created successfully!" : "Test updated successfully!"));
        onSaveSuccess(res.test, isNew);
        onClose();
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

  const handleDeleteFormula = async (id) => {
    if (!confirm("Are you sure you want to delete this formula?")) return;
    try {
      const res = await fetch(`/adminstration/api/tests/${editForm.id}/formulas?formulaId=${id}`, {
        method: "DELETE"
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message || "Formula deleted successfully.");
        fetchFormulas();
      } else {
        toast.error(res.error || "Failed to delete formula.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    }
  };

  const handleEditFormulaClick = (formula) => {
    setFormulaToEdit(formula);
    setFormulaBuilderOpen(true);
  };

  const handleAddFormulaClick = () => {
    setFormulaToEdit(null);
    setFormulaBuilderOpen(true);
  };

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column"
        }
      }}
    >
      <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, flexGrow: 1, overflowY: "auto" }}>

          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Parameters Catalog" />
              <Tab label="Calculations & Formulas" disabled={editForm.id === null} />
            </Tabs>
            {editForm.id === null && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                * Save test first to unlock formula setup
              </Typography>
            )}
          </Box>

          {activeTab === 0 ? (
            <>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Test Metadata
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={5}>
                    <TextField
                      required
                      fullWidth
                      size="small"
                      label="Test Name *"
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Test Code"
                      value={editForm.code}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <TextField
                      required
                      fullWidth
                      size="small"
                      label="Base Price (₹) *"
                      type="number"
                      inputProps={{ step: "0.01" }}
                      value={editForm.price}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))}
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
                        <TableCell align="center" sx={{ fontWeight: 700, width: 50, bgcolor: "#f8fafc" }}>Action</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 450, bgcolor: "#f8fafc" }}>Parameter Name *</TableCell>
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
                        <TableCell align="center" sx={{ fontWeight: 700, width: 90, bgcolor: "#f8fafc" }}>Is Header?</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 200, bgcolor: "#fff7ed" }}>Parent Header</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editForm.parameters.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={15} align="center" sx={{ py: 6, color: "text.secondary" }}>
                            No parameters added yet. Click &quot;Add Parameter&quot; to start.
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
                              "&:hover": { bgcolor: "rgba(0,0,0,0.01)" }
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
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveParamRow(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>

                            {/* Name — combined Test + Parameter autocomplete */}
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
                                    handleParamChange(index, "name", newValue);
                                  } else if (newValue.type === "test") {
                                    handleTestBulkInsert(index, newValue);
                                  } else {
                                    handleParamNameSelect(index, newValue.name);
                                  }
                                }}
                                onInputChange={(event, newInputValue) => {
                                  handleParamChange(index, "name", newInputValue);
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
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                                  />
                                )}
                              />
                            </TableCell>

                            {/* Unit */}
                            <TableCell>
                              <Autocomplete
                                freeSolo
                                disabled={!!param.isHeader}
                                size="small"
                                options={COMMON_LAB_UNITS}
                                value={param.unit}
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
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
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
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                              />
                            </TableCell>

                            {/* Male Min */}
                            <TableCell sx={{ bgcolor: "#f8fafc" }}>
                              <TextField
                                fullWidth
                                disabled={!!param.isHeader}
                                size="small"
                                type="number"
                                inputProps={{ step: "any" }}
                                value={param.minValMale}
                                onChange={(e) => handleParamChange(index, "minValMale", e.target.value)}
                                placeholder="Min"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                              />
                            </TableCell>

                            {/* Male Max */}
                            <TableCell sx={{ bgcolor: "#f8fafc" }}>
                              <TextField
                                fullWidth
                                disabled={!!param.isHeader}
                                size="small"
                                type="number"
                                inputProps={{ step: "any" }}
                                value={param.maxValMale}
                                onChange={(e) => handleParamChange(index, "maxValMale", e.target.value)}
                                placeholder="Max"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                              />
                            </TableCell>

                            {/* Male Range Text */}
                            <TableCell sx={{ bgcolor: "#f8fafc" }}>
                              <TextField
                                fullWidth
                                disabled={!!param.isHeader}
                                size="small"
                                value={param.normalRangeMale}
                                onChange={(e) => handleParamChange(index, "normalRangeMale", e.target.value)}
                                placeholder="Range text"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                              />
                            </TableCell>

                            {/* Female Min */}
                            <TableCell sx={{ bgcolor: "#fdf2f8" }}>
                              <TextField
                                fullWidth
                                disabled={!!param.isHeader}
                                size="small"
                                type="number"
                                inputProps={{ step: "any" }}
                                value={param.minValFemale}
                                onChange={(e) => handleParamChange(index, "minValFemale", e.target.value)}
                                placeholder="Min"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                              />
                            </TableCell>

                            {/* Female Max */}
                            <TableCell sx={{ bgcolor: "#fdf2f8" }}>
                              <TextField
                                fullWidth
                                disabled={!!param.isHeader}
                                size="small"
                                type="number"
                                inputProps={{ step: "any" }}
                                value={param.maxValFemale}
                                onChange={(e) => handleParamChange(index, "maxValFemale", e.target.value)}
                                placeholder="Max"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                              />
                            </TableCell>

                            {/* Female Range Text */}
                            <TableCell sx={{ bgcolor: "#fdf2f8" }}>
                              <TextField
                                fullWidth
                                disabled={!!param.isHeader}
                                size="small"
                                value={param.normalRangeFemale}
                                onChange={(e) => handleParamChange(index, "normalRangeFemale", e.target.value)}
                                placeholder="Range text"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                              />
                            </TableCell>

                            {/* Baby Min */}
                            <TableCell sx={{ bgcolor: "#f0fdf4" }}>
                              <TextField
                                fullWidth
                                disabled={!!param.isHeader}
                                size="small"
                                type="number"
                                inputProps={{ step: "any" }}
                                value={param.minValBaby}
                                onChange={(e) => handleParamChange(index, "minValBaby", e.target.value)}
                                placeholder="Min"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                              />
                            </TableCell>

                            {/* Baby Max */}
                            <TableCell sx={{ bgcolor: "#f0fdf4" }}>
                              <TextField
                                fullWidth
                                disabled={!!param.isHeader}
                                size="small"
                                type="number"
                                inputProps={{ step: "any" }}
                                value={param.maxValBaby}
                                onChange={(e) => handleParamChange(index, "maxValBaby", e.target.value)}
                                placeholder="Max"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                              />
                            </TableCell>

                            {/* Baby Range Text */}
                            <TableCell sx={{ bgcolor: "#f0fdf4" }}>
                              <TextField
                                fullWidth
                                disabled={!!param.isHeader}
                                size="small"
                                value={param.normalRangeBaby}
                                onChange={(e) => handleParamChange(index, "normalRangeBaby", e.target.value)}
                                placeholder="Range text"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                              />
                            </TableCell>

                            {/* Default Range Text */}
                            <TableCell sx={{ bgcolor: "#fafaf9" }}>
                              <TextField
                                fullWidth
                                disabled={!!param.isHeader}
                                size="small"
                                value={param.normalRangeDefault}
                                onChange={(e) => handleParamChange(index, "normalRangeDefault", e.target.value)}
                                placeholder="Default range"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                              />
                            </TableCell>

                            {/* Is Header */}
                            <TableCell align="center" sx={{ bgcolor: "#f8fafc" }}>
                              <Checkbox
                                checked={!!param.isHeader}
                                onChange={(e) => handleParamChange(index, "isHeader", e.target.checked)}
                                color="primary"
                              />
                            </TableCell>

                            {/* Parent Header — link this row to a header group */}
                            <TableCell sx={{ bgcolor: "#fff7ed" }}>
                              {param.isHeader ? (
                                // Headers cannot have a parent
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
                                      // (None) → remove parent link
                                      setEditForm((prev) => {
                                        const p = [...prev.parameters];
                                        p[index] = { ...p[index], parentKey: null, parentId: null };
                                        return { ...prev, parameters: p };
                                      });
                                    } else {
                                      // Find the chosen header row by its key (or string-id for existing rows)
                                      const chosenHeader = editForm.parameters.find(
                                        (h) => h.isHeader && (h.key === selected || String(h.id) === selected)
                                      );
                                      setEditForm((prev) => {
                                        const p = [...prev.parameters];
                                        p[index] = {
                                          ...p[index],
                                          parentKey: chosenHeader?.key || null,
                                          parentId: chosenHeader?.id ? chosenHeader.id : null,
                                        };
                                        return { ...prev, parameters: p };
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
                                  {editForm.parameters
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
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Top bar */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Calculations &amp; Formulas
                </Typography>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<ScienceIcon />}
                  onClick={() => setFormulaTesterOpen(true)}
                  disabled={formulas.length === 0}
                  sx={{ borderRadius: 2 }}
                >
                  Test Formulas
                </Button>
              </Box>


              {loadingFormulas ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        <TableCell sx={{ fontWeight: 700, width: 160 }}>Output (O)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Formula (F)</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 110 }}>Simulate (S)</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 130 }}>Input</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, width: 80 }}>Save</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formulaVisibleParams.map((param) => {
                        const entry = editedFormulas[param.parameterId] || {};
                        const formulaExpr = entry.formulaStr !== undefined ? entry.formulaStr : "";
                        const simResult = evaluateSimFormula(formulaExpr);
                        const hasFormula = formulaExpr.trim().length > 0;
                        const isCalcParam = formulas.some((f) => f.outputParameterId === param.parameterId);

                        return (
                          <TableRow key={param.key} hover>
                            {/* Output — draggable into Formula cell */}
                            <TableCell
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", getParamCode(param.name));
                              }}
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.82rem",
                                cursor: "grab",
                                userSelect: "none",
                                "&:hover": { bgcolor: "rgba(15,118,110,0.06)" }
                              }}
                              title={"Drag to insert \"" + getParamCode(param.name) + "\" into formula"}
                            >
                              <Box>
                                {param.name}
                                <Typography
                                  component="span"
                                  sx={{
                                    display: "block",
                                    fontFamily: "monospace",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    color: "primary.main",
                                    opacity: 0.75,
                                    mt: 0.2
                                  }}
                                >
                                  [{getParamCode(param.name)}]
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* Formula */}
                            <TableCell
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const token = e.dataTransfer.getData("text/plain");
                                if (!token || !param.parameterId) return;
                                const input = document.getElementById("formula-inline-" + param.key);
                                if (input) {
                                  const start = input.selectionStart !== null ? input.selectionStart : formulaExpr.length;
                                  const end = input.selectionEnd !== null ? input.selectionEnd : formulaExpr.length;
                                  const newFormula = formulaExpr.substring(0, start) + token + formulaExpr.substring(end);
                                  handleInlineFormulaChange(param.parameterId, newFormula);
                                  setTimeout(() => {
                                    input.focus();
                                    input.setSelectionRange(start + token.length, start + token.length);
                                  }, 0);
                                } else {
                                  handleInlineFormulaChange(param.parameterId, formulaExpr ? formulaExpr + " " + token : token);
                                }
                              }}
                              sx={{ minWidth: 200 }}
                            >
                              <TextField
                                id={"formula-inline-" + param.key}
                                size="small"
                                fullWidth
                                placeholder="e.g. 100 - a"
                                value={formulaExpr}
                                onChange={(e) => handleInlineFormulaChange(param.parameterId, e.target.value)}
                                disabled={!param.parameterId}
                                sx={{
                                  "& .MuiInputBase-input": {
                                    fontFamily: "monospace",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    py: 0.5
                                  }
                                }}
                              />
                            </TableCell>

                            {/* Simulate result */}
                            <TableCell>
                              {hasFormula && simResult !== "" ? (
                                <Box
                                  sx={{
                                    px: 1, py: 0.4,
                                    bgcolor: "rgba(15,118,110,0.1)",
                                    borderRadius: 1,
                                    fontFamily: "monospace",
                                    fontWeight: 700,
                                    fontSize: "0.88rem",
                                    color: "success.dark",
                                    textAlign: "center"
                                  }}
                                >
                                  {simResult}
                                </Box>
                              ) : (
                                <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.75rem" }}>
                                  {hasFormula ? "—" : ""}
                                </Typography>
                              )}
                            </TableCell>

                            {/* Input — user can always enter a value */}
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={simValues[getParamCode(param.name)] || ""}
                                onChange={(e) => {
                                  const code = getParamCode(param.name);
                                  setSimValues((prev) => ({ ...prev, [code]: e.target.value }));
                                }}
                                sx={{
                                  width: "100%",
                                  "& .MuiInputBase-input": { py: 0.5, fontSize: "0.85rem", textAlign: "right" }
                                }}
                              />
                            </TableCell>

                            {/* Save / Delete */}
                            <TableCell align="center">
                              <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  disabled={!param.parameterId}
                                  title="Save Formula"
                                  onClick={() => handleSaveInlineFormula(param)}
                                >
                                  <SaveIcon fontSize="small" />
                                </IconButton>
                                {(hasFormula || isCalcParam) && (
                                  <IconButton
                                    size="small"
                                    color="error"
                                    title="Delete Formula"
                                    onClick={() => handleDeleteInlineFormula(param)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}


                      {formulaVisibleParams.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 5, color: "text.secondary" }}>
                            No parameters configured. Add parameters in the Parameters Catalog tab first.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          {activeTab === 0 ? (
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
          ) : (
            <Box />
          )}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={onClose}
              color="inherit"
              disabled={saving}
              variant="text"
            >
              Close
            </Button>
            {activeTab === 0 && (
              <Button
                type="submit"
                color="primary"
                disabled={saving}
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : (editForm.id === null ? <AddIcon /> : <EditIcon />)}
              >
                {saving ? "Saving..." : (editForm.id === null ? "Create Test" : "Save Changes")}
              </Button>
            )}
          </Box>
        </DialogActions>
      </form>

      {/* Formula Builder Dialog Modal */}
      {formulaBuilderOpen && (
        <FormulaBuilderDialog
          open={formulaBuilderOpen}
          onClose={() => setFormulaBuilderOpen(false)}
          testId={editForm.id}
          testParameters={editForm.parameters}
          parameterDictionary={parameterDictionary}
          formula={formulaToEdit}
          onSaveSuccess={fetchFormulas}
        />
      )}

      {/* Formula Tester Dialog Modal */}
      {formulaTesterOpen && (
        <FormulaTesterDialog
          open={formulaTesterOpen}
          onClose={() => setFormulaTesterOpen(false)}
          testName={editForm.name}
          testParameters={editForm.parameters}
          parameterDictionary={parameterDictionary}
          formulas={formulas}
        />
      )}
    </Dialog>
  );
}

// Inner Component for testing calculations in real-time
function FormulaTesterDialog({ open, onClose, testName, testParameters, parameterDictionary, formulas }) {
  const [testValues, setTestValues] = useState({});
  const [manualOverrides, setManualOverrides] = useState(new Set());

  // Helper to map parameter names to codes using the dictionary
  const getParamCode = (paramName) => {
    const match = parameterDictionary.find(
      (p) => p.name.toLowerCase().trim() === paramName.toLowerCase().trim()
    );
    return match?.code || paramName.replace(/[^a-zA-Z0-9_]/g, "");
  };

  const isCalculatedParam = (param) => {
    const match = parameterDictionary.find(
      (p) => p.name.toLowerCase().trim() === param.name.toLowerCase().trim()
    );
    const resolvedParam = { ...param, ...match };
    return resolvedParam.isCalculated === true || resolvedParam.editable === false;
  };

  const evaluateTesterFormulas = (currentValues, overrides) => {
    const STANDARD_CODE_FALLBACKS = {
      "polymorphsneutrophils": "NEUT",
      "neutrophils": "NEUT",
      "lymphocytes": "LYMPH",
      "eosinophils": "EOS",
      "monocytes": "MONO",
      "basophils": "BASO",
      "haemoglobin": "HB",
      "hemoglobin": "HB",
      "rbccountredbloodcells": "RBC",
      "rbccount": "RBC",
      "totalwbccount": "WBC",
      "wbccount": "WBC",
      "pcvhaematocrit": "PCV",
      "pcv": "PCV",
      "mcv": "MCV",
      "mch": "MCH",
      "mchc": "MCHC",
      "totalcholesterol": "TC",
      "triglycerides": "TG",
      "hdlcholesterol": "HDL",
      "ldlcholesterol": "LDL",
      "vldlcholesterol": "VLDL",
      "totalbilirubin": "TB",
      "directbilirubin": "DB",
      "indirectbilirubin": "IB",
      "sgotast": "AST",
      "sgptalt": "ALT",
      "alkalinephosphatase": "ALP",
      "totalprotein": "TP",
      "albumin": "ALB",
      "globulin": "GLOB",
      "albuminglobulinratio": "AGR",
      "bloodurea": "UREA",
      "serumcreatinine": "CREAT",
      "bloodureanitrogenbun": "BUN",
      "buncreatinineratio": "BCR",
      "ureacreatinineratio": "UCR",
      "serumuricacid": "UA",
      "serumsodiumna": "NA",
      "serumpotassiumk": "K",
      "serumchloridecl": "CL",
      "estimatedaverageglucoseeag": "EAG",
      "urineproteincreatinineratio": "UPCR"
    };

    const valuesMap = {};

    // 1. Build valuesMap of current manual inputs
    testParameters.forEach((tp) => {
      const match = parameterDictionary.find(
        (p) => p.name.toLowerCase().trim() === tp.name.toLowerCase().trim()
      );

      const rawVal = currentValues[tp.key];
      if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
        const numVal = parseFloat(rawVal);
        if (!isNaN(numVal)) {
          valuesMap[tp.name.trim()] = numVal;
          const normName = tp.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          valuesMap[normName] = numVal;

          const code = (tp.code || match?.code || STANDARD_CODE_FALLBACKS[normName])?.toUpperCase().trim();
          if (code) {
            valuesMap[code] = numVal;
            valuesMap[code.toLowerCase()] = numVal;
          }
          const paramId = tp.id || match?.id;
          if (paramId) {
            valuesMap[paramId] = numVal;
          }
        }
      }
    });

    const evaluatedValues = { ...currentValues };

    // 2. Map outputParameterId to tp.key
    const paramIdToKeyMap = {};
    testParameters.forEach((tp) => {
      const match = parameterDictionary.find(
        (p) => p.name.toLowerCase().trim() === tp.name.toLowerCase().trim()
      );
      const paramId = tp.id || match?.id;
      if (paramId) {
        paramIdToKeyMap[paramId] = tp.key;
      }
    });

    // 3. Multi-pass loop (resolves chained formulas)
    let changed = true;
    let pass = 0;
    const evaluatedSet = new Set();

    while (changed && pass < 5) {
      changed = false;
      pass++;

      for (const form of formulas) {
        if (evaluatedSet.has(form.id)) continue;

        // Skip evaluating if the output parameter has been manually overridden by the user
        const tpKey = paramIdToKeyMap[form.outputParameterId];
        if (tpKey && overrides.has(tpKey)) {
          continue; // skip formula calculation since it has manual input override
        }

        const canEval = checkFormulaDependencies(form.formula, valuesMap);
        if (canEval) {
          const result = evaluateExpression(form.formula, valuesMap);
          if (result !== null && !isNaN(result)) {
            const rounded = parseFloat(result.toFixed(2));

            // Save to valuesMap
            valuesMap[form.outputParameterId] = rounded;
            if (form.outputParameter) {
              valuesMap[form.outputParameter.name.trim()] = rounded;
              valuesMap[form.outputParameter.name.toLowerCase().replace(/[^a-z0-9]/g, "")] = rounded;
              if (form.outputParameter.code) {
                valuesMap[form.outputParameter.code.trim()] = rounded;
                valuesMap[form.outputParameter.code.trim().toLowerCase()] = rounded;
              }
            }

            // Save computed value to state map
            if (tpKey) {
              evaluatedValues[tpKey] = String(rounded);
            }

            evaluatedSet.add(form.id);
            changed = true;
          }
        }
      }
    }

    return evaluatedValues;
  };

  const handleValueChange = (paramKey, val) => {
    const newOverrides = new Set(manualOverrides);
    if (val !== undefined && val !== null && val !== "") {
      newOverrides.add(paramKey);
    } else {
      newOverrides.delete(paramKey);
    }
    setManualOverrides(newOverrides);

    const nextValues = { ...testValues, [paramKey]: val };
    const computed = evaluateTesterFormulas(nextValues, newOverrides);
    setTestValues(computed);
  };

  const handleClear = () => {
    setTestValues({});
    setManualOverrides(new Set());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
        <ScienceIcon color="secondary" />
        Formula Calculation Tester: {testName}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter sample values to verify that formulas trigger and compute automatically. Calculated fields are marked with a calculator icon and cannot be typed in directly.
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 80 }}>S.No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Parameter Name</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 120 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 280 }}>Mock Test Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {testParameters.map((param, index) => {
                const isCalc = isCalculatedParam(param);
                const code = getParamCode(param.name);
                const val = testValues[param.key] || "";

                return (
                  <TableRow key={param.key} hover sx={{ bgcolor: isCalc ? "rgba(124, 58, 237, 0.03)" : "inherit" }}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{param.name}</TableCell>
                    <TableCell sx={{ color: "text.secondary", fontFamily: "monospace" }}>{code}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type={isCalc ? "text" : "number"}
                        placeholder={isCalc ? "Calculated by Formula" : "Enter value..."}
                        disabled={isCalc}
                        value={val}
                        onChange={(e) => handleValueChange(param.key, e.target.value)}
                        fullWidth
                        sx={{
                          "& .MuiInputBase-input": {
                            py: 0.5,
                            fontSize: "0.85rem",
                            fontFamily: isCalc ? "monospace" : "inherit",
                            fontWeight: isCalc ? 700 : 500,
                            color: isCalc ? "primary.main" : "inherit"
                          }
                        }}
                        InputProps={{
                          startAdornment: isCalc && (
                            <CalculateIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                          )
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClear} color="warning" variant="text">
          Clear Values
        </Button>
        <Button onClick={onClose} variant="contained" color="primary">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Inner Component for Formula Building UI
function FormulaBuilderDialog({ open, onClose, testId, testParameters, parameterDictionary, formula, onSaveSuccess }) {
  const [outputParameterId, setOutputParameterId] = useState(() => formula ? formula.outputParameterId : "");
  const [formulaStr, setFormulaStr] = useState(() => formula ? formula.formula || "" : "");
  const [description, setDescription] = useState(() => formula ? formula.description || "" : "");
  const [saving, setSaving] = useState(false);

  // Insert token at current cursor position
  const insertToken = (token) => {
    const input = document.getElementById("formula-textarea");
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = formulaStr;
    const newText = text.substring(0, start) + token + text.substring(end);
    setFormulaStr(newText);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  };

  // Helper to map parameter names to codes using the dictionary
  const getParamCode = (paramName) => {
    const match = parameterDictionary.find(
      (p) => p.name.toLowerCase().trim() === paramName.toLowerCase().trim()
    );
    return match?.code || paramName.replace(/[^a-zA-Z0-9_]/g, "");
  };

  const handleSaveFormula = async (e) => {
    e.preventDefault();
    if (!outputParameterId) {
      toast.error("Please select an output parameter.");
      return;
    }
    if (!formulaStr.trim()) {
      toast.error("Formula expression cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const isNew = !formula;
      const url = isNew
        ? `/adminstration/api/tests/${testId}/formulas`
        : `/adminstration/api/tests/${testId}/formulas`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formula?.id,
          outputParameterId,
          formula: formulaStr,
          description
        })
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message || "Formula saved successfully.");
        onSaveSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to save formula.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving formula.");
    } finally {
      setSaving(false);
    }
  };

  // Simple live validator for brackets balance and symbols
  const getSyntaxValidation = () => {
    if (!formulaStr) return { valid: true, msg: "Enter an expression" };
    let openCount = 0;
    for (const char of formulaStr) {
      if (char === "(") openCount++;
      if (char === ")") openCount--;
      if (openCount < 0) return { valid: false, msg: "Unmatched closing parenthesis ')'" };
    }
    if (openCount > 0) return { valid: false, msg: `Missing ${openCount} closing parenthesis ')'` };

    // Check for invalid mathematical symbols
    const cleanStr = formulaStr.replace(/[a-zA-Z0-9_+\-*/%().\s]/g, "");
    if (cleanStr.length > 0) {
      return { valid: false, msg: `Invalid symbol(s) detected: "${cleanStr}"` };
    }

    return { valid: true, msg: "Formula syntax is valid" };
  };

  const syntaxValidation = getSyntaxValidation();

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="md" fullWidth>
      <form onSubmit={handleSaveFormula}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {formula ? "Edit Formula Configuration" : "Create Test Calculation Formula"}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel id="output-param-label">Output Parameter *</InputLabel>
                <Select
                  labelId="output-param-label"
                  value={outputParameterId}
                  onChange={(e) => setOutputParameterId(e.target.value)}
                  label="Output Parameter *"
                >
                  {testParameters
                    .filter((p) => p.name && p.name.trim() !== "" && p.parameterId)
                    .map((p) => (
                      <MenuItem key={p.parameterId} value={p.parameterId}>
                        {p.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Description / Note"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Calculates indirect fraction"
              />
            </Grid>
          </Grid>

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary", display: "block", mb: 1 }}>
              Formula Editor (Variables are case-sensitive)
            </Typography>
            <TextField
              required
              fullWidth
              multiline
              rows={3}
              id="formula-textarea"
              placeholder="e.g. ALB / (TP - ALB)"
              value={formulaStr}
              onChange={(e) => setFormulaStr(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontFamily: "monospace",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  bgcolor: "rgba(0,0,0,0.01)"
                }
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: syntaxValidation.valid ? "success.main" : "error.main"
                }}
              >
                {syntaxValidation.valid ? "✔ " : "✘ "}
                {syntaxValidation.msg}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1, color: "primary.main" }}>
              Quick Operator Keyboard
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {["+", "-", "*", "/", "%", "(", ")", "."].map((op) => (
                <Button
                  key={op}
                  variant="outlined"
                  size="small"
                  onClick={() => insertToken(op)}
                  sx={{
                    minWidth: 40,
                    fontWeight: 800,
                    fontFamily: "monospace",
                    fontSize: "1rem",
                    borderRadius: 1.5,
                    px: 1.5
                  }}
                >
                  {op}
                </Button>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1, color: "secondary.main" }}>
              Insert Test Parameters (Autofills Code or Name Token)
            </Typography>
            {testParameters.filter((p) => p.name && p.name.trim() !== "").length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                No parameters added to this test yet. Add parameters in the main catalog tab first.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {testParameters
                  .filter((p) => p.name && p.name.trim() !== "")
                  .map((p) => {
                    const code = getParamCode(p.name);
                    return (
                      <Button
                        key={p.key}
                        variant="contained"
                        color="inherit"
                        size="small"
                        onClick={() => insertToken(code)}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          bgcolor: "rgba(0,0,0,0.05)",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.1)" }
                        }}
                      >
                        {p.name} ({code})
                      </Button>
                    );
                  })}
              </Box>
            )}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving || !syntaxValidation.valid}>
            {saving ? "Saving..." : formula ? "Save Changes" : "Save Formula"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
