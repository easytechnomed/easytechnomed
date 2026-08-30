"use client";

import React, { useState } from "react";
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
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Science as ScienceIcon,
  QrCode as BarcodeIcon,
  CheckCircle as AcceptedIcon,
  HourglassEmpty as PendingIcon,
  Cancel as RejectedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  DoneAll as DoneAllIcon,
} from "@mui/icons-material";

export default function SampleManagementMobile({
  open,
  onClose,
  selectedReg,
  sampleRows,
  setSampleRows,
  onSave,
  saving,
  loading,
  canWrite,
}) {
  const [expandedRow, setExpandedRow] = useState({});

  const toggleDetails = (testId) => {
    setExpandedRow((prev) => ({
      ...prev,
      [testId]: !prev[testId],
    }));
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

  const getStatusColor = (status) => {
    if (status === "Accepted") return { bg: "#ccfbf1", color: "#0f766e", border: "#99f6e4" };
    if (status === "Rejected") return { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" };
    return { bg: "#ffedd5", color: "#c2410c", border: "#fed7aa" };
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: "#f8fafc",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Mobile Top Header */}
      <DialogTitle
        sx={{
          bgcolor: "#0f766e",
          color: "#ffffff",
          py: 1.5,
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(15, 118, 110, 0.2)",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ScienceIcon sx={{ fontSize: 22 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: "0.95rem" }}>
              Sample Management
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85, fontSize: "0.72rem" }}>
              Barcode & Sample Status Registration
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#ffffff", p: 0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Patient Banner & Bulk Actions */}
      <Box sx={{ p: 1.5, bgcolor: "#ffffff", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
        {selectedReg && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1.25 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.9rem" }}>
                {selectedReg.title} {selectedReg.name}
              </Typography>
              <Chip
                size="small"
                label={`Reg: ${selectedReg.regNo}`}
                sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22, bgcolor: "rgba(15, 118, 110, 0.1)", color: "#0f766e" }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
              {selectedReg.gender} • {Math.round(selectedReg.age)} {selectedReg.ageUnit} • Pat. ID: <strong style={{ color: "#334155" }}>{selectedReg.labId}</strong>
            </Typography>
          </Box>
        )}

        {/* Quick Batch Update Chips */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflowX: "auto", pb: 0.2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
            Set All:
          </Typography>
          <Chip
            size="small"
            icon={<AcceptedIcon sx={{ fontSize: "0.85rem !important" }} />}
            label="All Accepted"
            onClick={() => handleSetAllStatus("Accepted")}
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              height: 24,
              bgcolor: "#ccfbf1",
              color: "#0f766e",
              border: "1px solid #99f6e4",
              cursor: "pointer",
            }}
          />
          <Chip
            size="small"
            icon={<PendingIcon sx={{ fontSize: "0.85rem !important" }} />}
            label="All Pending"
            onClick={() => handleSetAllStatus("Pending")}
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              height: 24,
              bgcolor: "#ffedd5",
              color: "#c2410c",
              border: "1px solid #fed7aa",
              cursor: "pointer",
            }}
          />
          <Chip
            size="small"
            icon={<RejectedIcon sx={{ fontSize: "0.85rem !important" }} />}
            label="All Rejected"
            onClick={() => handleSetAllStatus("Rejected")}
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              height: 24,
              bgcolor: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              cursor: "pointer",
            }}
          />
        </Box>
      </Box>

      {/* Main Content Area (Test Sample Cards) */}
      <DialogContent sx={{ p: 1.5, flexGrow: 1, overflowY: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, gap: 1.5 }}>
            <CircularProgress size={36} color="primary" />
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
              Loading sample details...
            </Typography>
          </Box>
        ) : sampleRows.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No tests found for sample management.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {sampleRows.map((row, idx) => {
              const statusStyle = getStatusColor(row.sampleStatus);
              const isDetailsOpen = Boolean(expandedRow[row.testId]);

              return (
                <Card
                  key={row.testId || idx}
                  variant="outlined"
                  sx={{
                    borderRadius: 2.5,
                    bgcolor: "#ffffff",
                    borderColor: "#e2e8f0",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                  }}
                >
                  {/* Card Header: Test Name & Status Selector */}
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "rgba(15, 118, 110, 0.04)",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f766e", fontSize: "0.88rem", lineHeight: 1.3 }}>
                        {row.testName}
                      </Typography>
                    </Box>

                    {/* Status Selector Dropdown */}
                    <TextField
                      select
                      size="small"
                      value={row.sampleStatus || "Pending"}
                      onChange={(e) => handleRowChange(idx, "sampleStatus", e.target.value)}
                      sx={{
                        width: 115,
                        flexShrink: 0,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: statusStyle.bg,
                          color: statusStyle.color,
                          fontWeight: 800,
                          fontSize: "0.75rem",
                          "& fieldset": { borderColor: statusStyle.border },
                          "&:hover fieldset": { borderColor: statusStyle.color },
                        },
                        "& .MuiSelect-select": {
                          py: 0.6,
                          px: 1.2,
                        },
                      }}
                    >
                      <MenuItem value="Pending" sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#c2410c" }}>Pending</MenuItem>
                      <MenuItem value="Accepted" sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f766e" }}>Accepted</MenuItem>
                      <MenuItem value="Rejected" sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#991b1b" }}>Rejected</MenuItem>
                    </TextField>
                  </Box>

                  {/* Card Body: Barcode & Remark */}
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                      {/* Barcode Input */}
                      <TextField
                        fullWidth
                        size="small"
                        label="Sample Barcode"
                        placeholder="Enter barcode..."
                        value={row.sampleBarcode || ""}
                        onChange={(e) => handleRowChange(idx, "sampleBarcode", e.target.value)}
                        InputProps={{
                          startAdornment: <BarcodeIcon sx={{ fontSize: 18, color: "#0f766e", mr: 0.75 }} />,
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: "0.82rem" },
                          "& input": { py: 0.9 },
                        }}
                      />

                      {/* Remark Input */}
                      <TextField
                        fullWidth
                        size="small"
                        label="Sample Remark"
                        placeholder="e.g. Hemolyzed, Fasting sample, Lipemic..."
                        value={row.sampleRemark || ""}
                        onChange={(e) => handleRowChange(idx, "sampleRemark", e.target.value)}
                        sx={{
                          "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: "0.82rem" },
                          "& input": { py: 0.9 },
                        }}
                      />

                      {/* Extra Details Toggle Button */}
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => toggleDetails(row.testId)}
                        endIcon={isDetailsOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        sx={{
                          alignSelf: "flex-start",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#64748b",
                          p: 0,
                          minWidth: 0,
                          textTransform: "none",
                          "&:hover": { color: "#0f766e" },
                        }}
                      >
                        {isDetailsOpen ? "Hide Extra Details" : "More Options (Lab, Collector, Expense)"}
                      </Button>

                      {/* Collapsible Extra Details */}
                      <Collapse in={isDetailsOpen}>
                        <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 1.25, borderTop: "1px dashed #e2e8f0" }}>
                          {/* Send To Lab */}
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Send To"
                            value={row.sendTo || "-NA-"}
                            onChange={(e) => handleRowChange(idx, "sendTo", e.target.value)}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: "0.8rem" } }}
                          >
                            <MenuItem value="-NA-">-NA-</MenuItem>
                            <MenuItem value="Main Lab">Main Lab</MenuItem>
                            <MenuItem value="Branch Lab">Branch Lab</MenuItem>
                          </TextField>

                          {/* Collected By & Expense Grid */}
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              label="Collected By"
                              value={row.collectedBy || "-NA-"}
                              onChange={(e) => handleRowChange(idx, "collectedBy", e.target.value)}
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: "0.8rem" } }}
                            >
                              <MenuItem value="-NA-">-NA-</MenuItem>
                              <MenuItem value="Self">Self</MenuItem>
                              <MenuItem value="Phlebotomist">Phlebotomist</MenuItem>
                              <MenuItem value="Staff">Staff</MenuItem>
                            </TextField>

                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label="Outsource Cost (₹)"
                              value={row.expense || ""}
                              onChange={(e) => handleRowChange(idx, "expense", parseFloat(e.target.value) || 0)}
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: "0.8rem" } }}
                            />
                          </Box>
                        </Box>
                      </Collapse>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </DialogContent>

      {/* Sticky Bottom Action Bar */}
      <DialogActions
        sx={{
          p: 1.5,
          bgcolor: "#ffffff",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          gap: 1,
          flexShrink: 0,
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          onClick={onClose}
          sx={{
            py: 1,
            borderRadius: 1.5,
            fontWeight: 700,
            fontSize: "0.85rem",
            borderColor: "#cbd5e1",
            color: "#64748b",
            "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
          }}
        >
          Cancel
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onSave}
          disabled={saving || !canWrite || loading}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          sx={{
            py: 1,
            borderRadius: 1.5,
            fontWeight: 800,
            fontSize: "0.85rem",
            bgcolor: "#0f766e",
            color: "#ffffff",
            "&:hover": { bgcolor: "#115e59" },
          }}
        >
          {saving ? "Saving..." : "Save Samples"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
