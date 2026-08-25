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
  CircularProgress,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Assignment as AssignmentIcon
} from "@mui/icons-material";
import ShowResultMobile from "./showResultMobile";

const getReferenceRange = (param, reg) => {
  const isBaby = reg.ageUnit !== "Year" || reg.age < 12;
  if (isBaby) {
    return {
      rangeStr: param.normalRangeBaby || param.normalRangeDefault || "",
      min: param.minValBaby,
      max: param.maxValBaby,
    };
  }
  if (reg.gender === "Female") {
    return {
      rangeStr: param.normalRangeFemale || param.normalRangeDefault || "",
      min: param.minValFemale,
      max: param.maxValFemale,
    };
  }
  return {
    rangeStr: param.normalRangeMale || param.normalRangeDefault || "",
    min: param.minValMale,
    max: param.maxValMale,
  };
};

const isQualitativeAbnormal = (valStr, refRangeStr = "") => {
  if (!valStr || typeof valStr !== "string") return false;
  const valLower = valStr.trim().toLowerCase();
  const refLower = (refRangeStr || "").trim().toLowerCase();

  // If matches ref exactly, it's normal
  if (refLower && valLower === refLower) return false;

  // Abnormal keywords
  if (valLower.includes("reactive") && !valLower.includes("non")) return true;
  if (valLower.includes("positive") && !valLower.includes("non")) return true;
  if (valLower.includes("present") && !valLower.includes("absent")) return true;
  if (valLower.includes("detected") && !valLower.includes("not")) return true;
  if (["abnormal", "trace", "seen", "+", "++", "+++", "++++", "1+", "2+", "3+", "4+", "cloudy", "turbid", "hazy"].some(k => valLower === k || (k.startsWith("+") && valLower.includes(k)))) {
    return true;
  }

  // Normal keywords
  if (valLower.includes("negative") || valLower.includes("non-reactive") || valLower.includes("non reactive") || valLower.includes("nonreactive") || valLower.includes("absent") || valLower.includes("not detected") || valLower === "nil" || valLower === "normal" || valLower === "clear") {
    return false;
  }

  // If normal range expects negative/absent/nil and value is different
  if (refLower.includes("negative") && valLower.includes("positive")) return true;
  if ((refLower.includes("non-reactive") || refLower.includes("non reactive")) && valLower.includes("reactive") && !valLower.includes("non")) return true;
  if ((refLower.includes("absent") || refLower.includes("nil")) && valLower.includes("present")) return true;

  return false;
};

const isOutOfRange = (valStr, min, max, refRangeStr = "") => {
  if (!valStr) return false;
  const valRaw = String(valStr).trim();
  const num = parseFloat(valRaw);
  if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(valRaw) && (min !== null || max !== null)) {
    if (min !== null && min !== undefined && num < min) return true;
    if (max !== null && max !== undefined && num > max) return true;
    return false;
  }
  return isQualitativeAbnormal(valRaw, refRangeStr);
};

