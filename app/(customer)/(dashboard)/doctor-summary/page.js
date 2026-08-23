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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Collapse,
  Chip,
  Tooltip,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Print as PrintIcon,
  Search as SearchIcon,
  RestartAlt as ResetIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  ReceiptLong as ReceiptIcon,
  Description as ReportIcon,
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon,
  Person as PersonIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import AddDoctorDrawer from "@/components/AddDoctorDrawer";

export default function DoctorSummaryPage() {
  const [openAddDocDrawer, setOpenAddDocDrawer] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});

  // Edit & Delete States
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editIncentiveInput, setEditIncentiveInput] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleOpenEdit = (item) => {
    setEditingDoc(item);
    setEditIncentiveInput(String(item.incentivePercent));
    setOpenEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDoc) return;
    if (editIncentiveInput === "" || isNaN(parseFloat(editIncentiveInput))) {
      showToast("Please enter a valid incentive percentage.", "error");
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch("/api/doctors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: editingDoc.id,
          incentivePercent: parseFloat(editIncentiveInput)
        })
      }).then((r) => r.json());

      if (res.success) {
        showToast("Doctor incentive updated successfully!", "success");
        setOpenEditDialog(false);
        setEditingDoc(null);
        loadData();
      } else {
        showToast(res.message || "Failed to update incentive.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An unexpected error occurred.", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenDelete = (item) => {
    setDeletingDoc(item);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/doctors?doctorId=${deletingDoc.id}`, {
        method: "DELETE"
      }).then((r) => r.json());

      if (res.success) {
        showToast("Doctor deleted successfully!", "success");
        setOpenDeleteDialog(false);
        setDeletingDoc(null);
        loadData();
      } else {
        showToast(res.message || "Failed to delete doctor.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An unexpected error occurred.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Filters
  const calculateDatesForRange = (selectedRange) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (selectedRange === "7days") {
      start.setDate(now.getDate() - 7);
    } else if (selectedRange === "30days") {
      start.setDate(now.getDate() - 30);
    } else if (selectedRange === "thismonth") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (selectedRange === "prevmonth") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (selectedRange === "3months") {
      start.setDate(now.getDate() - 90);
    } else if (selectedRange === "6months") {
      start.setDate(now.getDate() - 180);
    } else if (selectedRange === "year") {
      start.setDate(now.getDate() - 365);
    }

    const formatToInput = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      startStr: formatToInput(start),
      endStr: formatToInput(end),
    };
  };

  const [range, setRange] = useState("thismonth");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const year = startOfMonth.getFullYear();
    const month = String(startOfMonth.getMonth() + 1).padStart(2, "0");
    const day = String(startOfMonth.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const handleRangeChange = (e) => {
    const val = e.target.value;
    setRange(val);
    if (val !== "custom") {
      const { startStr, endStr } = calculateDatesForRange(val);
      setStartDate(startStr);
      setEndDate(endStr);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.set("startDate", `${startDate}T00:00:00.000Z`);
      if (endDate) queryParams.set("endDate", `${endDate}T23:59:59.999Z`);

      const res = await fetch(`/api/doctor-summary?${queryParams.toString()}`).then((r) => r.json());
      if (res.success) {
        const parsed = res.summary.map((item) => ({
          ...item,
          amount: Number(item.amount) || 0,
          discount: Number(item.discount) || 0,
          netAmount: Number(item.netAmount) || 0,
          collection: Number(item.collection) || 0,
          incentivePercent: Number(item.incentivePercent) || 0,
          incentiveAmount: Number(item.incentiveAmount) || 0,
          registrations: item.registrations || [],
        }));
        setSummaryData(parsed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const handleResetFilters = () => {
    setRange("thismonth");
    const { startStr, endStr } = calculateDatesForRange("thismonth");
    setStartDate(startStr);
    setEndDate(endStr);
  };

  // Toggle single row accordion
  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle all rows expand/collapse
  const toggleAllRows = () => {
    const allExpanded = summaryData.length > 0 && summaryData.every((item) => expandedRows[item.id]);
    if (allExpanded) {
      setExpandedRows({});
    } else {
      const newMap = {};
      summaryData.forEach((item) => {
        newMap[item.id] = true;
      });
      setExpandedRows(newMap);
    }
  };

  // Helper to format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Helper to format Date & Time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Status Chip helper
  const getStatusChip = (status) => {
    const s = (status || "Pending").toLowerCase();
    let color = "default";
    let variant = "filled";

    if (s.includes("complete")) {
      color = "success";
    } else if (s.includes("pending")) {
      color = "warning";
    } else if (s.includes("sample") || s.includes("collect")) {
      color = "info";
    } else if (s.includes("cancel")) {
      color = "error";
    }

    return (
      <Chip
        label={status || "Pending"}
        size="small"
        color={color}
        variant={variant}
        sx={{ fontSize: "0.72rem", height: 20, fontWeight: 600 }}
      />
    );
  };

  // Excel Export for a single doctor
  const exportDoctorExcel = (doctor) => {
    if (!doctor || !doctor.registrations || doctor.registrations.length === 0) {
      showToast(`No referral records found for Dr. ${doctor?.name || "Doctor"} to export.`, "info");
      return;
    }

    const rows = doctor.registrations.map((reg, idx) => {
      const testNames = (reg.tests || []).map((t) => t.name).join(", ") || "-";
      const testBreakdown = (reg.tests || [])
        .map((t) => `${t.name} (Price: ₹${t.price}${t.expense > 0 ? `, Outsource Cost: -₹${t.expense}` : ""} => Base: ₹${(t.netBase || t.price).toFixed(2)} @ ${t.incentivePercent}% => ₹${(t.incentiveAmount || 0).toFixed(2)})`)
        .join(" | ");
      const totalOutsource = (reg.tests || []).reduce((sum, t) => sum + (t.expense || 0), 0);

      return {
        "S.No": idx + 1,
        "Date & Time": formatDateTime(reg.date),
        "Patient Name": reg.fullName || reg.name || "-",
        "Age": reg.age ? `${reg.age} ${reg.ageUnit || "Y"}` : "-",
        "Gender": reg.gender || "-",
        "Tests Booked": testNames,
        "Test-wise Incentive Breakdown": testBreakdown,
        "Total Outsource Cost (₹)": totalOutsource,
        "Net Amount (₹)": Number(reg.netAmount) || 0,
        "Incentive (₹)": Number(reg.incentiveAmount) || 0,
        "Received (₹)": Number(reg.receivedAmount) || 0,
        "Status": reg.status || "Completed",
      };
    });

    // Add total summary row
    rows.push({
      "S.No": "TOTAL",
      "Date & Time": `From ${formatDate(startDate)} to ${formatDate(endDate)}`,
      "Patient Name": `Doctor: ${doctor.name} (${doctor.code})`,
      "Age": "",
      "Gender": "",
      "Tests Booked": `Total Visits: ${doctor.count}`,
      "Test-wise Incentive Breakdown": "",
      "Total Outsource Cost (₹)": "",
      "Net Amount (₹)": Number(doctor.netAmount) || 0,
      "Incentive (₹)": Number(doctor.incentiveAmount) || 0,
      "Received (₹)": Number(doctor.collection) || 0,
      "Status": "",
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    const sheetName = (doctor.name || "Doctor").substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, "");
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const safeName = (doctor.name || "Doctor").replace(/[^a-zA-Z0-9_-]/g, "_");
    XLSX.writeFile(workbook, `${safeName}_Referrals_${startDate}_to_${endDate}.xlsx`);
    showToast(`Excel report exported for Dr. ${doctor.name}!`, "success");
  };

  // Excel Export for all doctors
  const exportAllDoctorsExcel = () => {
    if (summaryData.length === 0) {
      showToast("No doctor referral data available to export.", "info");
      return;
    }

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Doctor Summary
    const summaryRows = summaryData.map((doc, idx) => ({
      "S.No": idx + 1,
      "Doctor Name": doc.name,
      "Code": doc.code,
      "Last Paid Date": doc.lastPaid ? formatDate(doc.lastPaid) : "-",
      "Default Incentive Rate (%)": `${doc.incentivePercent}%`,
      "Patient Count": doc.count,
      "Total Amount (₹)": Number(doc.amount) || 0,
      "Discount (₹)": Number(doc.discount) || 0,
      "Net Amount (₹)": Number(doc.netAmount) || 0,
      "Doctor Incentive (₹)": Number(doc.incentiveAmount) || 0,
      "Collection / Received (₹)": Number(doc.collection) || 0,
    }));

    // Add totals row
    summaryRows.push({
      "S.No": "TOTAL",
      "Doctor Name": "Grand Total",
      "Code": "",
      "Last Paid Date": `From ${formatDate(startDate)} to ${formatDate(endDate)}`,
      "Default Incentive Rate (%)": "-",
      "Patient Count": totalCount,
      "Total Amount (₹)": totalAmount,
      "Discount (₹)": totalDiscount,
      "Net Amount (₹)": totalNetAmount,
      "Doctor Incentive (₹)": totalIncentive,
      "Collection / Received (₹)": totalCollection,
    });

    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Doctors Summary");

    // Sheet 2: All Referred Patients Breakdown
    const allPatientRows = [];
    let counter = 1;
    summaryData.forEach((doc) => {
      (doc.registrations || []).forEach((reg) => {
        const totalOutsource = (reg.tests || []).reduce((sum, t) => sum + (t.expense || 0), 0);
        const testBreakdown = (reg.tests || [])
          .map((t) => `${t.name} (Price: ₹${t.price}${t.expense > 0 ? `, Outsource: -₹${t.expense}` : ""} => Base: ₹${(t.netBase || t.price).toFixed(2)} @ ${t.incentivePercent}% => ₹${(t.incentiveAmount || 0).toFixed(2)})`)
          .join(" | ");

        allPatientRows.push({
          "S.No": counter++,
          "Doctor Name": doc.name,
          "Doctor Code": doc.code,
          "Date & Time": formatDateTime(reg.date),
          "Patient Name": reg.fullName || reg.name || "-",
          "Age": reg.age ? `${reg.age} ${reg.ageUnit || "Y"}` : "-",
          "Gender": reg.gender || "-",
          "Tests Booked": (reg.tests || []).map((t) => t.name).join(", ") || "-",
          "Test Breakdown": testBreakdown,
          "Outsource Cost (₹)": totalOutsource,
          "Net Amount (₹)": Number(reg.netAmount) || 0,
          "Doc Incentive (₹)": Number(reg.incentiveAmount) || 0,
          "Received (₹)": Number(reg.receivedAmount) || 0,
          "Status": reg.status || "Completed",
        });
      });
    });

    if (allPatientRows.length > 0) {
      const patientsSheet = XLSX.utils.json_to_sheet(allPatientRows);
      XLSX.utils.book_append_sheet(workbook, patientsSheet, "All Patient Referrals");
    }

    XLSX.writeFile(workbook, `Doctor_Referral_Full_Report_${startDate}_to_${endDate}.xlsx`);
    showToast("All doctors referral Excel exported successfully!", "success");
  };

  // Sum calculations
  const totalCount = summaryData.reduce((sum, item) => sum + item.count, 0);
  const totalAmount = summaryData.reduce((sum, item) => sum + item.amount, 0);
  const totalDiscount = summaryData.reduce((sum, item) => sum + item.discount, 0);
  const totalNetAmount = summaryData.reduce((sum, item) => sum + item.netAmount, 0);
  const totalIncentive = summaryData.reduce((sum, item) => sum + item.incentiveAmount, 0);
  const totalCollection = summaryData.reduce((sum, item) => sum + item.collection, 0);

  const areAllExpanded = summaryData.length > 0 && summaryData.every((item) => expandedRows[item.id]);

  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Header section with print utilities */}
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
            Doctor Referral Summary (Ref Summary)
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.3 }}>
            Track referred patient counts, test billings, incentives, and payments per doctor.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          {summaryData.length > 0 && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={areAllExpanded ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                onClick={toggleAllRows}
              >
                {areAllExpanded ? "Collapse All" : "Expand All"}
              </Button>
              <Button
                variant="outlined"
                color="success"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={exportAllDoctorsExcel}
              >
                Export Excel (XLS)
              </Button>
            </>
          )}
          <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={() => window.print()}>
            Print Summary
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenAddDocDrawer(true)}>
            Add Doctor
          </Button>
        </Box>
      </Box>

      {/* Date Filter Toolbar Card */}
      <Card variant="outlined" sx={{ mb: 3, bgcolor: "#ffffff" }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="period-select-label">Date Period</InputLabel>
                <Select
                  labelId="period-select-label"
                  value={range}
                  label="Date Period"
                  onChange={handleRangeChange}
                  sx={{ bgcolor: "background.paper" }}
                >
                  <MenuItem value="7days">Last 7 Days</MenuItem>
                  <MenuItem value="30days">Last 30 Days</MenuItem>
                  <MenuItem value="thismonth">This Month</MenuItem>
                  <MenuItem value="prevmonth">Previous Month</MenuItem>
                  <MenuItem value="3months">Last 3 Months</MenuItem>
                  <MenuItem value="6months">Last 6 Months</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                size="small"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setRange("custom");
                }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                size="small"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setRange("custom");
                }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex", gap: 1 }}>
              <Button variant="contained" fullWidth size="small" onClick={loadData} startIcon={<SearchIcon />}>
                Filter Summary
              </Button>
              <IconButton color="secondary" onClick={handleResetFilters} title="Reset filters">
                <ResetIcon />
              </IconButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Date range descriptor banner */}
      <Box
        sx={{
          bgcolor: "#ecfdf5",
          p: 1.5,
          borderRadius: "8px 8px 0 0",
          border: "1px solid #a7f3d0",
          borderBottom: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#065f46" }}>
          Ref Summary from {formatDate(startDate)} to {formatDate(endDate)}
        </Typography>
        <Typography variant="caption" sx={{ color: "#047857", fontWeight: 600 }}>
          Click the down arrow on any doctor row to view all referred patient details
        </Typography>
      </Box>

      {/* Doctor Summary Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "0 0 8px 8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "visible" }}>
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 8, gap: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Loading summary reports...
            </Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead
              sx={{
                position: "sticky",
                top: { xs: 56, sm: 64 },
                zIndex: 10,
                bgcolor: "#f1f5f9",
                "& th": {
                  position: "sticky",
                  top: { xs: 56, sm: 64 },
                  zIndex: 10,
                  bgcolor: "#f1f5f9",
                  fontWeight: 700,
                  borderBottom: "2px solid #cbd5e1",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                },
              }}
            >
              <TableRow>
                <TableCell sx={{ width: 44, px: 1 }} align="center">
                  <Tooltip title={areAllExpanded ? "Collapse all doctors" : "Expand all doctors"}>
                    <IconButton size="small" onClick={toggleAllRows}>
                      {areAllExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SNO</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ref. By (Doctor)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Paid</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Incentive %</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Count</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount (₹)</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Pat.Dis (₹)</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Net Amount (₹)</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Doc.Inc (₹)</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Collection (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summaryData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No referral activities found in this date range.
                  </TableCell>
                </TableRow>
              ) : (
                summaryData.map((item, idx) => {
                  const isExpanded = Boolean(expandedRows[item.id]);
                  return (
                    <React.Fragment key={item.id}>
                      <TableRow
                        sx={{
                          bgcolor: isExpanded ? "rgba(15, 118, 110, 0.05)" : "inherit",
                          transition: "background-color 0.2s",
                          "&:hover": { bgcolor: "rgba(15, 118, 110, 0.08)" },
                          "& > td": {
                            borderBottom: isExpanded ? "none" : undefined,
                          },
                        }}
                      >
                        {/* Accordion toggle button */}
                        <TableCell align="center" sx={{ px: 1 }}>
                          <Tooltip title={isExpanded ? "Hide referred patients" : "View referred patients"}>
                            <IconButton
                              size="small"
                              onClick={() => toggleRow(item.id)}
                              color={isExpanded ? "primary" : "default"}
                              sx={{
                                transition: "transform 0.2s",
                                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              }}
                            >
                              <KeyboardArrowDownIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>

                        <TableCell sx={{ fontWeight: 500 }}>{idx + 1}</TableCell>

                        <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title="Edit Doctor Incentive">
                            <IconButton onClick={() => handleOpenEdit(item)} color="primary" size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={`Export ${item.name} Referral Report (Excel)`}>
                            <IconButton onClick={() => exportDoctorExcel(item)} color="success" size="small">
                              <FileDownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Doctor">
                            <IconButton onClick={() => handleOpenDelete(item)} color="error" size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: "primary.main",
                                cursor: "pointer",
                                "&:hover": { textDecoration: "underline" },
                              }}
                              onClick={() => toggleRow(item.id)}
                            >
                              {item.name}
                            </Typography>
                            {item.count > 0 && (
                              <Chip
                                label={`${item.count} pts`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 18, fontSize: "0.68rem", fontWeight: 700 }}
                              />
                            )}
                          </Box>
                        </TableCell>

                        <TableCell sx={{ color: "text.secondary" }}>{item.code}</TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{item.lastPaid ? formatDate(item.lastPaid) : "-"}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{item.incentivePercent}%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{item.count}</TableCell>
                        <TableCell align="right">₹{item.amount.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{item.discount.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{item.netAmount.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: "primary.dark", fontWeight: 700 }}>₹{item.incentiveAmount.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: "success.main", fontWeight: 700 }}>
                          {item.collection > 0 ? `₹${item.collection.toFixed(2)}` : "0.00"}
                        </TableCell>
                      </TableRow>

                      {/* Collapsible Accordion Row */}
                      <TableRow>
                        <TableCell colSpan={13} sx={{ py: 0, px: 2, borderBottom: isExpanded ? undefined : "none" }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2.5, px: 1 }}>
                              {/* Sub Header Box */}
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  p: 1.5,
                                  mb: 1.5,
                                  bgcolor: "#f8fafc",
                                  borderRadius: 1.5,
                                  border: "1px solid #e2e8f0",
                                  gap: 1.5,
                                }}
                              >
                                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                                  <PersonIcon sx={{ color: "primary.main", fontSize: 20 }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                                    Patients Referred by {item.name}
                                  </Typography>
                                  <Chip
                                    label={`Total: ${item.registrations?.length || 0} Registrations`}
                                    size="small"
                                    color="primary"
                                    sx={{ height: 22, fontSize: "0.75rem", fontWeight: 600 }}
                                  />
                                  {item.registrations && item.registrations.length > 0 && (
                                    <Button
                                      variant="outlined"
                                      color="success"
                                      size="small"
                                      startIcon={<FileDownloadIcon />}
                                      onClick={() => exportDoctorExcel(item)}
                                      sx={{
                                        height: 24,
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        ml: 1,
                                        textTransform: "none",
                                      }}
                                    >
                                      Export Doctor XLS
                                    </Button>
                                  )}
                                </Box>

                                <Stack direction="row" spacing={2} sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                                  <Box>
                                    Gross: <strong>₹{item.amount.toFixed(2)}</strong>
                                  </Box>
                                  <Box>
                                    Net: <strong>₹{item.netAmount.toFixed(2)}</strong>
                                  </Box>
                                  <Box sx={{ color: "primary.dark" }}>
                                    Doc. Incentive: <strong>₹{item.incentiveAmount.toFixed(2)}</strong>
                                  </Box>
                                  <Box sx={{ color: "success.main" }}>
                                    Received: <strong>₹{item.collection.toFixed(2)}</strong>
                                  </Box>
                                </Stack>
                              </Box>

                              {/* Patients Detailed Table */}
                              {(!item.registrations || item.registrations.length === 0) ? (
                                <Box
                                  sx={{
                                    p: 3,
                                    textAlign: "center",
                                    bgcolor: "#fdfdfd",
                                    borderRadius: 1,
                                    border: "1px dashed #cbd5e1",
                                    color: "text.secondary",
                                  }}
                                >
                                  <Typography variant="body2">
                                    No patient visits found for <strong>{item.name}</strong> between {formatDate(startDate)} and {formatDate(endDate)}.
                                  </Typography>
                                </Box>
                              ) : (
                                <TableContainer
                                  component={Paper}
                                  variant="outlined"
                                  sx={{
                                    bgcolor: "#ffffff",
                                    borderRadius: 1.5,
                                    overflow: "hidden",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                  }}
                                >
                                  <Table size="small">
                                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }}>Date & Time</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }}>Patient Details</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }}>Tests Booked</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }} align="right">Net Amount (₹)</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }} align="right">Incentive</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }} align="right">Paid (₹)</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }} align="center">Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }} align="center">Print Actions</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {item.registrations.map((reg, regIdx) => (
                                        <TableRow
                                          key={reg.id}
                                          sx={{
                                            "&:hover": { bgcolor: "#f8fafc" },
                                            "&:last-child td, &:last-child th": { border: 0 },
                                          }}
                                        >
                                          <TableCell sx={{ fontSize: "0.78rem" }}>{regIdx + 1}</TableCell>
                                          <TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                                            {formatDateTime(reg.date)}
                                          </TableCell>
                                          <TableCell sx={{ fontSize: "0.78rem" }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                                              {reg.fullName || reg.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                              {reg.age ? `${reg.age} ${reg.ageUnit || "Y"}` : ""}
                                              {reg.gender ? ` • ${reg.gender}` : ""}
                                            </Typography>
                                          </TableCell>
                                          <TableCell sx={{ fontSize: "0.78rem", maxWidth: 300 }}>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                              {reg.tests && reg.tests.length > 0 ? (
                                                reg.tests.map((t, tIdx) => {
                                                  const tooltipTitle = (
                                                    <Box sx={{ p: 0.5, fontSize: "0.75rem" }}>
                                                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{t.name} ({t.code || "Test"})</Typography>
                                                      <div>Test Price: ₹{Number(t.price).toFixed(2)}</div>
                                                      {Number(t.expense) > 0 && <div style={{ color: "#fca5a5" }}>Outsource Cost: -₹{Number(t.expense).toFixed(2)}</div>}
                                                      <div>Net Base: ₹{(t.netBase !== undefined ? Number(t.netBase) : Number(t.price)).toFixed(2)}</div>
                                                      <div>Incentive: {t.incentivePercent}% {t.isSpecialRate ? "(Special Test Rate)" : "(Doctor Default Rate)"}</div>
                                                      <div style={{ fontWeight: 700, color: "#86efac", marginTop: "4px" }}>Doc Share: ₹{(Number(t.incentiveAmount) || 0).toFixed(2)}</div>
                                                    </Box>
                                                  );

                                                  let chipBg = "#f1f5f9";
                                                  let chipBorder = "#cbd5e1";
                                                  let chipColor = "inherit";

                                                  if (t.isSpecialRate) {
                                                    chipBg = "#e0e7ff";
                                                    chipBorder = "#a5b4fc";
                                                    chipColor = "#3730a3";
                                                  } else if (Number(t.expense) > 0) {
                                                    chipBg = "#fef3c7";
                                                    chipBorder = "#fde68a";
                                                    chipColor = "#92400e";
                                                  }

                                                  return (
                                                    <Tooltip key={tIdx} title={tooltipTitle} arrow>
                                                      <Chip
                                                        label={`${t.name}${Number(t.expense) > 0 ? ` (Out: -₹${Number(t.expense)})` : ""}${t.isSpecialRate ? ` (${t.incentivePercent}% Sp)` : ""}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                          fontSize: "0.7rem",
                                                          height: 20,
                                                          bgcolor: chipBg,
                                                          borderColor: chipBorder,
                                                          color: chipColor,
                                                          fontWeight: t.isSpecialRate || Number(t.expense) > 0 ? 600 : 400,
                                                          cursor: "pointer",
                                                        }}
                                                      />
                                                    </Tooltip>
                                                  );
                                                })
                                              ) : (
                                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                  No tests
                                                </Typography>
                                              )}
                                            </Box>
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontSize: "0.78rem", fontWeight: 600 }}>
                                            ₹{reg.netAmount.toFixed(2)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontSize: "0.78rem", color: "primary.dark", fontWeight: 700 }}>
                                            ₹{reg.incentiveAmount.toFixed(2)}
                                            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", fontSize: "0.68rem" }}>
                                              {reg.hasSpecialTests || reg.hasOutsourcedTests ? "(Itemized Calc)" : `(${reg.incentivePercent}%)`}
                                            </Typography>
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontSize: "0.78rem", whiteSpace: "nowrap", color: "success.main", fontWeight: 600 }}>
                                            ₹{reg.receivedAmount.toFixed(2)}
                                          </TableCell>
                                          <TableCell align="center" sx={{ fontSize: "0.78rem" }}>
                                            {getStatusChip(reg.status)}
                                          </TableCell>
                                          <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                                            <Tooltip title="Print / View Bill">
                                              <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => window.open(`/api/print-bill/${reg.id}`, "_blank")}
                                                sx={{ mr: 0.5 }}
                                              >
                                                <ReceiptIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Print / View Test Report">
                                              <IconButton
                                                size="small"
                                                color="success"
                                                onClick={() => window.open(`/api/print-report/${reg.regNo}?withFrame=true`, "_blank")}
                                              >
                                                <ReportIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}

              {/* Totals Row */}
              {summaryData.length > 0 && (
                <TableRow sx={{ bgcolor: "#f1f5f9", "& td": { fontWeight: 800 } }}>
                  <TableCell />
                  <TableCell colSpan={5}>Grand Total</TableCell>
                  <TableCell align="right">-</TableCell>
                  <TableCell align="right">{totalCount}</TableCell>
                  <TableCell align="right">₹{totalAmount.toFixed(2)}</TableCell>
                  <TableCell align="right">₹{totalDiscount.toFixed(2)}</TableCell>
                  <TableCell align="right">₹{totalNetAmount.toFixed(2)}</TableCell>
                  <TableCell align="right">₹{totalIncentive.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ color: "success.main" }}>₹{totalCollection.toFixed(2)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Right Side Drawer for adding a new doctor */}
      <AddDoctorDrawer
        open={openAddDocDrawer}
        onClose={() => setOpenAddDocDrawer(false)}
        onSuccess={() => loadData()}
      />

      {/* Edit Incentive Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Update Doctor Incentive</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the incentive percentage rate for <strong>{editingDoc?.name}</strong>. Existing registration records will not be affected.
          </DialogContentText>
          <TextField
            autoFocus
            label="Incentive Percentage (%)"
            type="number"
            fullWidth
            size="small"
            value={editIncentiveInput}
            onChange={(e) => setEditIncentiveInput(e.target.value)}
            slotProps={{ htmlInput: { min: 0, max: 100, step: 0.1 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenEditDialog(false)} variant="outlined" size="small">
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            size="small"
            disabled={savingEdit}
            startIcon={savingEdit ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {savingEdit ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>Delete Doctor</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deletingDoc?.name}</strong>?
            <br />
            They will no longer appear in the referral dropdowns on the registration page, but historical reports and billing calculations for this doctor will be preserved.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} variant="outlined" size="small">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            size="small"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {deleting ? "Deleting..." : "Confirm Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
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
    </Box>
  );
}
