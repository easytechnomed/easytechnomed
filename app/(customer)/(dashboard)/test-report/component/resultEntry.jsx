"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Grid,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Stack,
  TextField,
  Snackbar,
  Alert,
  InputAdornment,
  Chip,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Calculate as CalculateIcon,
  Print as PrintIcon,
  CloudDone as CloudDoneIcon,
  CloudQueue as CloudQueueIcon,
  CloudOff as CloudOffIcon,
  Drafts as DraftsIcon,
  AutoAwesome as AutoAwesomeIcon
} from "@mui/icons-material";
import ResultEntryMobile from "./resultEntryMobile";
import {
  addValueToValuesMap,
  evaluateExpression,
  checkFormulaDependencies,
  getRangeAndCriticalThresholds,
  determineFlag,
  isQualitativeAbnormal,
  isOutOfRange,
  getReferenceRange,
  calculateAllDependents,
  validateDifferentialCount,
} from "@/lib/formulaUtils";

export default function ResultEntry({ open, onClose, selectedReg, onSaveSuccess, canWrite, handlePrintReport }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [resultRegDetails, setResultRegDetails] = useState(null);
  const [resultTests, setResultTests] = useState([]);
  const [resultValues, setResultValues] = useState({});
  const [manualOverrides, setManualOverrides] = useState(new Set());
  const [reportNotes, setReportNotes] = useState("");
  const [resultSaving, setResultSaving] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Auto-Save States (Always ON like Google Forms)
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle"); // "idle" | "saving" | "saved" | "unsaved" | "error"
  const [lastSavedTime, setLastSavedTime] = useState("");
  const debounceTimerRef = React.useRef(null);
  const isInitialLoadRef = React.useRef(true);
  const isSavingRef = React.useRef(false);
  const draftAbortControllerRef = React.useRef(null);

  // Configurator States
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configTest, setConfigTest] = useState(null);
  const [configParams, setConfigParams] = useState([]);

  // AI Summary generation state
  const [aiGenerating, setAiGenerating] = useState(false);

  // Toast notifications inside component
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const availableDepartments = React.useMemo(() => {
    const map = new Map();
    resultTests.forEach((t) => {
      const deptName = t.department?.name || "General Pathology";
      const deptId = t.department?.id ? String(t.department.id) : (t.departmentId ? String(t.departmentId) : deptName);
      if (!map.has(deptId)) {
        map.set(deptId, { id: deptId, name: deptName });
      }
    });

    const getPriority = (name) => {
      const norm = String(name || "").toUpperCase().trim();
      if (norm.includes("HAEMATOLOGY") || norm.includes("HEMATOLOGY")) return 1;
      if (norm.includes("BIOCHEMISTRY")) return 2;
      return 3;
    };

    return Array.from(map.values()).sort((a, b) => {
      const pA = getPriority(a.name);
      const pB = getPriority(b.name);
      if (pA !== pB) return pA - pB;
      return a.name.localeCompare(b.name);
    });
  }, [resultTests]);

  const filteredTests = React.useMemo(() => {
    if (selectedDepartment === "all") return resultTests;
    return resultTests.filter((t) => {
      const deptName = t.department?.name || "General Pathology";
      const deptId = t.department?.id ? String(t.department.id) : (t.departmentId ? String(t.departmentId) : deptName);
      return deptId === selectedDepartment || deptName === selectedDepartment;
    });
  }, [resultTests, selectedDepartment]);

  const loadParameters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/registrations/${selectedReg.id}/parameters`).then((r) => r.json());
      if (res.success) {
        setResultRegDetails(res.registration);
        const tests = (res.registration.tests || []).map((rt) => rt.test);
        setResultTests(tests);

        const values = {};
        const overrides = new Set();
        (res.registration.results || []).forEach((r) => {
          values[r.testParameterId] = r.value;
          if (r.value !== undefined && r.value !== null && r.value !== "") {
            overrides.add(r.testParameterId);
            overrides.add(String(r.testParameterId));
          }
        });
        const initialCalculated = calculateAllDependents(values, tests, null, overrides, res.registration);
        setResultValues(initialCalculated);
        setManualOverrides(overrides);
        setReportNotes(res.registration.remark || "");
        setAutoSaveStatus("idle");
      } else {
        showToast(res.message || "Failed to load parameters", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to load result parameters", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && selectedReg) {
      if (draftAbortControllerRef.current) {
        draftAbortControllerRef.current.abort();
        draftAbortControllerRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setIsSaved(false);
      setSelectedDepartment("all");
      setAutoSaveStatus("idle");
      setLastSavedTime("");
      isInitialLoadRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadParameters();
    }
    return () => {
      if (draftAbortControllerRef.current) {
        draftAbortControllerRef.current.abort();
        draftAbortControllerRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedReg]);

  // General save API for both manual and background auto-save
  const saveResultsApi = async (isDraft = true, isSilent = false) => {
    if (!resultRegDetails?.id) return;
    if (!canWrite) return;

    // Cancel any previous in-flight draft save before starting a new save
    if (draftAbortControllerRef.current) {
      draftAbortControllerRef.current.abort();
      draftAbortControllerRef.current = null;
    }

    // --- Differential Count 100% Validation (Only on Final Save, not Draft / Auto-save) ---
    if (!isDraft) {
      const dlcError = validateDifferentialCount(resultTests, resultValues);
      if (dlcError) {
        showToast(dlcError, "error");
        return;
      }
    }

    const abortController = new AbortController();
    if (isDraft) {
      draftAbortControllerRef.current = abortController;
    }

    isSavingRef.current = true;

    if (isDraft) {
      if (isSilent) {
        setAutoSaveStatus("saving");
      } else {
        setIsDraftSaving(true);
      }
    } else {
      setResultSaving(true);
    }

    try {
      const resultsData = Object.keys(resultValues)
        .filter((paramId) => !isNaN(parseInt(paramId)) && parseInt(paramId) > 0)
        .map((paramId) => ({
          testParameterId: parseInt(paramId),
          value: resultValues[paramId] !== undefined && resultValues[paramId] !== null ? String(resultValues[paramId]) : ""
        }));

      const apiUrl = isDraft
        ? `/api/registrations/${resultRegDetails.id}/results/draft`
        : `/api/registrations/${resultRegDetails.id}/results`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultsData,
          reportNotes,
        }),
        signal: abortController.signal,
      });

      const res = await response.json();

      if (res.success) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastSavedTime(timeStr);
        setAutoSaveStatus("saved");

        if (!isDraft) {
          showToast(res.message || "Results saved and completed successfully", "success");
          setIsSaved(true);
          if (onSaveSuccess) onSaveSuccess();
        } else if (!isSilent) {
          showToast("Draft saved successfully", "success");
          if (onSaveSuccess) onSaveSuccess();
        }
      } else {
        if (isSilent) {
          setAutoSaveStatus("error");
        } else {
          showToast(res.message || "Failed to save results", "error");
        }
      }
    } catch (err) {
      // If request was aborted by a newer draft request, silently ignore
      if (err.name === "AbortError" || abortController.signal.aborted) {
        return;
      }
      console.error("Save results error:", err);
      if (isSilent) {
        setAutoSaveStatus("error");
      } else {
        showToast(err.message || "Failed to save results", "error");
      }
    } finally {
      if (!abortController.signal.aborted) {
        if (isDraft && draftAbortControllerRef.current === abortController) {
          draftAbortControllerRef.current = null;
        }
        isSavingRef.current = false;
        setIsDraftSaving(false);
        setResultSaving(false);
      }
    }
  };

  // AI Summary Generator
  const handleGenerateAiSummary = async () => {
    if (!resultRegDetails || resultTests.length === 0) return;

    // Check if at least one parameter has an entered value
    const hasAnyValue = Object.values(resultValues).some((v) => v !== undefined && v !== null && String(v).trim() !== "");
    if (!hasAnyValue) {
      showToast("Please enter at least one test result before generating AI remarks.", "warning");
      return;
    }

    setAiGenerating(true);
    try {
      const testsPayload = resultTests.map((test) => {
        const params = (test.parameters || []).map((tp) => {
          const ref = getReferenceRange(tp, resultRegDetails);
          const val = resultValues[tp.id] || "";
          const isAbn = isOutOfRange(val, ref.min, ref.max, tp, ref.rangeStr);
          return {
            name: tp.name,
            code: tp.code,
            isHeader: tp.isHeader,
            value: val,
            unit: tp.unit || "",
            min: ref.min,
            max: ref.max,
            rangeStr: ref.rangeStr,
            flag: isAbn ? (parseFloat(val) > ref.max ? "High" : "Low") : (val ? "Normal" : null),
          };
        });

        return {
          testName: test.name,
          parameters: params,
        };
      });

      const res = await fetch("/api/ai/suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientInfo: {
            age: resultRegDetails.age,
            ageUnit: resultRegDetails.ageUnit,
            gender: resultRegDetails.gender,
            name: resultRegDetails.name || resultRegDetails.patientName,
          },
          tests: testsPayload,
        }),
      }).then((r) => r.json());

      if (res.success && res.suggestion) {
        setReportNotes(res.suggestion);
        showToast("AI Summary generated successfully!", "success");
      } else {
        showToast(res.message || res.error || "Failed to generate AI suggestion", "error");
      }
    } catch (err) {
      console.error("AI Generation Error:", err);
      showToast(err.message || "Failed to contact AI service", "error");
    } finally {
      setAiGenerating(false);
    }
  };

  // Debounced Auto-save (Always ON like Google Forms)
  useEffect(() => {
    if (loading) {
      isInitialLoadRef.current = true;
      return;
    }

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    if (!canWrite || !open || !resultRegDetails?.id) return;

    setAutoSaveStatus("unsaved");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveResultsApi(true, true);
    }, 1200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [resultValues, reportNotes]);

  const handleResultValueChange = (paramId, val, triggerCalc = true) => {
    const newOverrides = new Set(manualOverrides);
    if (val !== undefined && val !== null && val !== "") {
      newOverrides.add(paramId);
      newOverrides.add(String(paramId));
    } else {
      newOverrides.delete(paramId);
      newOverrides.delete(String(paramId));
    }
    setManualOverrides(newOverrides);

    const updatedValues = {
      ...resultValues,
      [paramId]: val
    };

    if (triggerCalc) {
      const finalValues = calculateAllDependents(updatedValues, resultTests, paramId, newOverrides, resultRegDetails);
      setResultValues(finalValues);
    } else {
      setResultValues(updatedValues);
    }
  };

  const handleResultValueBlur = (paramId) => {
    const finalValues = calculateAllDependents(resultValues, resultTests, paramId, manualOverrides, resultRegDetails);
    setResultValues(finalValues);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll(
        ".result-input-field input:not([type='hidden']), .result-input-field [role='combobox'], .result-input-field [role='button']"
      ));
      const index = inputs.indexOf(e.target);
      if (index > -1 && index < inputs.length - 1) {
        const nextInput = inputs[index + 1];
        nextInput.focus();
        if (typeof nextInput.select === "function") {
          nextInput.select();
        }
      } else {
        const remarks = document.getElementById("remarks-field");
        if (remarks) {
          remarks.focus();
        }
      }
    }
  };

  // Configurator Handlers
  const handleOpenConfigurator = (test) => {
    setConfigTest(test);
    const params = test.parameters.map((p) => ({
      id: p.id,
      name: p.name,
      minValMale: p.minValMale !== null ? String(p.minValMale) : "",
      maxValMale: p.maxValMale !== null ? String(p.maxValMale) : "",
      normalRangeMale: p.normalRangeMale || "",
      minValFemale: p.minValFemale !== null ? String(p.minValFemale) : "",
      maxValFemale: p.maxValFemale !== null ? String(p.maxValFemale) : "",
      normalRangeFemale: p.normalRangeFemale || "",
      minValBaby: p.minValBaby !== null ? String(p.minValBaby) : "",
      maxValBaby: p.maxValBaby !== null ? String(p.maxValBaby) : "",
      normalRangeBaby: p.normalRangeBaby || "",
      normalRangeDefault: p.normalRangeDefault || "",
      unit: p.unit || "-NA-"
    }));
    setConfigParams(params);
    setConfigDialogOpen(true);
  };

  const handleConfigParamChange = (index, field, value) => {
    const updated = [...configParams];
    updated[index][field] = value;

    const getAutoRangeString = (min, max) => {
      const trimmedMin = String(min === null || min === undefined ? "" : min).trim();
      const trimmedMax = String(max === null || max === undefined ? "" : max).trim();
      if (trimmedMin && trimmedMax) return `${trimmedMin} - ${trimmedMax}`;
      if (trimmedMin) return `>= ${trimmedMin}`;
      if (trimmedMax) return `<= ${trimmedMax}`;
      return "";
    };

    if (field === "minValMale" || field === "maxValMale") {
      updated[index].normalRangeMale = getAutoRangeString(updated[index].minValMale, updated[index].maxValMale);
    } else if (field === "minValFemale" || field === "maxValFemale") {
      updated[index].normalRangeFemale = getAutoRangeString(updated[index].minValFemale, updated[index].maxValFemale);
    } else if (field === "minValBaby" || field === "maxValBaby") {
      updated[index].normalRangeBaby = getAutoRangeString(updated[index].minValBaby, updated[index].maxValBaby);
    }

    setConfigParams(updated);
  };

  const handleAddConfigParam = () => {
    setConfigParams([
      ...configParams,
      {
        name: "",
        minValMale: "",
        maxValMale: "",
        normalRangeMale: "",
        minValFemale: "",
        maxValFemale: "",
        normalRangeFemale: "",
        minValBaby: "",
        maxValBaby: "",
        normalRangeBaby: "",
        normalRangeDefault: "Normal / Negative",
        unit: "-NA-"
      }
    ]);
  };

  const handleRemoveConfigParam = (index) => {
    const updated = [...configParams];
    updated.splice(index, 1);
    setConfigParams(updated);
  };

  const handleSaveConfigParameters = async () => {
    try {
      const res = await fetch(`/api/registrations/${configTest.id}/parameters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parametersList: configParams }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(res.message, "success");
        setConfigDialogOpen(false);
        // Refresh local parameter list
        loadParameters();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to update parameters setup", "error");
    }
  };

  if (!open) return null;

  if (isMobile) {
    return (
      <ResultEntryMobile
        open={open}
        onClose={onClose}
        loading={loading}
        resultRegDetails={resultRegDetails}
        resultTests={resultTests}
        filteredTests={filteredTests}
        availableDepartments={availableDepartments}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        resultValues={resultValues}
        manualOverrides={manualOverrides}
        setManualOverrides={setManualOverrides}
        reportNotes={reportNotes}
        setReportNotes={setReportNotes}
        autoSaveStatus={autoSaveStatus}
        lastSavedTime={lastSavedTime}
        isDraftSaving={isDraftSaving}
        resultSaving={resultSaving}
        isSaved={isSaved}
        canWrite={canWrite}
        handleResultValueChange={handleResultValueChange}
        handleResultValueBlur={handleResultValueBlur}
        handleKeyDown={handleKeyDown}
        handleGenerateAiSummary={handleGenerateAiSummary}
        aiGenerating={aiGenerating}
        saveResultsApi={saveResultsApi}
        handlePrintReport={handlePrintReport}
        handleOpenConfigurator={handleOpenConfigurator}
        toast={toast}
        setToast={setToast}
        configDialogOpen={configDialogOpen}
        setConfigDialogOpen={setConfigDialogOpen}
        configTest={configTest}
        configParams={configParams}
        handleAddConfigParam={handleAddConfigParam}
        handleRemoveConfigParam={handleRemoveConfigParam}
        handleConfigParamChange={handleConfigParamChange}
        handleSaveConfigParameters={handleSaveConfigParameters}
      />
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            m: 2,
            width: "100%",
            maxHeight: "calc(100vh - 64px)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            px: isMobile ? 1.25 : 2,
            py: isMobile ? 1 : 1.5,
            borderRadius: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: "0.85rem", sm: "1rem" } }}>
              🧪 Test Result: {resultRegDetails ? `${resultRegDetails.name} / ${resultRegDetails.gender} / ${resultRegDetails.age.toFixed(2)} ${resultRegDetails.ageUnit} / Reg: ${resultRegDetails.regNo}` : "Loading..."}
            </Typography>

            {/* Auto-Save Google Form Style Status Badge */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, bgcolor: "rgba(255,255,255,0.18)", px: 1, py: 0.3, borderRadius: 1 }}>
              {autoSaveStatus === "saving" && (
                <>
                  <CircularProgress size={12} sx={{ color: "white" }} />
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.72rem" }}>
                    Saving draft...
                  </Typography>
                </>
              )}
              {autoSaveStatus === "saved" && (
                <>
                  <CloudDoneIcon sx={{ fontSize: 15, color: "#86efac" }} />
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.72rem" }}>
                    {lastSavedTime ? `Draft saved (${lastSavedTime})` : "All changes saved in draft"}
                  </Typography>
                </>
              )}
              {autoSaveStatus === "unsaved" && (
                <>
                  <CloudQueueIcon sx={{ fontSize: 15, color: "#fef08a" }} />
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.72rem" }}>
                    Saving changes...
                  </Typography>
                </>
              )}
              {autoSaveStatus === "error" && (
                <>
                  <CloudOffIcon sx={{ fontSize: 15, color: "#fca5a5" }} />
                  <Typography variant="caption" sx={{ color: "#fca5a5", fontWeight: 700, fontSize: "0.72rem" }}>
                    Auto-save offline
                  </Typography>
                </>
              )}
              {autoSaveStatus === "idle" && (
                <>
                  <CloudDoneIcon sx={{ fontSize: 15, color: "#86efac" }} />
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.72rem" }}>
                    Auto-save is ON
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          <IconButton onClick={onClose} size="small" sx={{ color: "primary.contrastText" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 1 : 2, mt: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : resultRegDetails ? (
            <>
              {/* Header info */}
              <Box sx={{ mb: isMobile ? 1.5 : 2, p: isMobile ? 1 : 2, bgcolor: "grey.50", borderRadius: isMobile ? 1 : 1.5, border: "1px solid", borderColor: "grey.200" }}>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Barcode</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>{resultRegDetails.barcode?.replace(/^,\s*/, "") || "-"}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Mobile No</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>{resultRegDetails.mobileNo}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">Filter by Department</Typography>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      sx={{
                        bgcolor: "white",
                        mt: 0.3,
                        "& .MuiSelect-select": {
                          py: 0.5,
                          fontSize: { xs: "16px", sm: "0.85rem" },
                          fontWeight: 700,
                        },
                      }}
                    >
                      <MenuItem value="all">
                        <em>All Departments ({resultTests.length})</em>
                      </MenuItem>
                      {availableDepartments.map((dept) => {
                        const count = resultTests.filter(t => {
                          const dName = t.department?.name || "General Pathology";
                          const dId = t.department?.id ? String(t.department.id) : (t.departmentId ? String(t.departmentId) : dName);
                          return dId === dept.id || dName === dept.name;
                        }).length;
                        return (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.name} ({count})
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">Referred By</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>{resultRegDetails.refBy?.name || "Self"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Quick Department Filter Chips */}
              {/* {availableDepartments.length > 1 && (
                <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mr: 0.5 }}>
                    Department:
                  </Typography>
                  <Chip
                    label={`All (${resultTests.length})`}
                    size="small"
                    clickable
                    color={selectedDepartment === "all" ? "primary" : "default"}
                    variant={selectedDepartment === "all" ? "filled" : "outlined"}
                    onClick={() => setSelectedDepartment("all")}
                    sx={{ fontWeight: selectedDepartment === "all" ? 700 : 500 }}
                  />
                  {availableDepartments.map((dept) => {
                    const isSelected = selectedDepartment === dept.id;
                    const count = resultTests.filter(t => {
                      const dName = t.department?.name || "General Pathology";
                      const dId = t.department?.id ? String(t.department.id) : (t.departmentId ? String(t.departmentId) : dName);
                      return dId === dept.id || dName === dept.name;
                    }).length;
                    return (
                      <Chip
                        key={dept.id}
                        label={`${dept.name} (${count})`}
                        size="small"
                        clickable
                        color={isSelected ? "primary" : "default"}
                        variant={isSelected ? "filled" : "outlined"}
                        onClick={() => setSelectedDepartment(dept.id)}
                        sx={{ fontWeight: isSelected ? 700 : 500 }}
                      />
                    );
                  })}
                </Box>
              )} */}

              {/* Loop through filtered tests and render their parameters */}
              {filteredTests.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center", bgcolor: "grey.50", borderRadius: 2, border: "1px dashed", borderColor: "grey.300" }}>
                  <Typography variant="body2" color="text.secondary">
                    No tests found for the selected department.
                  </Typography>
                </Box>
              ) : (
                filteredTests.map((test) => {
                  const params = test.parameters || [];
                  const testDeptName = test.department?.name || (test.departmentId ? `Dept #${test.departmentId}` : null);
                  return (
                    <Box key={test.id} sx={{ mb: 4 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, px: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", borderLeft: "4px solid", pl: 1, borderColor: "primary.main" }}>
                            {test.name} ({test.code})
                          </Typography>
                          {testDeptName && (
                            <Chip
                              label={testDeptName}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                bgcolor: "rgba(15, 118, 110, 0.08)",
                                color: "primary.main",
                                border: "1px solid rgba(15, 118, 110, 0.2)"
                              }}
                            />
                          )}
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<SettingsIcon />}
                          onClick={() => handleOpenConfigurator(test)}
                          sx={{ textTransform: "none", py: 0.3 }}
                        >
                          Configure Parameters
                        </Button>
                      </Box>
                      <Divider sx={{ mb: 1.5 }} />

                      {params.length === 0 ? (
                        <Box sx={{ p: 3, border: "1px dashed", borderColor: "grey.300", borderRadius: 1, textAlign: "center" }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            No parameters configured for this test yet.
                          </Typography>
                          <Button size="small" variant="contained" onClick={() => handleOpenConfigurator(test)}>
                            Add/Configure Parameters
                          </Button>
                        </Box>
                      ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, overflowX: "auto", width: "100%", borderRadius: 1.5 }}>
                          <Table size="small" sx={{ minWidth: { xs: 560, sm: 650 } }}>
                            <TableHead sx={{ bgcolor: "grey.100" }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700, width: { xs: 45, sm: 60 }, px: { xs: 1, sm: 1.5 }, py: 1 }}>S/No</TableCell>
                                <TableCell sx={{ fontWeight: 700, px: { xs: 1, sm: 1.5 }, py: 1 }}>Test Parameter</TableCell>
                                <TableCell sx={{ fontWeight: 700, px: { xs: 1, sm: 1.5 }, py: 1 }}>Normal Value</TableCell>
                                <TableCell sx={{ fontWeight: 700, px: { xs: 1, sm: 1.5 }, py: 1 }}>Unit</TableCell>
                                <TableCell sx={{ fontWeight: 700, width: { xs: 200, sm: 250 }, px: { xs: 1, sm: 1.5 }, py: 1 }}>Result</TableCell>
                                <TableCell sx={{ fontWeight: 700, width: { xs: 60, sm: 80 }, px: { xs: 1, sm: 1.5 }, py: 1 }}>Order</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(() => {
                                let mainCounter = 0;
                                let currentHeaderInfo = null;
                                const headerInfoById = new Map();

                                const computedRows = params.map((param) => {
                                  const ref = getReferenceRange(param, resultRegDetails);
                                  const isHeader = Boolean(param.isHeader) || (param.isHeader === undefined && !param.unit && (!ref || !ref.rangeStr || ref.rangeStr === "" || ref.rangeStr === "-NA-"));

                                  if (isHeader) {
                                    mainCounter++;
                                    const headerInfo = {
                                      mainNumber: mainCounter,
                                      name: param.name,
                                      childCounter: 0
                                    };
                                    headerInfoById.set(param.id, headerInfo);
                                    currentHeaderInfo = headerInfo;
                                    return {
                                      param,
                                      ref,
                                      isHeader: true,
                                      isChild: false,
                                      displaySerial: `${mainCounter}.`
                                    };
                                  }

                                  // Check if this parameter is a child
                                  let parentInfo = null;
                                  if (param.parentId != null && headerInfoById.has(param.parentId)) {
                                    parentInfo = headerInfoById.get(param.parentId);
                                  } else if (param.parentId === undefined && currentHeaderInfo != null) {
                                    parentInfo = currentHeaderInfo;
                                  }

                                  if (parentInfo) {
                                    parentInfo.childCounter++;
                                    return {
                                      param,
                                      ref,
                                      isHeader: false,
                                      isChild: true,
                                      displaySerial: `${parentInfo.mainNumber}.${parentInfo.childCounter}`
                                    };
                                  } else {
                                    mainCounter++;
                                    currentHeaderInfo = null;
                                    return {
                                      param,
                                      ref,
                                      isHeader: false,
                                      isChild: false,
                                      displaySerial: `${mainCounter}`
                                    };
                                  }
                                });

                                return computedRows.map(({ param, ref, isHeader, isChild, displaySerial }) => {
                                  if (isHeader) {
                                    return (
                                      <TableRow
                                        key={param.id}
                                        sx={{
                                          bgcolor: "rgba(15, 118, 110, 0.06)",
                                          borderLeft: "4px solid",
                                          borderColor: "primary.main"
                                        }}
                                      >
                                        <TableCell sx={{ fontWeight: 800, color: "primary.main", py: 1, px: { xs: 1, sm: 1.5 } }}>
                                          {displaySerial}
                                        </TableCell>
                                        <TableCell colSpan={5} sx={{ fontWeight: 800, color: "primary.main", py: 1, px: { xs: 1, sm: 1.5 } }}>
                                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", fontSize: { xs: "0.82rem", sm: "0.875rem" } }}>
                                              {param.name}
                                            </Typography>
                                            <Chip
                                              label="Section Header"
                                              size="small"
                                              sx={{
                                                height: 20,
                                                fontSize: "0.68rem",
                                                fontWeight: 700,
                                                bgcolor: "rgba(15, 118, 110, 0.12)",
                                                color: "primary.main"
                                              }}
                                            />
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }

                                  const val = resultValues[param.id] || "";
                                  const isAbnormal = isOutOfRange(val, ref.min, ref.max, param, ref.rangeStr);

                                  const normalValLower = (ref.rangeStr || "").toLowerCase();
                                  const isParamOptionType = param.valueType === "OPTIONS";
                                  const isParamTextType = param.valueType === "TEXT";

                                  let dropdownOptions = [];
                                  if (param.options) {
                                    dropdownOptions = param.options
                                      .split(",")
                                      .map(o => o.trim())
                                      .filter(Boolean);
                                  } else if (isParamOptionType) {
                                    if (normalValLower.includes("reactive")) {
                                      dropdownOptions = ["Non-Reactive", "Reactive"];
                                    } else if (normalValLower.includes("absent") || normalValLower.includes("present")) {
                                      dropdownOptions = ["Absent", "Present"];
                                    } else if (normalValLower.includes("detected")) {
                                      dropdownOptions = ["Not Detected", "Detected"];
                                    } else {
                                      dropdownOptions = ["Negative", "Positive"];
                                    }
                                  } else if (normalValLower.includes("negative") || normalValLower.includes("positive")) {
                                    dropdownOptions = ["Negative", "Positive"];
                                  } else if (normalValLower.includes("reactive")) {
                                    dropdownOptions = ["Non-Reactive", "Reactive"];
                                  } else if (normalValLower.includes("absent") || normalValLower.includes("present")) {
                                    dropdownOptions = ["Absent", "Present"];
                                  }

                                  if (val && !dropdownOptions.includes(val) && dropdownOptions.length > 0) {
                                    dropdownOptions.push(val);
                                  }

                                  const hasOptions = dropdownOptions.length > 0;

                                  // Check if parameter has an active math formula
                                  const testFormulas = resultTests.flatMap(t => t.formulas || []);
                                  const paramFormula = testFormulas.find(f => f.outputParameterId === param.parameterId || f.outputParameterId === param.id);
                                  const hasFormula = !!paramFormula;
                                  const isOverridden = manualOverrides.has(param.id) || manualOverrides.has(String(param.id));

                                  return (
                                    <TableRow key={param.id} hover>
                                      <TableCell sx={{ color: isChild ? "text.secondary" : "text.primary", fontWeight: isChild ? 600 : 700, px: { xs: 1, sm: 1.5 }, py: { xs: 0.75, sm: 1 } }}>
                                        {displaySerial}
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 600, pl: isChild ? { xs: 2.5, sm: 3.5 } : { xs: 1, sm: 2 }, px: { xs: 1, sm: 1.5 }, py: { xs: 0.75, sm: 1 } }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                          {isChild && (
                                            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700 }}>↳</Typography>
                                          )}
                                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: "0.82rem", sm: "0.875rem" } }}>
                                            {param.name}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell sx={{ fontSize: { xs: "0.8rem", sm: "0.85rem" }, px: { xs: 1, sm: 1.5 }, py: { xs: 0.75, sm: 1 } }}>
                                        {ref.rangeStr || ""}
                                      </TableCell>
                                      <TableCell sx={{ color: "text.secondary", fontSize: { xs: "0.8rem", sm: "0.85rem" }, px: { xs: 1, sm: 1.5 }, py: { xs: 0.75, sm: 1 } }}>{param.unit || "-"}</TableCell>
                                      <TableCell sx={{ minWidth: { xs: 170, sm: 220 }, px: { xs: 1, sm: 1.5 }, py: { xs: 0.75, sm: 1 } }}>
                                        {/* Quick Select Buttons for Qualitative Options */}
                                        {hasOptions && (
                                          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 0.75 }}>
                                            {dropdownOptions.map((opt) => {
                                              const isSelected = (val || "").trim().toLowerCase() === opt.trim().toLowerCase();
                                              const isOptAbnormal = isQualitativeAbnormal(opt, ref.rangeStr);
                                              return (
                                                <Chip
                                                  key={opt}
                                                  label={opt}
                                                  size="small"
                                                  clickable
                                                  onClick={() => handleResultValueChange(param.id, opt, true)}
                                                  sx={{
                                                    height: 24,
                                                    fontSize: "0.75rem",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                    bgcolor: isSelected
                                                      ? (isOptAbnormal ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)")
                                                      : "rgba(0, 0, 0, 0.05)",
                                                    color: isSelected
                                                      ? (isOptAbnormal ? "#dc2626" : "#059669")
                                                      : "text.primary",
                                                    border: isSelected
                                                      ? `1.5px solid ${isOptAbnormal ? "#dc2626" : "#059669"}`
                                                      : "1px solid rgba(0, 0, 0, 0.12)",
                                                    "&:hover": {
                                                      bgcolor: isSelected
                                                        ? (isOptAbnormal ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)")
                                                        : "rgba(0, 0, 0, 0.1)"
                                                    }
                                                  }}
                                                />
                                              );
                                            })}
                                          </Box>
                                        )}

                                        <TextField
                                          className="result-input-field"
                                          select={hasOptions}
                                          size="small"
                                          fullWidth
                                          disabled={!param.editable}
                                          value={val}
                                          onChange={(e) => handleResultValueChange(param.id, e.target.value, true)}
                                          onBlur={() => handleResultValueBlur(param.id)}
                                          onKeyDown={handleKeyDown}
                                          error={isAbnormal}
                                          placeholder={isParamTextType ? "Enter note..." : "Enter result..."}
                                          sx={{
                                            "& .MuiInputBase-root": {
                                              bgcolor: isAbnormal ? "rgba(239, 68, 68, 0.12)" : "inherit",
                                              borderColor: isAbnormal ? "#ef4444" : undefined,
                                              minHeight: { xs: 34, sm: 32 },
                                            },
                                            "& .MuiInputBase-input": {
                                              py: { xs: 0.6, sm: 0.5 },
                                              px: 1,
                                              fontSize: { xs: "16px", sm: "0.85rem" }, // 16px on mobile prevents browser auto-zoom
                                              fontWeight: isAbnormal ? 700 : (hasFormula && !isOverridden ? 700 : 500),
                                              color: isAbnormal ? "#b91c1c" : "inherit"
                                            },
                                            "& .MuiSelect-select": {
                                              py: { xs: 0.6, sm: 0.5 },
                                              px: 1,
                                              fontSize: { xs: "16px", sm: "0.85rem" },
                                            }
                                          }}
                                          slotProps={{
                                            input: {
                                              endAdornment: (isAbnormal || hasFormula) && (
                                                <InputAdornment position="end">
                                                  {hasFormula && (
                                                    <Tooltip title={isOverridden ? "Formula overridden (manual entry) - Click to restore formula" : `Calculated by formula: ${paramFormula.formula}`}>
                                                      <IconButton
                                                        size="small"
                                                        tabIndex={-1}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          if (isOverridden) {
                                                            const newOverrides = new Set(manualOverrides);
                                                            newOverrides.delete(param.id);
                                                            newOverrides.delete(String(param.id));
                                                            setManualOverrides(newOverrides);
                                                            const finalValues = calculateAllDependents(resultValues, resultTests, param.id, newOverrides);
                                                            setResultValues(finalValues);
                                                          }
                                                        }}
                                                        sx={{ p: 0.25, mr: isAbnormal ? 0.5 : 0 }}
                                                      >
                                                        <CalculateIcon
                                                          color={isOverridden ? "action" : "primary"}
                                                          sx={{ fontSize: "1.1rem", opacity: isOverridden ? 0.5 : 0.8 }}
                                                        />
                                                      </IconButton>
                                                    </Tooltip>
                                                  )}
                                                  {isAbnormal && (
                                                    <Tooltip title="Out of normal reference range!">
                                                      <WarningIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                                                    </Tooltip>
                                                  )}
                                                </InputAdornment>
                                              )
                                            }
                                          }}
                                        >
                                          {hasOptions ? (
                                            [
                                              <MenuItem key="empty" value=""><em>Select option</em></MenuItem>,
                                              ...dropdownOptions.map(opt => (
                                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                              ))
                                            ]
                                          ) : null}
                                        </TextField>
                                      </TableCell>
                                      <TableCell sx={{ px: { xs: 1, sm: 1.5 }, py: { xs: 0.75, sm: 1 } }}>{param.order}</TableCell>
                                    </TableRow>
                                  );
                                });
                              })()}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  );
                }))}

              {/* Note/Remark editor */}
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.2, flexWrap: "wrap", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Report Remarks / Summary Note
                    </Typography>
                    <Chip
                      label="AI Enabled"
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
                    />
                  </Box>

                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    disabled={aiGenerating}
                    onClick={handleGenerateAiSummary}
                    startIcon={aiGenerating ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      borderRadius: "8px",
                      px: 1.8,
                      py: 0.6,
                      background: "linear-gradient(135deg, rgba(15, 118, 110, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)",
                      borderColor: "primary.light",
                      "&:hover": {
                        background: "linear-gradient(135deg, rgba(15, 118, 110, 0.16) 0%, rgba(59, 130, 246, 0.16) 100%)",
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    {aiGenerating ? "Generating Summary..." : (reportNotes ? "✨ Regenerate AI Summary" : "✨ AI Generate Summary")}
                  </Button>
                </Box>
                <TextField
                  id="remarks-field"
                  fullWidth
                  multiline
                  rows={4}
                  size="small"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Enter overall review comment, clinical impression (supports **bold** text) or click 'AI Generate Summary'..."
                  variant="outlined"
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: { xs: "16px", sm: "0.875rem" },
                    },
                  }}
                />
                {reportNotes && reportNotes.includes("**") && (
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: "grey.50", borderRadius: 1.5, border: "1px dashed", borderColor: "grey.300" }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", display: "block", mb: 0.5 }}>
                      Formatted Report / PDF Preview:
                    </Typography>
                    {reportNotes.split("\n").map((line, lineIdx) => {
                      const parts = [];
                      const regex = /\*\*(.*?)\*\*/g;
                      let lastIndex = 0;
                      let match;

                      while ((match = regex.exec(line)) !== null) {
                        if (match.index > lastIndex) {
                          parts.push(line.substring(lastIndex, match.index));
                        }
                        parts.push(
                          <strong key={`b-${lineIdx}-${match.index}`} style={{ fontWeight: 700, color: "#0f766e" }}>
                            {match[1]}
                          </strong>
                        );
                        lastIndex = regex.lastIndex;
                      }

                      if (lastIndex < line.length) {
                        parts.push(line.substring(lastIndex));
                      }

                      return (
                        <Typography key={`prev-${lineIdx}`} variant="caption" sx={{ display: "block", color: "text.primary", lineHeight: 1.4 }}>
                          {parts.length > 0 ? parts : "\u00A0"}
                        </Typography>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center">
              No registration details found.
            </Typography>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: isMobile ? 1 : 3,
            py: isMobile ? 1 : 1.5,
            bgcolor: "grey.50",
            borderTop: "1px solid",
            borderColor: "divider",
            gap: 1,
            flexWrap: "wrap",
            position: isMobile ? "sticky" : "static",
            bottom: 0,
            zIndex: 10,
          }}
        >
          {isSaved && (
            <Button
              onClick={() => {
                onClose();
                if (handlePrintReport) {
                  handlePrintReport();
                }
              }}
              variant="contained"
              color="success"
              size="small"
              startIcon={<PrintIcon />}
            >
              Print Report
            </Button>
          )}

          {/* Auto-save status badge in footer */}
          <Chip
            icon={
              autoSaveStatus === "saving" ? (
                <CircularProgress size={12} color="inherit" />
              ) : autoSaveStatus === "error" ? (
                <CloudOffIcon sx={{ fontSize: 14 }} />
              ) : (
                <CloudDoneIcon sx={{ fontSize: 14, color: "#0f766e !important" }} />
              )
            }
            label={
              autoSaveStatus === "saving"
                ? "Auto-saving..."
                : autoSaveStatus === "error"
                  ? "Offline (Auto-save pending)"
                  : lastSavedTime
                    ? `Auto-saved (${lastSavedTime})`
                    : "Auto-save is ON"
            }
            size="small"
            variant="outlined"
            sx={{
              borderColor: "rgba(15, 118, 110, 0.3)",
              color: "primary.main",
              fontWeight: 600,
              fontSize: "0.75rem",
              bgcolor: "white"
            }}
          />

          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={onClose} variant="outlined" size="small">
            Cancel
          </Button>

          {/* Save as Draft Button */}
          <Tooltip title={!canWrite ? "You do not have permission to enter results" : ""}>
            <span>
              <Button
                onClick={() => saveResultsApi(true, false)}
                variant="outlined"
                color="primary"
                size="small"
                startIcon={isDraftSaving ? <CircularProgress size={16} color="inherit" /> : <DraftsIcon />}
                disabled={isDraftSaving || resultSaving || !canWrite || loading}
                sx={{ fontWeight: 700 }}
              >
                Save as Draft
              </Button>
            </span>
          </Tooltip>

          {/* Save Results & Complete Button */}
          <Tooltip title={!canWrite ? "You do not have permission to enter results" : ""}>
            <span>
              <Button
                onClick={() => saveResultsApi(false, false)}
                variant="contained"
                size="small"
                startIcon={resultSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={resultSaving || isDraftSaving || !canWrite || loading}
                sx={{ fontWeight: 700 }}
              >
                Save Results & Complete
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* --- PARAMETER CONFIGURATOR DIALOG --- */}
      {configTest && (
        <Dialog
          open={configDialogOpen}
          onClose={() => setConfigDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 2 },
              m: { xs: 0, sm: 2 },
              width: "100%",
              maxHeight: { xs: "100%", sm: "calc(100vh - 64px)" },
            },
          }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText", py: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              ⚙ Configure Parameters : {configTest.name}
            </Typography>
            <IconButton onClick={() => setConfigDialogOpen(false)} size="small" sx={{ color: "primary.contrastText" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Setup the sub-fields and normal reference ranges for Male, Female, and Baby groups.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddConfigParam}
                sx={{ textTransform: "none" }}
              >
                Add Field
              </Button>
            </Box>

            {configParams.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center", border: "1px dashed", borderColor: "grey.300", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  No parameters defined. Click &quot;Add Field&quot; to define parameters.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2} sx={{ maxHeight: 450, overflowY: "auto", pr: 1 }}>
                {configParams.map((param, index) => (
                  <Card variant="outlined" key={index} sx={{ p: 2, overflow: "visible" }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={5.5}>
                        <TextField
                          label="Parameter Name"
                          size="small"
                          fullWidth
                          value={param.name}
                          onChange={(e) => handleConfigParamChange(index, "name", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={2.5}>
                        <TextField
                          label="Unit"
                          size="small"
                          fullWidth
                          value={param.unit}
                          onChange={(e) => handleConfigParamChange(index, "unit", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          label="Default Normal Text"
                          size="small"
                          fullWidth
                          value={param.normalRangeDefault}
                          onChange={(e) => handleConfigParamChange(index, "normalRangeDefault", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={1} sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveConfigParam(index)}
                          title="Remove Parameter"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>

                      <Grid item xs={12} sx={{ my: 0.5 }}><Divider /></Grid>

                      {/* Male Ranges */}
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>Male Ranges</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <TextField label="Min" size="small" type="number" value={param.minValMale} onChange={(e) => handleConfigParamChange(index, "minValMale", e.target.value)} />
                          <TextField label="Max" size="small" type="number" value={param.maxValMale} onChange={(e) => handleConfigParamChange(index, "maxValMale", e.target.value)} />
                        </Stack>
                        <TextField label="Display Range Label" size="small" fullWidth sx={{ mt: 1 }} disabled value={param.normalRangeMale} />
                      </Grid>

                      {/* Female Ranges */}
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "secondary.main" }}>Female Ranges</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <TextField label="Min" size="small" type="number" value={param.minValFemale} onChange={(e) => handleConfigParamChange(index, "minValFemale", e.target.value)} />
                          <TextField label="Max" size="small" type="number" value={param.maxValFemale} onChange={(e) => handleConfigParamChange(index, "maxValFemale", e.target.value)} />
                        </Stack>
                        <TextField label="Display Range Label" size="small" fullWidth sx={{ mt: 1 }} disabled value={param.normalRangeFemale} />
                      </Grid>

                      {/* Baby Ranges */}
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "warning.main" }}>Baby/Child Ranges</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <TextField label="Min" size="small" type="number" value={param.minValBaby} onChange={(e) => handleConfigParamChange(index, "minValBaby", e.target.value)} />
                          <TextField label="Max" size="small" type="number" value={param.maxValBaby} onChange={(e) => handleConfigParamChange(index, "maxValBaby", e.target.value)} />
                        </Stack>
                        <TextField label="Display Range Label" size="small" fullWidth sx={{ mt: 1 }} disabled value={param.normalRangeBaby} />
                      </Grid>
                    </Grid>
                  </Card>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setConfigDialogOpen(false)} variant="outlined" size="small">Cancel</Button>
            <Tooltip title={!canWrite ? "You do not have permission to save configuration parameters" : ""}>
              <span>
                <Button onClick={handleSaveConfigParameters} variant="contained" size="small" startIcon={<SaveIcon />} disabled={!canWrite}>
                  Save Parameters Setup
                </Button>
              </span>
            </Tooltip>
          </DialogActions>
        </Dialog>
      )}

      {/* Internal Component Toast Alerts */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}
