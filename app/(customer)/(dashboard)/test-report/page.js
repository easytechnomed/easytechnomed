"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminPermissions } from "@/lib/clientAuth";
import {
  Box,
  Card,
  CardContent,
  TextField,
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
  Badge,
  Tooltip,
  ButtonGroup,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Snackbar,
  Alert,
  Stack,
  Drawer,
  Checkbox,
  FormControlLabel,
  Chip
} from "@mui/material";
import {
  Search as SearchIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  RestartAlt as ResetIcon,
  MoreVert as ActionsIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  AssignmentTurnedIn as SampleIcon,
  AddBox as AddBoxIcon,
  Science as ResultEntryIcon,
  Visibility as VisibilityIcon,
  QrCode as BarcodeIcon,
  ReceiptLong as ReceiptIcon,
  Payment as PaymentIcon,
  Block as CancelIcon,
  Notifications as ReminderIcon,
  CloudUpload as UploadIcon,
  PersonAdd as PersonAddIcon,
  AccountTree as BranchIcon,
  SwapHoriz as TransferIcon,
  CompareArrows as CompareIcon,
  NotificationImportant as UrgentIcon,
  Info as InfoIcon,
  LocalShipping as DeliveryIcon,
  UploadFile as UploadFileIcon,
  Description as FormFIcon,
  Article as WorksheetIcon,
  Paid as PaidIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
  AssignmentTurnedIn as TestCompletedIcon,
  AssignmentLate as TestPendingIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from "@mui/icons-material";
// Server Action imports removed - using REST API instead
import * as XLSX from "xlsx";
import ResultEntry from "./component/resultEntry";
import ShowResult from "./component/showResult";
import MoneyRecipt from "./component/MoneyRecipt";


const menuButtonStyle = {
  justifyContent: "flex-start",
  textAlign: "left",
  textTransform: "none",
  py: 1.0,
  px: 1.5,
  borderRadius: 1.5,
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "text.secondary",
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 1.2,
  transition: "all 0.15s ease-in-out",
  "& .MuiButton-startIcon": {
    marginRight: 0.8,
    "& .MuiSvgIcon-root": {
      fontSize: "1.1rem",
      transition: "all 0.15s ease-in-out"
    }
  },
  "&:hover": {
    bgcolor: "rgba(15, 118, 110, 0.08)",
    color: "primary.main",
    "& .MuiButton-startIcon .MuiSvgIcon-root": {
      color: "primary.main",
      transform: "scale(1.15)"
    }
  }
};

const activeMenuButtonStyle = {
  ...menuButtonStyle,
  color: "primary.main",
  bgcolor: "rgba(15, 118, 110, 0.04)",
  "& .MuiButton-startIcon .MuiSvgIcon-root": {
    color: "primary.main"
  },
  "&:hover": {
    bgcolor: "rgba(15, 118, 110, 0.12)",
    color: "primary.dark",
    "& .MuiButton-startIcon .MuiSvgIcon-root": {
      color: "primary.dark",
      transform: "scale(1.15)"
    }
  }
};

const dangerMenuButtonStyle = {
  ...menuButtonStyle,
  color: "error.main",
  "& .MuiButton-startIcon .MuiSvgIcon-root": {
    color: "error.main"
  },
  "&:hover": {
    bgcolor: "rgba(239, 68, 68, 0.08)",
    color: "error.dark",
    "& .MuiButton-startIcon .MuiSvgIcon-root": {
      color: "error.dark",
      transform: "scale(1.15)"
    }
  }
};







const getPaymentChip = (reg) => {
  const due = parseFloat(reg.dueAmount || 0);
  const received = parseFloat(reg.receivedAmount || 0);
  const total = parseFloat(reg.totalAmount || 0);

  if (due === 0 && total > 0) {
    return (
      <Chip
        icon={<CheckCircleIcon sx={{ fontSize: "0.85rem !important" }} />}
        label="Paid"
        size="small"
        sx={{
          fontSize: "0.68rem",
          fontWeight: 700,
          height: 20,
          bgcolor: "#dcfce7",
          color: "#166534",
          "& .MuiChip-icon": { color: "#166534" }
        }}
      />
    );
  } else if (due > 0 && received > 0) {
    return (
      <Chip
        icon={<HourglassIcon sx={{ fontSize: "0.85rem !important" }} />}
        label="Partial Paid"
        size="small"
        sx={{
          fontSize: "0.68rem",
          fontWeight: 700,
          height: 20,
          bgcolor: "#fef3c7",
          color: "#92400e",
          "& .MuiChip-icon": { color: "#92400e" }
        }}
      />
    );
  } else {
    return (
      <Chip
        icon={<CancelIcon sx={{ fontSize: "0.85rem !important" }} />}
        label="Not Paid"
        size="small"
        sx={{
          fontSize: "0.68rem",
          fontWeight: 700,
          height: 20,
          bgcolor: "#fee2e2",
          color: "#991b1b",
          "& .MuiChip-icon": { color: "#991b1b" }
        }}
      />
    );
  }
};

const getTestChip = (reg) => {
  if (reg.status === "Completed") {
    return (
      <Chip
        icon={<TestCompletedIcon sx={{ fontSize: "0.85rem !important" }} />}
        label="Test Completed"
        size="small"
        sx={{
          fontSize: "0.68rem",
          fontWeight: 700,
          height: 20,
          bgcolor: "#ccfbf1",
          color: "#0f766e",
          "& .MuiChip-icon": { color: "#0f766e" }
        }}
      />
    );
  } else {
    return (
      <Chip
        icon={<TestPendingIcon sx={{ fontSize: "0.85rem !important" }} />}
        label="Test Pending"
        size="small"
        sx={{
          fontSize: "0.68rem",
          fontWeight: 700,
          height: 20,
          bgcolor: "#ffedd5",
          color: "#c2410c",
          "& .MuiChip-icon": { color: "#c2410c" }
        }}
      />
    );
  }
};

const exportColumns = [
  { id: "sno", label: "SNO", getValue: (reg, idx) => idx + 1 },
  { id: "date", label: "Reg. Date", getValue: (reg) => {
      if (!reg.date) return "-";
      const d = new Date(reg.date);
      return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    }
  },
  { id: "regNo", label: "Reg. No", getValue: (reg) => reg.regNo },
  { id: "labId", label: "Pat. ID", getValue: (reg) => reg.labId },
  { id: "tests", label: "Test Name(s)", getValue: (reg) => reg.tests.map((t) => t.test?.name).join(", ") },
  { id: "name", label: "Patient Name", getValue: (reg) => `${reg.title} ${reg.name}` },
  { id: "gender", label: "Gender", getValue: (reg) => reg.gender },
  { id: "age", label: "Age", getValue: (reg) => `${Math.round(reg.age)}${reg.ageUnit?.charAt(0) || "Y"}` },
  { id: "mobile", label: "Mobile No", getValue: (reg) => reg.mobileNo },
  { id: "rptTime", label: "Rpt. Time", getValue: (reg) => {
      if (!reg.expRptDate) return "-";
      const d = new Date(reg.expRptDate);
      return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" }) + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
  },
  { id: "barcode", label: "Barcode", getValue: (reg) => reg.barcode ? reg.barcode.replace(/^,\s*/, "") : "-" },
  { id: "status", label: "Status", getValue: (reg) => reg.status },
];

export default function TestReportPage() {
  const router = useRouter();
  const { hasPermission } = useAdminPermissions();
  const canWrite = hasPermission("REGISTRATION_WRITE");
  const canDelete = hasPermission("REGISTRATION_DELETE");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 10); // default last 10 days
    return d.toISOString().substring(0, 10);
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
  const [search, setSearch] = useState("");

  // Popover Anchor for Actions Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReg, setSelectedReg] = useState(null);

  // Sample Management Dialog
  const [sampleDialogOpen, setSampleDialogOpen] = useState(false);
  const [sampleRows, setSampleRows] = useState([]);
  const [sampleSaving, setSampleSaving] = useState(false);

  // Result Entry Dialog
  const [resultDialogOpen, setResultDialogOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false);
  const [adminSettings, setAdminSettings] = useState({ framePdfUrl: "", useFrameDefault: true });

  // Money Receipt Drawer states
  const [receiptDrawerOpen, setReceiptDrawerOpen] = useState(false);

  // Export states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");
  const [selectedExportCols, setSelectedExportCols] = useState(exportColumns.map((c) => c.id));
  const [includeReportQr, setIncludeReportQr] = useState(false);
  const [includePaymentQr, setIncludePaymentQr] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings").then((r) => r.json());
        if (res.success && res.settings) {
          setAdminSettings({
            framePdfUrl: res.settings.framePdfUrl || "",
            useFrameDefault: res.settings.useFrameDefault ?? true,
            companyName: res.settings.companyName || "",
            email: res.settings.email || "",
            mobileNumber: res.settings.mobileNumber || "",
            address: res.settings.address || null
          });
        }
      } catch (err) {
        console.error("Failed to load admin settings in test-report page:", err);
      }
    }
    fetchSettings();
  }, [printDialogOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.set("startDate", `${startDate}T00:00:00.000Z`);
      if (endDate) queryParams.set("endDate", `${endDate}T23:59:59.999Z`);
      if (search) queryParams.set("search", search);
      queryParams.set("page", page.toString());
      queryParams.set("limit", limit.toString());

      const res = await fetch(`/api/registrations?${queryParams.toString()}`).then((r) => r.json());
      if (res.success) {
        setRegistrations(res.registrations);
        setTotal(res.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, page, limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    if (page === 1) {
      loadData();
    }
  };

  const handleResetFilters = () => {
    const d = new Date();
    d.setDate(d.getDate() - 10);
    setStartDate(d.toISOString().substring(0, 10));
    setEndDate(new Date().toISOString().substring(0, 10));
    setSearch("");
    setPage(1);
    if (page === 1) {
      loadData();
    }
  };

  // Toast Helpers
  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  // Actions Menu Event Handlers
  const handleOpenMenu = (event, reg) => {
    setAnchorEl(event.currentTarget);
    setSelectedReg(reg);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenReceiptDrawer = (reg) => {
    handleCloseMenu();
    setReceiptDrawerOpen(true);
  };

  const triggerAction = (actionName) => {
    handleCloseMenu();
    if (actionName === "Money Receipt") {
      setReceiptDrawerOpen(true);
    } else {
      showToast(`Action "${actionName}" triggered for patient ${selectedReg.name}`, "info");
    }
  };

  // Edit Registration
  const handleEditRegistration = () => {
    handleCloseMenu();
    if (selectedReg) {
      router.push(`/registration?edit=${selectedReg.id}`);
    }
  };

  // Delete Registration
  const handleDeleteRegistration = async () => {
    handleCloseMenu();
    if (!window.confirm(`Are you sure you want to delete patient registration ${selectedReg.regNo} (${selectedReg.name})?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/registrations/${selectedReg.id}`, { method: "DELETE" }).then((r) => r.json());
      if (res.success) {
        showToast(res.message, "success");
        loadData();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to delete registration", "error");
    }
  };

  // Print Report
  const handlePrintReport = () => {
    handleCloseMenu();
    setPrintDialogOpen(true);
  };

  // Show Report Directly
  const handleShowReportDirectly = () => {
    handleCloseMenu();
    setReportPreviewOpen(true);
  };

  // --- SAMPLE MANAGEMENT ---
  const handleOpenSampleManagement = async () => {
    const regId = selectedReg.id;
    handleCloseMenu();
    try {
      const res = await fetch(`/api/registrations/${regId}/samples`).then((r) => r.json());
      if (res.success) {
        const rows = res.registration.tests.map((rt) => ({
          testId: rt.test.id,
          testName: rt.test.name,
          sampleStatus: rt.sampleStatus,
          sampleBarcode: rt.sampleBarcode || selectedReg.barcode?.replace(/^,\s*/, "")?.split(" ")?.[0] || "",
          sampleRemark: rt.sampleRemark || "",
          sendTo: rt.sendTo || "-NA-",
          expense: rt.expense || 0,
          assessNo: rt.assessNo || "",
          pathologist: rt.pathologist || "-NA-",
          collectedBy: rt.collectedBy || "-NA-",
          product: rt.product || "-NA-"
        }));
        setSampleRows(rows);
        setSampleDialogOpen(true);
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to load sample details", "error");
    }
  };

  const handleSampleRowChange = (index, field, value) => {
    const updated = [...sampleRows];
    updated[index][field] = value;
    setSampleRows(updated);
  };

  const handleSaveSamples = async () => {
    setSampleSaving(true);
    try {
      const res = await fetch(`/api/registrations/${selectedReg.id}/samples`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleRows),
      }).then((r) => r.json());
      if (res.success) {
        showToast(res.message, "success");
        setSampleDialogOpen(false);
        loadData();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to save sample details", "error");
    } finally {
      setSampleSaving(false);
    }
  };

  // --- RESULT ENTRY ---
  const handleOpenResultEntry = () => {
    handleCloseMenu();
    setResultDialogOpen(true);
  };

  // Helper to format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }) + " " + d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  // Helper to format expected report date
  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit"
    }) + " " + d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const openExportDialog = (format) => {
    setExportFormat(format);
    setSelectedExportCols(exportColumns.map((c) => c.id));
    setIncludeReportQr(false);
    setIncludePaymentQr(false);
    setExportDialogOpen(true);
  };

  const handleExportExcel = () => {
    const data = registrations.map((reg, idx) => {
      const row = {};
      selectedExportCols.forEach((colId) => {
        const col = exportColumns.find((c) => c.id === colId);
        if (col) {
          row[col.label] = col.getValue(reg, idx);
        }
      });

      if (includeReportQr) {
        const cleanBarcode = reg.barcode ? reg.barcode.replace(/^,\s*/, "").split(" ")[0] : null;
        row["Report QR Link"] = `${window.location.origin}/api/print-report/${cleanBarcode || reg.id}?withFrame=true`;
      }
      if (includePaymentQr) {
        row["Payment QR Link"] = `${window.location.origin}/api/print-bill/${reg.id}`;
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patient Reports");
    XLSX.writeFile(workbook, `patient_reports_${new Date().toISOString().substring(0, 10)}.xlsx`);
    setExportDialogOpen(false);
    showToast("Excel exported successfully!", "success");
  };

  const handlePrintOrPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Popup blocker prevented opening print window", "error");
      return;
    }

    const activeHeaders = selectedExportCols
      .map((colId) => {
        const col = exportColumns.find((c) => c.id === colId);
        return col ? col.label : "";
      })
      .filter(Boolean);

    if (includeReportQr) activeHeaders.push("Report QR");
    if (includePaymentQr) activeHeaders.push("Payment QR");

    const rowsHtml = registrations
      .map((reg, idx) => {
        const cells = selectedExportCols.map((colId) => {
          const col = exportColumns.find((c) => c.id === colId);
          const val = col ? col.getValue(reg, idx) : "";
          return `<td>${val}</td>`;
        });

        if (includeReportQr) {
          const cleanBarcode = reg.barcode ? reg.barcode.replace(/^,\s*/, "").split(" ")[0] : null;
          const qrData = `${window.location.origin}/api/print-report/${cleanBarcode || reg.id}?withFrame=true`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;
          cells.push(`
            <td class="qr-container">
              <img src="${qrUrl}" class="qr-code" alt="Report QR" />
            </td>
          `);
        }

        if (includePaymentQr) {
          const qrData = `${window.location.origin}/api/print-bill/${reg.id}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;
          cells.push(`
            <td class="qr-container">
              <img src="${qrUrl}" class="qr-code" alt="Payment QR" />
            </td>
          `);
        }

        return `<tr>${cells.join("")}</tr>`;
      })
      .join("");

    const headerCellsHtml = activeHeaders.map((h) => `<th>${h}</th>`).join("");

    const htmlContent = `
      <html>
        <head>
          <title>Patient Test Reports List - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 30px; font-size: 11px; color: #333; }
            h2 { text-align: center; color: #111; margin-bottom: 20px; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: middle; }
            th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; font-size: 11px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .qr-code { width: 65px; height: 65px; display: block; margin: 0 auto; }
            .qr-container { text-align: center; width: 80px; padding: 4px; }
            .no-print-btn {
              padding: 8px 16px;
              background-color: #0f766e;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              font-size: 12px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              transition: background-color 0.2s;
            }
            .no-print-btn:hover { background-color: #0d5c56; }
            @media print {
              body { margin: 10px; }
              .no-print { display: none !important; }
              table { width: 100%; }
              th, td { padding: 4px 6px; }
              tr:nth-child(even) { background-color: transparent !important; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;" class="no-print">
            <button onclick="window.print()" class="no-print-btn">Print / Save as PDF</button>
            <span style="font-size: 12px; color: #64748b;">Adjust margins / orientation in print dialog if needed.</span>
          </div>
          <h2>Patient Test Reports List</h2>
          <table>
            <thead>
              <tr>
                ${headerCellsHtml}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setExportDialogOpen(false);
  };

  const handleExecuteExport = () => {
    if (selectedExportCols.length === 0) {
      showToast("Please select at least one column to export/print", "warning");
      return;
    }
    if (exportFormat === "excel") {
      handleExportExcel();
    } else {
      handlePrintOrPdf();
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header section with export utilities */}
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
          Patient Test Reports
        </Typography>

        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="Print List">
            <Button startIcon={<PrintIcon />} onClick={() => openExportDialog("print")}>Print</Button>
          </Tooltip>
          <Tooltip title="Save as PDF">
            <Button startIcon={<DownloadIcon />} onClick={() => openExportDialog("pdf")}>PDF</Button>
          </Tooltip>
          <Tooltip title="Download Excel">
            <Button startIcon={<DownloadIcon />} onClick={() => openExportDialog("excel")}>Excel</Button>
          </Tooltip>
        </ButtonGroup>
      </Box>

      {/* Filters Toolbar Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Box component="form" onSubmit={handleSearchSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="From Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="To Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Search Patient"
                  placeholder="Name, Reg No, Mobile..."
                  fullWidth
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton size="small" type="submit">
                        <SearchIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }} sx={{ display: "flex", gap: 1 }}>
                <Button variant="contained" fullWidth size="small" type="submit" startIcon={<SearchIcon />}>
                  Filter
                </Button>
                <IconButton color="secondary" onClick={handleResetFilters} title="Reset filters">
                  <ResetIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Registrations List Table */}
      <TableContainer component={Paper} variant="outlined">
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 8, gap: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Loading test reports...
            </Typography>
          </Box>
        ) : (
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: "#e2e8f0" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", width: "50px" }}>SNO</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", width: "60px" }} align="center">Actions</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Reg.Date</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Reg.No</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Pat.ID</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Test ID(s)</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Patient Name</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Gender</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Age</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Mobile No</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Rpt.Time</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Barcode</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No patient registrations found in this date range.
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((reg, idx) => {
                  const testCodes = reg.tests.map((t) => t.test.code).join(", ");
                  const testNamesTooltip = reg.tests.map((t) => t.test.name).join("\n");

                  return (
                    <TableRow
                      key={reg.id}
                      sx={{
                        "&:hover": { bgcolor: "rgba(15, 118, 110, 0.04)" },
                        transition: "background-color 0.2s"
                      }}
                    >
                      <TableCell sx={{ width: "50px" }}>{idx + 1}</TableCell>
                      <TableCell align="center" sx={{ width: "60px" }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => handleOpenMenu(e, reg)}
                        >
                          <ActionsIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(reg.date).split(" ")[0]}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "primary.main" }}>{reg.regNo}</TableCell>
                      <TableCell>{reg.labId}</TableCell>
                      <TableCell>
                        <Tooltip title={<pre style={{ fontFamily: "inherit" }}>{testNamesTooltip}</pre>}>
                          <Typography variant="body2" sx={{ cursor: "help", textDecoration: "underline dotted", fontSize: "0.82rem" }}>
                            {testCodes.length > 15 ? testCodes.substring(0, 15) + "..." : testCodes || "-"}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {reg.title} {reg.name}
                      </TableCell>
                      <TableCell>{reg.gender}</TableCell>
                      <TableCell>{Math.round(reg.age)}{reg.ageUnit.charAt(0)}</TableCell>
                      <TableCell>{reg.mobileNo}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatTimeOnly(reg.expRptDate)}</TableCell>
                      <TableCell sx={{ fontStyle: "italic", fontSize: "0.75rem" }}>
                        {reg.barcode ? reg.barcode.replace(/^,\s*/, "") : "-"}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.6} alignItems="center">
                          {getTestChip(reg)}
                          {getPaymentChip(reg)}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Pagination Bar */}
      {total > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: { xs: 2, sm: 0 },
            p: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "#ffffff",
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          }}
        >
          {/* Left Side: 1-10 of 25 */}
          <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
            {`${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total}`}
          </Typography>

          {/* Right Side Controls */}
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: { xs: 2, sm: 3 } }}>
            {/* Rows per page Selector */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.82rem" }}>
                Rows per page
              </Typography>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(0,0,0,0.15)",
                  backgroundColor: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#334155",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </Box>

            {/* Go to Page Selector */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.82rem" }}>
                Go to Page
              </Typography>
              <select
                value={page}
                onChange={(e) => setPage(parseInt(e.target.value))}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(0,0,0,0.15)",
                  backgroundColor: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#334155",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map((pNum) => (
                  <option key={pNum} value={pNum}>
                    {pNum}
                  </option>
                ))}
              </select>
            </Box>

            {/* Prev/Next buttons */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "6px", p: "4px" }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(total / limit)))}
                sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "6px", p: "4px" }}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}


      {/* --- DOUBLE-COLUMN ACTIONS MENU POPOVER --- */}
      {selectedReg && (
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCloseMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right"
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right"
          }}
          PaperProps={{
            sx: {
              p: 2.5,
              width: 280,
              borderRadius: 3,
              boxShadow: "0px 10px 30px rgba(0,0,0,0.12)",
              border: "1px solid rgba(0,0,0,0.08)",
              background: "#ffffff"
            }
          }}
        >
          <Box sx={{ mb: 1.5, p: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.2 }}>
              {selectedReg.title} {selectedReg.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Reg No: {selectedReg.regNo}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", gap: 2 }}>
            {/* Left Column */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
              {/*
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<AssignmentIcon />} onClick={() => triggerAction("Assign Collection")}>
                Assign Collection
              </Button>
              */}
              <Button size="small" variant="text" sx={activeMenuButtonStyle} startIcon={<SampleIcon />} onClick={handleOpenSampleManagement}>
                Sample Management
              </Button>
              {/*
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<AddBoxIcon />} onClick={() => triggerAction("Add / Edit product")}>
                Add / Edit product
              </Button>
              */}

              <Divider sx={{ my: 0.5, opacity: 0.6 }} />

              <Button size="small" variant="text" sx={activeMenuButtonStyle} startIcon={<ResultEntryIcon />} onClick={handleOpenResultEntry}>
                Result Entry
              </Button>
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<VisibilityIcon />} onClick={handleShowReportDirectly}>
                Show Result
              </Button>
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<PrintIcon />} onClick={handlePrintReport}>
                Report Print
              </Button>
              {/*
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<BarcodeIcon />} onClick={() => triggerAction("Print Barcode")}>
                Print Barcode
              </Button>
              */}

              <Divider sx={{ my: 0.5, opacity: 0.6 }} />

              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<ReceiptIcon />} onClick={() => triggerAction("Money Receipt")}>
                Money Receipt
              </Button>
              {/*
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<PaymentIcon />} onClick={() => triggerAction("Receipt inplace")}>
                Receipt inplace
              </Button>
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<PaidIcon />} onClick={() => triggerAction("Receipt All")}>
                Receipt All
              </Button>
              */}

              <Divider sx={{ my: 0.5, opacity: 0.6 }} />

              <Tooltip title={!canWrite ? "You do not have permission to edit registrations" : ""}>
                <span>
                  <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<EditIcon />} onClick={handleEditRegistration} disabled={!canWrite}>
                    Edit
                  </Button>
                </span>
              </Tooltip>
              {/*
              <Button size="small" variant="text" sx={dangerMenuButtonStyle} startIcon={<CancelIcon />} onClick={() => triggerAction("Cancel")}>
                Cancel
              </Button>
              */}
              <Tooltip title={!canDelete ? "You do not have permission to delete registrations" : ""}>
                <span>
                  <Button size="small" variant="text" sx={dangerMenuButtonStyle} startIcon={<DeleteIcon />} onClick={handleDeleteRegistration} disabled={!canDelete}>
                    Delete
                  </Button>
                </span>
              </Tooltip>
            </Box>

            {/* Vertical Divider & Right Column commented out since they are not used */}
            {/*
            <Divider orientation="vertical" flexItem sx={{ opacity: 0.6 }} />
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<ReminderIcon />} onClick={() => triggerAction("Add / Edit reminder")}>
                Add / Edit reminder
              </Button>
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<UploadIcon />} onClick={() => triggerAction("Upload Report")}>
                Upload Report
              </Button>

              <Divider sx={{ my: 0.5, opacity: 0.6 }} />

              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<PersonAddIcon />} onClick={() => triggerAction("Register Again")}>
                Register Again
              </Button>
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<BranchIcon />} onClick={() => triggerAction("Assign Branch")}>
                Assign Branch
              </Button>
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<TransferIcon />} onClick={() => triggerAction("Transfer Patient")}>
                Transfer Patient
              </Button>
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<DownloadIcon />} onClick={() => triggerAction("Report Download")}>
                Report Download
              </Button>
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<CompareIcon />} onClick={() => triggerAction("Compare Result")}>
                Compare Result
              </Button>

              <Divider sx={{ my: 0.5, opacity: 0.6 }} />

              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<UrgentIcon />} onClick={() => triggerAction("Mark Urgent")}>
                Mark Urgent
              </Button>
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<InfoIcon />} onClick={() => triggerAction("Extra Details")}>
                Extra Details
              </Button>
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<DeliveryIcon />} onClick={() => triggerAction("Delhivery Note")}>
                Delhivery Note
              </Button>
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<UploadFileIcon />} onClick={() => triggerAction("Upload Document")}>
                Upload Document
              </Button>

              <Divider sx={{ my: 0.5, opacity: 0.6 }} />

              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<FormFIcon />} onClick={() => triggerAction("Form F")}>
                Form F
              </Button>
              <Button size="small" variant="text" sx={menuButtonStyle} startIcon={<WorksheetIcon />} onClick={() => triggerAction("Worksheet")}>
                Worksheet
              </Button>
            </Box>
            */}
          </Box>
        </Popover>
      )}

      {/* --- SAMPLE MANAGEMENT DIALOG --- */}
      <Dialog
        open={sampleDialogOpen}
        onClose={() => setSampleDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText", py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            🖋 Sample Management <span style={{ fontSize: "0.8rem", fontWeight: 400, opacity: 0.8 }}>(Status and barcode registration)</span>
          </Typography>
          <IconButton onClick={() => setSampleDialogOpen(false)} size="small" sx={{ color: "primary.contrastText" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, p: 2 }}>
          {selectedReg && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2"><strong>Patient:</strong> {selectedReg.title} {selectedReg.name} / {selectedReg.age.toFixed(2)} {selectedReg.ageUnit} / {selectedReg.gender}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2"><strong>Partner:</strong> Main Lab Group <strong>Address:</strong> Local branch office</Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Wing</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Test Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Barcode</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Sample Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Remark</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Send to</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Expense</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Assess. no</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Pathologist</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Collected By</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "grey.100" }}>Product</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleRows.map((row, idx) => (
                  <TableRow key={row.testId}>
                    <TableCell>-NA-</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>{row.testName}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.sampleBarcode}
                        onChange={(e) => handleSampleRowChange(idx, "sampleBarcode", e.target.value)}
                        variant="outlined"
                        sx={{ width: 120, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={row.sampleStatus}
                        onChange={(e) => handleSampleRowChange(idx, "sampleStatus", e.target.value)}
                        sx={{ width: 110, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      >
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Accepted">Accepted</MenuItem>
                        <MenuItem value="Rejected">Rejected</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.sampleRemark}
                        onChange={(e) => handleSampleRowChange(idx, "sampleRemark", e.target.value)}
                        placeholder="Remark"
                        sx={{ width: 120, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={row.sendTo}
                        onChange={(e) => handleSampleRowChange(idx, "sendTo", e.target.value)}
                        sx={{ width: 100, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      >
                        <MenuItem value="-NA-">-NA-</MenuItem>
                        <MenuItem value="Main Lab">Main Lab</MenuItem>
                        <MenuItem value="Branch Lab">Branch Lab</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.expense}
                        onChange={(e) => handleSampleRowChange(idx, "expense", e.target.value)}
                        sx={{ width: 70, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.assessNo}
                        onChange={(e) => handleSampleRowChange(idx, "assessNo", e.target.value)}
                        sx={{ width: 80, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={row.pathologist}
                        onChange={(e) => handleSampleRowChange(idx, "pathologist", e.target.value)}
                        sx={{ width: 120, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      >
                        <MenuItem value="-NA-">-NA-</MenuItem>
                        <MenuItem value="Dr. Ahmadi">Dr. Ahmadi</MenuItem>
                        <MenuItem value="Dr. ANAND KUMAR">Dr. ANAND KUMAR</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={row.collectedBy}
                        onChange={(e) => handleSampleRowChange(idx, "collectedBy", e.target.value)}
                        sx={{ width: 110, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                      >
                        <MenuItem value="-NA-">-NA-</MenuItem>
                        <MenuItem value="Anima Lab">Anima Lab</MenuItem>
                        <MenuItem value="Staff">Staff</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>-NA-</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSampleDialogOpen(false)} variant="outlined" size="small">Cancel</Button>
          <Tooltip title={!canWrite ? "You do not have permission to modify samples" : ""}>
            <span>
              <Button
                onClick={handleSaveSamples}
                variant="contained"
                size="small"
                startIcon={sampleSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={sampleSaving || !canWrite}
              >
                Save Samples
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* --- TEST RESULT ENTRY DIALOG --- */}
      <ResultEntry
        open={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        selectedReg={selectedReg}
        onSaveSuccess={loadData}
        canWrite={canWrite}
        handlePrintReport={handlePrintReport}
      />

      {/* --- PRINT OPTION DIALOG --- */}
      <Dialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          🖨️ Select Print Option
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose whether to overlay the clinical report onto your pre-printed letterhead template or generate it on a blank page.
          </Typography>

          <Stack spacing={2} sx={{ mt: 1 }}>
            {adminSettings.framePdfUrl ? (
              <Button
                variant="contained"
                fullWidth
                color="primary"
                onClick={() => {
                  window.open(`/api/print-report/${selectedReg?.id}?withFrame=true`, "_blank");
                  setPrintDialogOpen(false);
                }}
                sx={{ py: 1.2, fontWeight: 700 }}
              >
                Print with Letterhead Frame
              </Button>
            ) : (
              <Button
                variant="contained"
                fullWidth
                color="warning"
                onClick={() => {
                  router.push("/settings");
                  setPrintDialogOpen(false);
                }}
                sx={{ py: 1.2, fontWeight: 700 }}
              >
                Upload your Frame
              </Button>
            )}

            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                window.open(`/api/print-report/${selectedReg?.id}?withFrame=false`, "_blank");
                setPrintDialogOpen(false);
              }}
              sx={{ py: 1.2, fontWeight: 700 }}
            >
              Print without Letterhead Frame
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPrintDialogOpen(false)} variant="text" color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <ShowResult
        open={reportPreviewOpen}
        onClose={() => setReportPreviewOpen(false)}
        selectedReg={selectedReg}
      />

      <MoneyRecipt
        open={receiptDrawerOpen}
        onClose={() => setReceiptDrawerOpen(false)}
        selectedReg={selectedReg}
        onSaveSuccess={loadData}
        canWrite={canWrite}
      />

      {/* --- TOAST ALERTS --- */}
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

      {/* --- EXPORT OPTIONS DIALOG --- */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 800, py: 2 }}>
          ⚙️ Export & Print Options - {exportFormat.toUpperCase()}
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Select Columns to Include:
            </Typography>
            <Box>
              <Button size="small" onClick={() => setSelectedExportCols(exportColumns.map(c => c.id))} sx={{ textTransform: "none", py: 0, minWidth: 0, mr: 1.5, fontWeight: 700 }}>
                Select All
              </Button>
              <Button size="small" onClick={() => setSelectedExportCols([])} sx={{ textTransform: "none", py: 0, minWidth: 0, fontWeight: 700 }} color="secondary">
                Deselect All
              </Button>
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            {exportColumns.map((col) => {
              const isChecked = selectedExportCols.includes(col.id);
              return (
                <FormControlLabel
                  key={col.id}
                  control={
                    <Checkbox
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedExportCols([...selectedExportCols, col.id]);
                        } else {
                          setSelectedExportCols(selectedExportCols.filter((id) => id !== col.id));
                        }
                      }}
                      color="primary"
                    />
                  }
                  label={col.label}
                  sx={{ width: "45%", mr: 0 }}
                />
              );
            })}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Additional Options (Append to each row):
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeReportQr}
                  onChange={(e) => setIncludeReportQr(e.target.checked)}
                  color="primary"
                />
              }
              label="Include Report QR"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={includePaymentQr}
                  onChange={(e) => setIncludePaymentQr(e.target.checked)}
                  color="primary"
                />
              }
              label="Include Payment QR"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "grey.50" }}>
          <Button onClick={() => setExportDialogOpen(false)} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleExecuteExport} variant="contained" color="primary" sx={{ fontWeight: 700 }}>
            Confirm & {exportFormat === "excel" ? "Export" : exportFormat === "pdf" ? "Save as PDF" : "Print"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