export default function ShowResult({ open, onClose, selectedReg }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const loadPreviewData = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/registrations/${selectedReg.id}/parameters`).then((r) => r.json());
      if (res.success) {
        setPreviewData(res.registration);
      } else {
        setPreviewData(null);
      }
    } catch (err) {
      console.error(err);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (open && selectedReg) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPreviewData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedReg]);

  if (!open) return null;

  if (isMobile) {
    return (
      <ShowResultMobile
        open={open}
        onClose={onClose}
        previewLoading={previewLoading}
        previewData={previewData}
      />
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, p: 1, maxHeight: "90vh" } }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AssignmentIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Report Preview</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ py: 2 }}>
        {previewLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : previewData ? (
          <Stack spacing={3}>
            {/* Demographics Card */}
            <Card variant="outlined" sx={{ bgcolor: "grey.50", p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Patient Name:</strong> {previewData.title} {previewData.name}</Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Lab No / ID:</strong> {previewData.labId} ({previewData.regNo})</Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Ref. Doctor:</strong> {previewData.refBy?.name || "Self"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Age / Gender:</strong> {previewData.age} {previewData.ageUnit} / {previewData.gender}</Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Registered On:</strong> {new Date(previewData.date).toLocaleString("en-IN")}</Typography>
                  {(previewData.reportedAt || previewData.status === "Completed") && (
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Reported On:</strong>{" "}
                      {new Date(previewData.reportedAt || previewData.updatedAt).toLocaleString("en-IN")}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Status:</strong>{" "}
                    <Badge
                      badgeContent={previewData.status}
                      color={previewData.status === "Completed" ? "success" : "warning"}
                      sx={{ "& .MuiBadge-badge": { position: "static", transform: "none", fontWeight: 700 } }}
                    />
                  </Typography>
                </Grid>
              </Grid>
            </Card>

            {/* Tests list */}
            {previewData.tests?.map((regTest, tIdx) => {
              const test = regTest.test;
              return (
                <Card variant="outlined" key={tIdx} sx={{ overflow: "hidden" }}>
                  <Box sx={{ bgcolor: "rgba(15, 118, 110, 0.08)", borderBottom: "1px solid", borderColor: "divider", px: 2, py: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>
                      {test.name} ({test.code})
                    </Typography>
                  </Box>
                  <TableContainer component={Paper} elevation={0} square>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "grey.50" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, width: 60 }}>S/No</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Parameter Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Observed Value</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Normal Reference Range</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          const sectionParams = test.parameters || [];
                          let mainCounter = 0;
                          let currentHeaderInfo = null;
                          const headerInfoById = new Map();
                          const resultValuesMap = (previewData.results || []).reduce((acc, r) => {
                            acc[r.testParameterId] = r.value;
                            return acc;
                          }, {});

                          const computedRows = sectionParams.map((param) => {
                            const isHeader = Boolean(param.isHeader);

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
                                isHeader: true,
                                isChild: false,
                                displaySerial: `${mainCounter}.`
                              };
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
                                isHeader: false,
                                isChild: true,
                                displaySerial: `${parentInfo.mainNumber}.${parentInfo.childCounter}`
                              };
                            } else {
                              mainCounter++;
                              currentHeaderInfo = null;
                              return {
                                param,
                                isHeader: false,
                                isChild: false,
                                displaySerial: `${mainCounter}`
                              };
                            }
                          });

                          return computedRows.map(({ param, isHeader, isChild, displaySerial }, idx) => {
                            if (isHeader) {
                              return (
                                <TableRow
                                  key={`h-${idx}`}
                                  sx={{
                                    bgcolor: "rgba(15, 118, 110, 0.06)",
                                    borderLeft: "4px solid",
                                    borderColor: "primary.main"
                                  }}
                                >
                                  <TableCell sx={{ fontWeight: 800, color: "primary.main", py: 1 }}>
                                    {displaySerial}
                                  </TableCell>
                                  <TableCell colSpan={4} sx={{ fontWeight: 800, color: "primary.main", py: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>
                                      {param.name}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            }

                            const result = previewData.results?.find(r => r.testParameterId === param.id);
                            const val = result ? result.value : "";
                            const ref = getReferenceRange(param, previewData);
                            const isAbnormal = isOutOfRange(val, ref.min, ref.max, ref.rangeStr);

                            return (
                              <TableRow key={`p-${idx}`} hover>
                                <TableCell sx={{ color: isChild ? "text.secondary" : "text.primary", fontWeight: isChild ? 600 : 700 }}>
                                  {displaySerial}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500, pl: isChild ? 3.5 : 2, color: "text.primary" }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                    {isChild && (
                                      <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700 }}>↳</Typography>
                                    )}
                                    <Typography variant="body2" sx={{ fontWeight: isChild ? 500 : 600 }}>
                                      {param.name}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{
                                  fontWeight: isAbnormal ? 700 : 500,
                                  color: isAbnormal ? "error.main" : "text.primary"
                                }}>
                                  {val || "-"}
                                </TableCell>
                                <TableCell>{param.unit || "-"}</TableCell>
                                <TableCell>{ref.rangeStr || ""}</TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              );
            })}

            {/* Remarks */}
            {previewData.remark && (
              <Card variant="outlined" sx={{ p: 2, bgcolor: "rgba(15, 118, 110, 0.04)", borderColor: "primary.light" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", mb: 1 }}>
                  Report Remarks / Summary Note
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {previewData.remark.split("\n").map((line, lineIdx) => {
                    const parts = [];
                    const regex = /\*\*(.*?)\*\*/g;
                    let lastIndex = 0;
                    let match;

                    while ((match = regex.exec(line)) !== null) {
                      if (match.index > lastIndex) {
                        parts.push(line.substring(lastIndex, match.index));
                      }
                      parts.push(
                        <strong key={`b-${lineIdx}-${match.index}`} style={{ fontWeight: 700 }}>
                          {match[1]}
                        </strong>
                      );
                      lastIndex = regex.lastIndex;
                    }

                    if (lastIndex < line.length) {
                      parts.push(line.substring(lastIndex));
                    }

                    return (
                      <Typography
                        key={`line-${lineIdx}`}
                        variant="body2"
                        sx={{
                          minHeight: line.trim() === "" ? "0.8em" : "auto",
                          mb: 0.3,
                          color: "text.primary",
                          lineHeight: 1.5,
                        }}
                      >
                        {parts.length > 0 ? parts : "\u00A0"}
                      </Typography>
                    );
                  })}
                </Box>
              </Card>
            )}
          </Stack>
        ) : (
          <Typography color="text.secondary">No preview data available.</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, justifyContent: "flex-end" }}>
        {previewData && (
          <>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => window.open(`/api/print-report/${previewData.regNo || previewData.id}?withFrame=false`, "_blank")}
            >
              Download Without Frame
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => window.open(`/api/print-report/${previewData.regNo || previewData.id}?withFrame=true`, "_blank")}
            >
              Download With Frame
            </Button>
          </>
        )}
        <Button onClick={onClose} variant="text" color="inherit" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
