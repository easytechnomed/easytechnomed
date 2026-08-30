"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
  Grid,
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Science as ScienceIcon,
  DoneAll as DoneAllIcon,
  CheckCircle as AcceptedIcon,
  HourglassEmpty as PendingIcon,
  Cancel as RejectedIcon,
} from "@mui/icons-material";
import SampleManagementMobile from "./SampleManagementMobile";

export default function SampleManagement({
  open,
  onClose,
  selectedReg,
  onSaveSuccess,
  canWrite = true,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(true);
  const [sampleRows, setSampleRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open && selectedReg?.id) {
      loadSamples(selectedReg.id);
    }
  }, [open, selectedReg]);

  const loadSamples = async (regId) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/registrations/${regId}/samples`).then((r) => r.json());
      if (res.success && res.registration?.tests) {
        const rows = res.registration.tests.map((rt) => ({
          testId: rt.test.id,
          testName: rt.test.name,
          sampleStatus: rt.sampleStatus || "Pending",
          sampleBarcode: rt.sampleBarcode || selectedReg.barcode?.replace(/^,\s*/, "")?.split(" ")?.[0] || "",
          sampleRemark: rt.sampleRemark || "",
          sendTo: rt.sendTo || "-NA-",
          expense: rt.expense || 0,
          assessNo: rt.assessNo || "",
          pathologist: rt.pathologist || "-NA-",
          collectedBy: rt.collectedBy || "-NA-",
          product: rt.product || "-NA-",
        }));
        setSampleRows(rows);
      } else {
        setErrorMsg(res.message || "Failed to load sample details");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error fetching sample details");
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...sampleRows];
    updated[index][field] = value;
    setSampleRows(updated);
  };

  const handleSetAllStatus = (status) => {
    const updated = sampleRows.map((row) => ({
      ...row,
      sampleStatus: status,
    }));
    setSampleRows(updated);
  };

  const handleSave = async () => {
    if (!selectedReg?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/registrations/${selectedReg.id}/samples`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleRows),
      }).then((r) => r.json());

      if (res.success) {
        if (typeof onSaveSuccess === "function") {
          onSaveSuccess();
        }
        onClose();
      } else {
        alert(res.message || "Failed to save sample details");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving sample details");
    } finally {
      setSaving(false);
    }
  };

  // If mobile viewport, render the touch-optimized mobile component
  if (isMobile) {
    return (
      <SampleManagementMobile
        open={open}
        onClose={onClose}
        selectedReg={selectedReg}
        sampleRows={sampleRows}
        setSampleRows={setSampleRows}
        onSave={handleSave}
        saving={saving}
        loading={loading}
        canWrite={canWrite}
      />
    );
  }

  // Desktop Dialog View
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          bgcolor: "#0f766e",
          color: "#ffffff",
          py: 1.5,
          px: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <ScienceIcon sx={{ fontSize: 24 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Sample Management
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Status and Barcode Registration per Test
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#ffffff" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Patient Meta Bar */}
      <DialogContent sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
        {selectedReg && (
          <Box
            sx={{
              mb: 2,
              p: 1.75,
              bgcolor: "#ffffff",
              borderRadius: 2,
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                Patient: <span style={{ color: "#0f766e" }}>{selectedReg.title} {selectedReg.name}</span>
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                {Math.round(selectedReg.age)} {selectedReg.ageUnit} • {selectedReg.gender}
              </Typography>
              <Chip
                label={`Reg: ${selectedReg.regNo}`}
                size="small"
                sx={{ bgcolor: "rgba(15, 118, 110, 0.1)", color: "#0f766e", fontWeight: 700 }}
              />
              <Chip
                label={`Pat. ID: ${selectedReg.labId}`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            {/* Quick Bulk Update Actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b" }}>
                Set All Status:
              </Typography>
              <Chip
                size="small"
                icon={<AcceptedIcon sx={{ fontSize: "0.85rem !important" }} />}
                label="All Accepted"
                onClick={() => handleSetAllStatus("Accepted")}
                sx={{
                  bgcolor: "#ccfbf1",
                  color: "#0f766e",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#99f6e4" },
                }}
              />
              <Chip
                size="small"
                icon={<PendingIcon sx={{ fontSize: "0.85rem !important" }} />}
                label="All Pending"
                onClick={() => handleSetAllStatus("Pending")}
                sx={{
                  bgcolor: "#ffedd5",
                  color: "#c2410c",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#fed7aa" },
                }}
              />
              <Chip
                size="small"
                icon={<RejectedIcon sx={{ fontSize: "0.85rem !important" }} />}
                label="All Rejected"
                onClick={() => handleSetAllStatus("Rejected")}
                sx={{
                  bgcolor: "#fee2e2",
                  color: "#991b1b",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#fecaca" },
                }}
              />
            </Box>
          </Box>
        )}

        {/* Table Container */}
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, gap: 1.5 }}>
            <CircularProgress size={36} color="primary" />
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
              Loading sample details...
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420, borderRadius: 2, bgcolor: "#ffffff" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, bgcolor: "#f1f5f9", fontSize: "0.8rem", color: "#334155" }}>Test Name</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: "#f1f5f9", fontSize: "0.8rem", color: "#334155" }}>Barcode</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: "#f1f5f9", fontSize: "0.8rem", color: "#334155" }}>Sample Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: "#f1f5f9", fontSize: "0.8rem", color: "#334155" }}>Remark</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: "#f1f5f9", fontSize: "0.8rem", color: "#334155" }}>Send to</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: "#f1f5f9", fontSize: "0.8rem", color: "#334155" }}>Collected By</TableCell>
                  <TableCell sx={{ fontWeight: 800, bgcolor: "#f1f5f9", fontSize: "0.8rem", color: "#334155" }} align="right">Expense (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleRows.map((row, idx) => (
                  <TableRow key={row.testId || idx} hover sx={{ "&:hover": { bgcolor: "rgba(15, 118, 110, 0.03)" } }}>
                    <TableCell sx={{ fontWeight: 700, color: "#0f766e", fontSize: "0.82rem" }}>
                      {row.testName}
                    </TableCell>

                    {/* Barcode */}
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.sampleBarcode || ""}
                        onChange={(e) => handleRowChange(idx, "sampleBarcode", e.target.value)}
                        placeholder="Barcode"
                        variant="outlined"
                        sx={{ width: 140, "& .MuiInputBase-input": { py: 0.6, fontSize: "0.8rem" } }}
                      />
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={row.sampleStatus || "Pending"}
                        onChange={(e) => handleRowChange(idx, "sampleStatus", e.target.value)}
                        sx={{
                          width: 120,
                          "& .MuiOutlinedInput-root": {
                            bgcolor:
                              row.sampleStatus === "Accepted"
                                ? "#ccfbf1"
                                : row.sampleStatus === "Rejected"
                                ? "#fee2e2"
                                : "#ffedd5",
                            color:
                              row.sampleStatus === "Accepted"
                                ? "#0f766e"
                                : row.sampleStatus === "Rejected"
                                ? "#991b1b"
                                : "#c2410c",
                            fontWeight: 800,
                            fontSize: "0.78rem",
                          },
                          "& .MuiInputBase-input": { py: 0.6 },
                        }}
                      >
                        <MenuItem value="Pending" sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#c2410c" }}>Pending</MenuItem>
                        <MenuItem value="Accepted" sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f766e" }}>Accepted</MenuItem>
                        <MenuItem value="Rejected" sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#991b1b" }}>Rejected</MenuItem>
                      </TextField>
                    </TableCell>

                    {/* Remark */}
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.sampleRemark || ""}
                        onChange={(e) => handleRowChange(idx, "sampleRemark", e.target.value)}
                        placeholder="Remark"
                        sx={{ width: 140, "& .MuiInputBase-input": { py: 0.6, fontSize: "0.8rem" } }}
                      />
                    </TableCell>

                    {/* Send to */}
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={row.sendTo || "-NA-"}
                        onChange={(e) => handleRowChange(idx, "sendTo", e.target.value)}
                        sx={{ width: 120, "& .MuiInputBase-input": { py: 0.6, fontSize: "0.8rem" } }}
                      >
                        <MenuItem value="-NA-">-NA-</MenuItem>
                        <MenuItem value="Main Lab">Main Lab</MenuItem>
                        <MenuItem value="Branch Lab">Branch Lab</MenuItem>
                      </TextField>
                    </TableCell>

                    {/* Collected By */}
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={row.collectedBy || "-NA-"}
                        onChange={(e) => handleRowChange(idx, "collectedBy", e.target.value)}
                        sx={{ width: 120, "& .MuiInputBase-input": { py: 0.6, fontSize: "0.8rem" } }}
                      >
                        <MenuItem value="-NA-">-NA-</MenuItem>
                        <MenuItem value="Self">Self</MenuItem>
                        <MenuItem value="Phlebotomist">Phlebotomist</MenuItem>
                        <MenuItem value="Staff">Staff</MenuItem>
                      </TextField>
                    </TableCell>

                    {/* Expense */}
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={row.expense || ""}
                        onChange={(e) => handleRowChange(idx, "expense", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        sx={{ width: 90, "& .MuiInputBase-input": { py: 0.6, fontSize: "0.8rem", textAlign: "right" } }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      {/* Dialog Footer Actions */}
      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <Button onClick={onClose} variant="outlined" size="small" sx={{ borderRadius: 1.5, px: 2.5, fontWeight: 700 }}>
          Cancel
        </Button>
        <Tooltip title={!canWrite ? "You do not have permission to modify samples" : ""}>
          <span>
            <Button
              onClick={handleSave}
              variant="contained"
              size="small"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              disabled={saving || !canWrite || loading}
              sx={{
                bgcolor: "#0f766e",
                color: "#ffffff",
                fontWeight: 800,
                borderRadius: 1.5,
                px: 3,
                "&:hover": { bgcolor: "#115e59" },
              }}
            >
              {saving ? "Saving..." : "Save Samples"}
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
}
