"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
  Dialog,
  MenuItem,
  Stack,
  TextField,
  Snackbar,
  Alert,
  InputAdornment,
  Chip,
  Button
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
  AutoAwesome as AutoAwesomeIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  QrCode as QrCodeIcon,
  LocalHospital as DoctorIcon
} from "@mui/icons-material";
import {
  isOutOfRange,
  getReferenceRange,
  isQualitativeAbnormal,
  calculateAllDependents
} from "@/lib/formulaUtils";

export default function ResultEntryMobile({
  open,
  onClose,
  loading,
  resultRegDetails,
  resultTests,
  filteredTests,
  availableDepartments,
  selectedDepartment,
  setSelectedDepartment,
  resultValues,
  manualOverrides,
  setManualOverrides,
  reportNotes,
  setReportNotes,
  autoSaveStatus,
  lastSavedTime,
  isDraftSaving,
  resultSaving,
  isSaved,
  canWrite,
  handleResultValueChange,
  handleResultValueBlur,
  handleKeyDown,
  handleGenerateAiSummary,
  aiGenerating,
  saveResultsApi,
  handlePrintReport,
  handleOpenConfigurator,
  toast,
  setToast,
  configDialogOpen,
  setConfigDialogOpen,
  configTest,
  configParams,
  handleAddConfigParam,
  handleRemoveConfigParam,
  handleConfigParamChange,
  handleSaveConfigParameters
}) {
  if (!open) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: "#f8fafc",
            width: "100vw",
            height: "100vh",
            m: 0,
            p: 0,
            display: "flex",
            flexDirection: "column",
            overflowX: "hidden"
          }
        }}
      >
        {/* --- 1. TOP APP BAR (Sticky Header) --- */}
        <Box
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            px: 1.5,
            py: 1.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            position: "sticky",
            top: 0,
            zIndex: 1100
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {resultRegDetails?.name || "Loading..."}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontSize: "0.72rem", display: "block" }}>
                {resultRegDetails ? `${resultRegDetails.gender} • ${resultRegDetails.age} ${resultRegDetails.ageUnit} • Reg: ${resultRegDetails.regNo}` : ""}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
            {/* Auto-Save Pill */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                bgcolor: "rgba(255,255,255,0.2)",
                px: 1,
                py: 0.3,
                borderRadius: 4
              }}
            >
              {autoSaveStatus === "saving" && (
                <>
                  <CircularProgress size={10} sx={{ color: "white" }} />
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.68rem" }}>
                    Saving
                  </Typography>
                </>
              )}
              {autoSaveStatus === "saved" && (
                <>
                  <CloudDoneIcon sx={{ fontSize: 13, color: "#86efac" }} />
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.68rem" }}>
                    Saved
                  </Typography>
                </>
              )}
              {autoSaveStatus === "unsaved" && (
                <>
                  <CloudQueueIcon sx={{ fontSize: 13, color: "#fef08a" }} />
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.68rem" }}>
                    Syncing
                  </Typography>
                </>
              )}
              {autoSaveStatus === "error" && (
                <>
                  <CloudOffIcon sx={{ fontSize: 13, color: "#fca5a5" }} />
                  <Typography variant="caption" sx={{ color: "#fca5a5", fontWeight: 700, fontSize: "0.68rem" }}>
                    Offline
                  </Typography>
                </>
              )}
              {autoSaveStatus === "idle" && (
                <>
                  <CloudDoneIcon sx={{ fontSize: 13, color: "#86efac" }} />
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.68rem" }}>
                    Auto-save ON
                  </Typography>
                </>
              )}
            </Box>

            <IconButton onClick={onClose} size="small" sx={{ color: "white", p: 0.5 }}>
              <CloseIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Box>
        </Box>

        {/* --- 2. MAIN SCROLLABLE CONTENT BODY --- */}
        <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", p: 1.25, pb: 12 }}>
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 10, gap: 1.5 }}>
              <CircularProgress size={36} />
              <Typography variant="body2" color="text.secondary">Loading parameters...</Typography>
            </Box>
          ) : resultRegDetails ? (
            <>
              {/* --- PATIENT QUICK SUMMARY CARD --- */}
              <Card variant="outlined" sx={{ mb: 1.5, borderRadius: 2, bgcolor: "white" }}>
                <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                      <QrCodeIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary" }}>
                        {resultRegDetails.barcode?.replace(/^,\s*/, "") || resultRegDetails.labId || "-"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                      <PhoneIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary" }}>
                        {resultRegDetails.mobileNo || "-"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                      <DoctorIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary" }}>
                        {resultRegDetails.refBy?.name || "Self"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Department Filter Pills */}
                  {availableDepartments.length > 1 && (
                    <Box sx={{ display: "flex", gap: 0.75, overflowX: "auto", py: 0.5, "::-webkit-scrollbar": { display: "none" } }}>
                      <Chip
                        label={`All (${resultTests.length})`}
                        size="small"
                        clickable
                        onClick={() => setSelectedDepartment("all")}
                        color={selectedDepartment === "all" ? "primary" : "default"}
                        variant={selectedDepartment === "all" ? "filled" : "outlined"}
                        sx={{ fontWeight: 700, fontSize: "0.75rem", height: 26 }}
                      />
                      {availableDepartments.map((dept) => {
                        const count = resultTests.filter((t) => {
                          const dName = t.department?.name || "General Pathology";
                          const dId = t.department?.id ? String(t.department.id) : (t.departmentId ? String(t.departmentId) : dName);
                          return dId === dept.id || dName === dept.name;
                        }).length;
                        const isSel = selectedDepartment === dept.id;
                        return (
                          <Chip
                            key={dept.id}
                            label={`${dept.name} (${count})`}
                            size="small"
                            clickable
                            onClick={() => setSelectedDepartment(dept.id)}
                            color={isSel ? "primary" : "default"}
                            variant={isSel ? "filled" : "outlined"}
                            sx={{ fontWeight: isSel ? 700 : 500, fontSize: "0.75rem", height: 26 }}
                          />
                        );
                      })}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* --- TESTS & PARAMETERS LIST (CARD-BASED, ZERO HORIZONTAL SCROLL) --- */}
              {filteredTests.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center", bgcolor: "white", borderRadius: 2, border: "1px dashed", borderColor: "grey.300" }}>
                  <Typography variant="body2" color="text.secondary">No tests found for this department.</Typography>
                </Box>
              ) : (
                filteredTests.map((test) => {
                  const params = test.parameters || [];
                  const testDeptName = test.department?.name || (test.departmentId ? `Dept #${test.departmentId}` : null);

                  return (
                    <Box key={test.id} sx={{ mb: 2.5 }}>
                      {/* Test Title Ribbon */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          px: 1.25,
                          py: 0.75,
                          borderRadius: "8px 8px 0 0"
                        }}
                      >
                        <Box sx={{ minWidth: 0, pr: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.85rem", lineHeight: 1.2 }}>
                            {test.name}
                          </Typography>
                          {testDeptName && (
                            <Typography variant="caption" sx={{ opacity: 0.85, fontSize: "0.68rem" }}>
                              {testDeptName} • Code: {test.code}
                            </Typography>
                          )}
                        </Box>
                        <Button
                          size="small"
                          variant="contained"
                          color="inherit"
                          onClick={() => handleOpenConfigurator(test)}
                          startIcon={<SettingsIcon sx={{ fontSize: 13 }} />}
                          sx={{
                            color: "primary.main",
                            bgcolor: "white",
                            fontSize: "0.7rem",
                            py: 0.2,
                            px: 1,
                            minWidth: 0,
                            fontWeight: 700,
                            textTransform: "none",
                            "&:hover": { bgcolor: "grey.100" }
                          }}
                        >
                          Config
                        </Button>
                      </Box>

                      {/* Parameters Body */}
                      {params.length === 0 ? (
                        <Box sx={{ p: 2.5, bgcolor: "white", borderRadius: "0 0 8px 8px", border: "1px solid", borderColor: "grey.200", textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            No parameters configured for this test yet.
                          </Typography>
                          <Button size="small" variant="outlined" onClick={() => handleOpenConfigurator(test)}>
                            Add Parameters
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ bgcolor: "white", borderRadius: "0 0 8px 8px", border: "1px solid", borderColor: "grey.200", overflow: "hidden" }}>
                          {(() => {
                            let mainCounter = 0;
                            let currentHeaderInfo = null;
                            const headerInfoById = new Map();

                            const computedRows = params.map((param) => {
                              const ref = getReferenceRange(param, resultRegDetails);
                              const isHeader =
                                Boolean(param.isHeader) ||
                                (param.isHeader === undefined &&
                                  !param.unit &&
                                  (!ref || !ref.rangeStr || ref.rangeStr === "" || ref.rangeStr === "-NA-"));

                              if (isHeader) {
                                mainCounter++;
                                const headerInfo = { mainNumber: mainCounter, name: param.name, childCounter: 0 };
                                headerInfoById.set(param.id, headerInfo);
                                currentHeaderInfo = headerInfo;
                                return { param, ref, isHeader: true, isChild: false, displaySerial: `${mainCounter}.` };
                              }

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

                            return computedRows.map(({ param, ref, isHeader, isChild, displaySerial }, idx) => {
                              if (isHeader) {
                                return (
                                  <Box
                                    key={param.id}
                                    sx={{
                                      bgcolor: "rgba(15, 118, 110, 0.08)",
                                      borderLeft: "4px solid",
                                      borderColor: "primary.main",
                                      p: 1.2,
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      borderBottom: "1px solid",
                                      borderBottomColor: "grey.200"
                                    }}
                                  >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                      <Chip
                                        label={displaySerial}
                                        size="small"
                                        sx={{ height: 20, fontWeight: 800, fontSize: "0.7rem", bgcolor: "primary.main", color: "white" }}
                                      />
                                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", fontSize: "0.85rem" }}>
                                        {param.name}
                                      </Typography>
                                    </Box>
                                  </Box>
                                );
                              }

                              const val = resultValues[param.id] || "";
                              const isAbnormal = isOutOfRange(val, ref.min, ref.max, param, ref.rangeStr);
                              const normalValLower = (ref.rangeStr || "").toLowerCase();
                              const isParamOptionType = param.valueType === "OPTIONS";
                              const isParamTextType = param.valueType === "TEXT";

                              let dropdownOptions = [];
                              if (param.options) {
                                dropdownOptions = param.options.split(",").map((o) => o.trim()).filter(Boolean);
                              } else if (isParamOptionType) {
                                if (normalValLower.includes("reactive")) dropdownOptions = ["Non-Reactive", "Reactive"];
                                else if (normalValLower.includes("absent") || normalValLower.includes("present")) dropdownOptions = ["Absent", "Present"];
                                else if (normalValLower.includes("detected")) dropdownOptions = ["Not Detected", "Detected"];
                                else dropdownOptions = ["Negative", "Positive"];
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

                              const testFormulas = resultTests.flatMap((t) => t.formulas || []);
                              const paramFormula = testFormulas.find(
                                (f) => f.outputParameterId === param.parameterId || f.outputParameterId === param.id
                              );
                              const hasFormula = !!paramFormula;
                              const isOverridden = manualOverrides.has(param.id) || manualOverrides.has(String(param.id));

                              return (
                                <Box
                                  key={param.id}
                                  sx={{
                                    p: 1.25,
                                    bgcolor: isAbnormal ? "rgba(239, 68, 68, 0.04)" : (idx % 2 === 0 ? "white" : "#fafafa"),
                                    borderBottom: "1px solid",
                                    borderBottomColor: "grey.100"
                                  }}
                                >
                                  {/* Parameter Info Row */}
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.6 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, flex: 1, minWidth: 0, pr: 1 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", minWidth: 20 }}>
                                        {displaySerial}
                                      </Typography>
                                      {isChild && (
                                        <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 800 }}>↳</Typography>
                                      )}
                                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.85rem", color: "text.primary" }}>
                                        {param.name}
                                      </Typography>
                                    </Box>

                                    {/* Unit Tag */}
                                    {param.unit && (
                                      <Chip
                                        label={param.unit}
                                        size="small"
                                        sx={{ height: 18, fontSize: "0.68rem", fontWeight: 700, bgcolor: "grey.100", color: "text.secondary" }}
                                      />
                                    )}
                                  </Box>

                                  {/* Reference Normal Range */}
                                  {ref.rangeStr && (
                                    <Box sx={{ mb: 0.8, pl: 3.2 }}>
                                      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                                        Normal: <strong style={{ color: "#334155" }}>{ref.rangeStr}</strong> {param.unit || ""}
                                      </Typography>
                                    </Box>
                                  )}

                                  {/* Quick Select Touch Buttons */}
                                  {hasOptions && (
                                    <Box sx={{ display: "flex", gap: 0.6, flexWrap: "wrap", mb: 0.8, pl: 3.2 }}>
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
                                              height: 26,
                                              fontSize: "0.75rem",
                                              fontWeight: 700,
                                              bgcolor: isSelected
                                                ? (isOptAbnormal ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)")
                                                : "rgba(0, 0, 0, 0.05)",
                                              color: isSelected
                                                ? (isOptAbnormal ? "#dc2626" : "#059669")
                                                : "text.primary",
                                              border: isSelected
                                                ? `1.5px solid ${isOptAbnormal ? "#dc2626" : "#059669"}`
                                                : "1px solid rgba(0, 0, 0, 0.12)"
                                            }}
                                          />
                                        );
                                      })}
                                    </Box>
                                  )}

                                  {/* Mobile Input Field (16px font prevents browser zoom) */}
                                  <Box sx={{ pl: 3.2 }}>
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
                                      placeholder={isParamTextType ? "Enter observation note..." : "Enter result value..."}
                                      sx={{
                                        "& .MuiInputBase-root": {
                                          bgcolor: isAbnormal ? "rgba(239, 68, 68, 0.12)" : "white",
                                          borderColor: isAbnormal ? "#ef4444" : undefined,
                                          borderRadius: 1.5,
                                          minHeight: 38
                                        },
                                        "& .MuiInputBase-input": {
                                          py: 0.75,
                                          px: 1.25,
                                          fontSize: "16px", // 16px prevents iOS/Android viewport zoom
                                          fontWeight: isAbnormal ? 800 : (hasFormula && !isOverridden ? 700 : 600),
                                          color: isAbnormal ? "#b91c1c" : "inherit"
                                        },
                                        "& .MuiSelect-select": {
                                          py: 0.75,
                                          px: 1.25,
                                          fontSize: "16px"
                                        }
                                      }}
                                      slotProps={{
                                        input: {
                                          endAdornment: (isAbnormal || hasFormula) && (
                                            <InputAdornment position="end">
                                              {hasFormula && (
                                                <Tooltip title={isOverridden ? "Formula overridden - Tap to recalculate" : `Formula: ${paramFormula.formula}`}>
                                                  <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (isOverridden) {
                                                        const newOverrides = new Set(manualOverrides);
                                                        newOverrides.delete(param.id);
                                                        newOverrides.delete(String(param.id));
                                                        setManualOverrides(newOverrides);
                                                        const finalValues = calculateAllDependents(resultValues, resultTests, param.id, newOverrides);
                                                        handleResultValueChange(param.id, finalValues[param.id], false);
                                                      }
                                                    }}
                                                    sx={{ p: 0.4 }}
                                                  >
                                                    <CalculateIcon
                                                      color={isOverridden ? "action" : "primary"}
                                                      sx={{ fontSize: "1.2rem", opacity: isOverridden ? 0.5 : 0.9 }}
                                                    />
                                                  </IconButton>
                                                </Tooltip>
                                              )}
                                              {isAbnormal && (
                                                <Tooltip title="Out of range">
                                                  <WarningIcon color="error" sx={{ fontSize: "1.1rem", ml: 0.5 }} />
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
                                          ...dropdownOptions.map((opt) => (
                                            <MenuItem key={opt} value={opt} sx={{ fontSize: "16px" }}>{opt}</MenuItem>
                                          ))
                                        ]
                                      ) : null}
                                    </TextField>
                                  </Box>
                                </Box>
                              );
                            });
                          })()}
                        </Box>
                      )}
                    </Box>
                  );
                })
              )}

              {/* --- REPORT REMARKS / AI SUMMARY SECTION --- */}
              <Card variant="outlined" sx={{ mt: 2, borderRadius: 2, bgcolor: "white" }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 0.75 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Report Remarks / Impression
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      disabled={aiGenerating}
                      onClick={handleGenerateAiSummary}
                      startIcon={aiGenerating ? <CircularProgress size={12} color="inherit" /> : <AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        py: 0.3,
                        px: 1.2
                      }}
                    >
                      {aiGenerating ? "Generating..." : (reportNotes ? "✨ Regenerate AI" : "✨ AI Generate")}
                    </Button>
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    placeholder="Enter clinical impression note (supports **bold** text)..."
                    variant="outlined"
                    sx={{
                      "& .MuiInputBase-root": { borderRadius: 1.5 },
                      "& .MuiInputBase-input": { fontSize: "16px" }
                    }}
                  />

                  {reportNotes && reportNotes.includes("**") && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: "grey.50", borderRadius: 1, border: "1px dashed", borderColor: "grey.300" }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", display: "block", mb: 0.3 }}>
                        Preview:
                      </Typography>
                      {reportNotes.split("\n").map((line, lineIdx) => (
                        <Typography key={lineIdx} variant="caption" sx={{ display: "block", color: "text.primary" }}>
                          {line}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 6 }}>
              No registration details found.
            </Typography>
          )}
        </Box>

        {/* --- 3. STICKY BOTTOM ACTION BAR --- */}
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "white",
            borderTop: "1px solid",
            borderColor: "divider",
            p: 1.25,
            display: "flex",
            gap: 1,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.08)",
            zIndex: 1100
          }}
        >
          {isSaved && (
            <Button
              onClick={() => {
                onClose();
                if (handlePrintReport) handlePrintReport();
              }}
              variant="contained"
              color="success"
              size="medium"
              startIcon={<PrintIcon />}
              sx={{ fontWeight: 700, minWidth: 0, px: 1.5 }}
            >
              Print
            </Button>
          )}

          <Button
            onClick={() => saveResultsApi(true, false)}
            variant="outlined"
            color="primary"
            size="medium"
            fullWidth
            startIcon={isDraftSaving ? <CircularProgress size={16} color="inherit" /> : <DraftsIcon />}
            disabled={isDraftSaving || resultSaving || !canWrite || loading}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Save Draft
          </Button>

          <Button
            onClick={() => saveResultsApi(false, false)}
            variant="contained"
            color="primary"
            size="medium"
            fullWidth
            startIcon={resultSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={resultSaving || isDraftSaving || !canWrite || loading}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Complete
          </Button>
        </Box>
      </Dialog>

      {/* --- PARAMETER CONFIGURATOR DIALOG --- */}
      {configTest && (
        <Dialog
          open={configDialogOpen}
          onClose={() => setConfigDialogOpen(false)}
          fullScreen
          PaperProps={{ sx: { bgcolor: "#f8fafc" } }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              px: 1.5,
              py: 1.2
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: "0.9rem" }}>
              ⚙ Configure : {configTest.name}
            </Typography>
            <IconButton onClick={() => setConfigDialogOpen(false)} size="small" sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflowY: "auto", pb: 10 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Setup parameter fields and reference ranges.
              </Typography>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddConfigParam} sx={{ textTransform: "none" }}>
                Add Field
              </Button>
            </Box>

            {configParams.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center", border: "1px dashed", borderColor: "grey.300", borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">No parameters defined.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {configParams.map((param, index) => (
                  <Card variant="outlined" key={index} sx={{ p: 1.5, borderRadius: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main" }}>
                        #{index + 1} Parameter
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => handleRemoveConfigParam(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Stack spacing={1}>
                      <TextField
                        label="Parameter Name"
                        size="small"
                        fullWidth
                        value={param.name}
                        onChange={(e) => handleConfigParamChange(index, "name", e.target.value)}
                        sx={{ "& .MuiInputBase-input": { fontSize: "16px" } }}
                      />
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                          label="Unit"
                          size="small"
                          fullWidth
                          value={param.unit}
                          onChange={(e) => handleConfigParamChange(index, "unit", e.target.value)}
                          sx={{ "& .MuiInputBase-input": { fontSize: "16px" } }}
                        />
                        <TextField
                          label="Default Normal Text"
                          size="small"
                          fullWidth
                          value={param.normalRangeDefault}
                          onChange={(e) => handleConfigParamChange(index, "normalRangeDefault", e.target.value)}
                          sx={{ "& .MuiInputBase-input": { fontSize: "16px" } }}
                        />
                      </Box>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: "white",
              borderTop: "1px solid",
              borderColor: "divider",
              p: 1.25,
              display: "flex",
              gap: 1
            }}
          >
            <Button onClick={() => setConfigDialogOpen(false)} variant="outlined" fullWidth size="medium">
              Cancel
            </Button>
            <Button onClick={handleSaveConfigParameters} variant="contained" fullWidth size="medium" startIcon={<SaveIcon />} disabled={!canWrite}>
              Save Setup
            </Button>
          </Box>
        </Dialog>
      )}

      {/* Internal Component Toast Alerts */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}
