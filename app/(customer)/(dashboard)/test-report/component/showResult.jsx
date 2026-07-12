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
  Stack
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
      rangeStr: param.normalRangeBaby || param.normalRangeDefault || "Normal",
      min: param.minValBaby,
      max: param.maxValBaby,
    };
  }
  if (reg.gender === "Female") {
    return {
      rangeStr: param.normalRangeFemale || param.normalRangeDefault || "Normal",
      min: param.minValFemale,
      max: param.maxValFemale,
    };
  }
  return {
    rangeStr: param.normalRangeMale || param.normalRangeDefault || "Normal",
    min: param.minValMale,
    max: param.maxValMale,
  };
};

const isOutOfRange = (valStr, min, max) => {
  if (!valStr || min === null || max === null) return false;
  const num = parseFloat(valStr);
  if (isNaN(num)) return false;
  return num < min || num > max;
};

export default function ShowResult({ open, onClose, selectedReg }) {
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
                  <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Ref. Doctor:</strong> {previewData.refBy?.name || "Self / Walk-in"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Age / Gender:</strong> {previewData.age} {previewData.ageUnit} / {previewData.gender}</Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Registered On:</strong> {new Date(previewData.date).toLocaleString("en-IN")}</Typography>
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
                          <TableCell sx={{ fontWeight: 700 }}>Parameter Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Observed Value</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Normal Reference Range</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          const sectionParams = test.parameters || [];
                          const renderGroups = [];
                          const hasParentIdData = sectionParams.some(p => p.parentId != null);

                          if (hasParentIdData) {
                            const childrenByParentId = {};
                            sectionParams.forEach(p => {
                              if (p.parentId != null) {
                                if (!childrenByParentId[p.parentId]) childrenByParentId[p.parentId] = [];
                                childrenByParentId[p.parentId].push(p);
                              }
                            });
                            const childParamIds = new Set(
                              sectionParams.filter(p => p.parentId != null).map(p => p.id)
                            );

                            for (const p of sectionParams) {
                              if (childParamIds.has(p.id)) continue;
                              const ref = getReferenceRange(p, previewData);
                              const pIsHeader = p.isHeader || (!p.unit && (!ref || !ref.rangeStr || ref.rangeStr === "" || ref.rangeStr === "-NA-"));
                              if (pIsHeader) {
                                renderGroups.push({ type: "group", header: p, children: childrenByParentId[p.id] || [] });
                              } else {
                                renderGroups.push({ type: "standalone", param: p });
                              }
                            }
                          } else {
                            let gi = 0;
                            while (gi < sectionParams.length) {
                              const p = sectionParams[gi];
                              const ref = getReferenceRange(p, previewData);
                              const pIsHeader = p.isHeader || (!p.unit && (!ref || !ref.rangeStr || ref.rangeStr === "" || ref.rangeStr === "-NA-"));
                              if (pIsHeader) {
                                const children = [];
                                let ci = gi + 1;
                                while (ci < sectionParams.length) {
                                  const cp = sectionParams[ci];
                                  const cpRef = getReferenceRange(cp, previewData);
                                  const cpIsHeader = cp.isHeader || (!cp.unit && (!cpRef || !cpRef.rangeStr || cpRef.rangeStr === "" || cpRef.rangeStr === "-NA-"));
                                  if (cpIsHeader) break;
                                  children.push(cp);
                                  ci++;
                                }
                                renderGroups.push({ type: "group", header: p, children });
                                gi = ci;
                              } else {
                                renderGroups.push({ type: "standalone", param: p });
                                gi++;
                              }
                            }
                          }

                          const renderParamRow = (param, indented, keyIndex) => {
                            const result = previewData.results?.find(r => r.testParameterId === param.id);
                            const val = result ? result.value : "";
                            const ref = getReferenceRange(param, previewData);
                            const isAbnormal = isOutOfRange(val, ref.min, ref.max);

                            return (
                              <TableRow key={keyIndex} hover>
                                <TableCell sx={{ fontWeight: 500, pl: indented ? 4 : 2, color: "text.primary" }}>
                                  {indented ? `▪ ${param.name}` : param.name}
                                </TableCell>
                                <TableCell sx={{
                                  fontWeight: isAbnormal ? 700 : 500,
                                  color: isAbnormal ? "error.main" : "text.primary"
                                }}>
                                  {val || "-"}
                                </TableCell>
                                <TableCell>{param.unit || "-"}</TableCell>
                                <TableCell>{ref.rangeStr || "-"}</TableCell>
                              </TableRow>
                            );
                          };

                          let k = 0;
                          const elements = [];
                          for (const group of renderGroups) {
                            if (group.type === "standalone") {
                              elements.push(renderParamRow(group.param, false, `p-${k++}`));
                            } else {
                              const { header, children } = group;
                              // Draw header row
                              elements.push(
                                <TableRow key={`h-${k++}`} sx={{ bgcolor: "grey.50" }}>
                                  <TableCell colSpan={4} sx={{ fontWeight: 800, color: "text.secondary" }}>
                                    {header.name}
                                  </TableCell>
                                </TableRow>
                              );
                              // Draw children
                              children.forEach(child => {
                                elements.push(renderParamRow(child, true, `p-${k++}`));
                              });
                            }
                          }
                          return elements;
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              );
            })}

            {/* Remarks */}
            {previewData.remark && (
              <Card variant="outlined" sx={{ p: 2, bgcolor: "warning.50", borderColor: "warning.200" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "warning.800" }}>
                  Report Remarks / Summary Note
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>{previewData.remark}</Typography>
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
              onClick={() => window.open(`/api/print-report/${previewData.id}?withFrame=false`, "_blank")}
            >
              Download Without Frame
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => window.open(`/api/print-report/${previewData.id}?withFrame=true`, "_blank")}
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
