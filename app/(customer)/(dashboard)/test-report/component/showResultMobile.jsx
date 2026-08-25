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
  Dialog,
  Stack,
  Chip,
  Button,
  Paper
} from "@mui/material";
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Assignment as AssignmentIcon
} from "@mui/icons-material";

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

  if (refLower && valLower === refLower) return false;

  if (valLower.includes("reactive") && !valLower.includes("non")) return true;
  if (valLower.includes("positive") && !valLower.includes("non")) return true;
  if (valLower.includes("present") && !valLower.includes("absent")) return true;
  if (valLower.includes("detected") && !valLower.includes("not")) return true;
  if (["abnormal", "trace", "seen", "+", "++", "+++", "++++", "1+", "2+", "3+", "4+", "cloudy", "turbid", "hazy"].some(k => valLower === k || (k.startsWith("+") && valLower.includes(k)))) {
    return true;
  }

  if (valLower.includes("negative") || valLower.includes("non-reactive") || valLower.includes("non reactive") || valLower.includes("nonreactive") || valLower.includes("absent") || valLower.includes("not detected") || valLower === "nil" || valLower === "normal" || valLower === "clear") {
    return false;
  }

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

export default function ShowResultMobile({ open, onClose, previewLoading, previewData }) {
  if (!open) return null;

  return (
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
      {/* ── TOP STICKY HEADER ── */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          position: "sticky",
          top: 0,
          zIndex: 1100
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentIcon fontSize="small" sx={{ opacity: 0.9 }} />
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
              {previewData ? `${previewData.title || ""} ${previewData.name}` : "Report Preview"}
            </Typography>
          </Box>
          {previewData && (
            <Typography variant="caption" sx={{ opacity: 0.85, fontSize: "0.72rem", display: "block", mt: 0.3 }}>
              Reg: {previewData.regNo} • ID: {previewData.labId} • {previewData.gender} / {Math.round(previewData.age || 0)} {previewData.ageUnit?.charAt(0) || "Y"}
            </Typography>
          )}
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: "primary.contrastText" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* ── MAIN CONTENT ── */}
      {previewLoading ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            p: 3
          }}
        >
          <CircularProgress size={42} />
          <Typography variant="body2" color="text.secondary">
            Loading report preview...
          </Typography>
        </Box>
      ) : previewData ? (
        <>
          <Box sx={{ flex: 1, overflowY: "auto", p: 1.5, pb: 14 }}>
            <Stack spacing={2}>
              {/* ── PATIENT DETAILS CARD ── */}
              <Card variant="outlined" sx={{ borderRadius: 2.5, bgcolor: "#ffffff" }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>
                      Patient Details
                    </Typography>
                    <Chip
                      label={previewData.status || "Pending"}
                      size="small"
                      color={previewData.status === "Completed" ? "success" : "warning"}
                      sx={{ fontWeight: 800, fontSize: "0.72rem", height: 22 }}
                    />
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.7rem" }}>
                        Ref. Doctor
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                        {previewData.refBy?.name || "Self"}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.7rem" }}>
                        Registered On
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: "0.78rem" }}>
                        {new Date(previewData.date).toLocaleDateString("en-IN")}
                      </Typography>
                    </Box>

                    {(previewData.reportedAt || previewData.status === "Completed") && (
                      <Box sx={{ gridColumn: "span 2" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.7rem" }}>
                          Reported On
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "0.78rem" }}>
                          {new Date(previewData.reportedAt || previewData.updatedAt).toLocaleString("en-IN")}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* ── TESTS & PARAMETERS ── */}
              {previewData.tests?.map((regTest, tIdx) => {
                const test = regTest.test;
                const sectionParams = test.parameters || [];
                let mainCounter = 0;
                let currentHeaderInfo = null;
                const headerInfoById = new Map();

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

                return (
                  <Card key={tIdx} variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden", bgcolor: "#ffffff" }}>
                    {/* Test Header */}
                    <Box
                      sx={{
                        bgcolor: "rgba(15, 118, 110, 0.08)",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        px: 2,
                        py: 1.2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>
                        {test.name}
                      </Typography>
                      {test.code && (
                        <Chip
                          label={test.code}
                          size="small"
                          sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#ffffff" }}
                        />
                      )}
                    </Box>

                    {/* Parameter Cards List */}
                    <Box sx={{ p: 1.5 }}>
                      <Stack spacing={1.2}>
                        {computedRows.map(({ param, isHeader, isChild, displaySerial }, idx) => {
                          if (isHeader) {
                            return (
                              <Box
                                key={`h-${idx}`}
                                sx={{
                                  bgcolor: "rgba(15, 118, 110, 0.06)",
                                  borderLeft: "4px solid",
                                  borderColor: "primary.main",
                                  borderRadius: 1,
                                  px: 1.5,
                                  py: 0.8,
                                  mt: idx > 0 ? 1 : 0
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", display: "block" }}>
                                  {displaySerial} {param.name}
                                </Typography>
                              </Box>
                            );
                          }

                          const result = previewData.results?.find(r => r.testParameterId === param.id);
                          const val = result ? result.value : "";
                          const ref = getReferenceRange(param, previewData);
                          const isAbnormal = isOutOfRange(val, ref.min, ref.max, ref.rangeStr);

                          return (
                            <Paper
                              key={`p-${idx}`}
                              variant="outlined"
                              sx={{
                                p: 1.2,
                                borderRadius: 2,
                                pl: isChild ? 2.5 : 1.5,
                                bgcolor: isAbnormal ? "#fff1f2" : "#ffffff",
                                borderColor: isAbnormal ? "#fca5a5" : "divider",
                                transition: "all 0.15s ease"
                              }}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    {isChild && (
                                      <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700 }}>
                                        ↳
                                      </Typography>
                                    )}
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: isChild ? 600 : 700,
                                        fontSize: "0.84rem",
                                        color: "text.primary"
                                      }}
                                    >
                                      <span style={{ opacity: 0.6, fontSize: "0.75rem", marginRight: 4 }}>
                                        {displaySerial}
                                      </span>
                                      {param.name}
                                    </Typography>
                                  </Box>

                                  {/* Normal Reference Range & Unit */}
                                  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.8, mt: 0.6 }}>
                                    {param.unit && (
                                      <Typography variant="caption" sx={{ bgcolor: "grey.100", px: 0.8, py: 0.2, borderRadius: 1, fontSize: "0.68rem", fontWeight: 600, color: "text.secondary" }}>
                                        Unit: {param.unit}
                                      </Typography>
                                    )}
                                    {ref.rangeStr && (
                                      <Typography variant="caption" sx={{ bgcolor: "grey.100", px: 0.8, py: 0.2, borderRadius: 1, fontSize: "0.68rem", color: "text.secondary" }}>
                                        Ref: {ref.rangeStr}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>

                                {/* Observed Result Value Badge */}
                                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                                  <Box
                                    sx={{
                                      px: 1.2,
                                      py: 0.5,
                                      borderRadius: 1.5,
                                      bgcolor: isAbnormal ? "#fee2e2" : val ? "#ecfdf5" : "grey.100",
                                      border: "1px solid",
                                      borderColor: isAbnormal ? "#fca5a5" : val ? "#a7f3d0" : "grey.200",
                                      display: "inline-block"
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 800,
                                        fontSize: "0.92rem",
                                        color: isAbnormal ? "error.main" : val ? "success.dark" : "text.secondary"
                                      }}
                                    >
                                      {val || "-"}
                                    </Typography>
                                  </Box>
                                  {isAbnormal && (
                                    <Typography variant="caption" sx={{ display: "block", color: "error.main", fontWeight: 700, fontSize: "0.65rem", mt: 0.2 }}>
                                      ⚠️ Abnormal
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Stack>
                    </Box>
                  </Card>
                );
              })}

              {/* ── REMARKS / SUMMARY NOTE ── */}
              {previewData.remark && (
                <Card variant="outlined" sx={{ borderRadius: 2.5, p: 2, bgcolor: "rgba(15, 118, 110, 0.04)", borderColor: "primary.light" }}>
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
                            fontSize: "0.82rem",
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
          </Box>

          {/* ── STICKY BOTTOM ACTION BAR ── */}
          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: "#ffffff",
              borderTop: "1px solid",
              borderColor: "divider",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              zIndex: 1100,
              boxShadow: "0 -4px 16px rgba(0,0,0,0.08)"
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              size="small"
              fullWidth
              startIcon={<DownloadIcon fontSize="small" />}
              onClick={() => window.open(`/api/print-report/${previewData.regNo || previewData.id}?withFrame=false`, "_blank")}
              sx={{ py: 1, borderRadius: 2, fontWeight: 700, fontSize: "0.78rem", textTransform: "none" }}
            >
              Plain PDF
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              fullWidth
              startIcon={<DownloadIcon fontSize="small" />}
              onClick={() => window.open(`/api/print-report/${previewData.regNo || previewData.id}?withFrame=true`, "_blank")}
              sx={{ py: 1, borderRadius: 2, fontWeight: 800, fontSize: "0.78rem", textTransform: "none" }}
            >
              Letterhead PDF
            </Button>
          </Box>
        </>
      ) : (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No preview data available.</Typography>
        </Box>
      )}
    </Dialog>
  );
}
