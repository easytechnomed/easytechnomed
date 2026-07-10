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

const getParamKey = (name) => {
  if (!name) return "";
  const normalized = name
    .replace(/^[\s\d.\-*()#+:/]*/, "") // Strip numbers, dots, spaces, special chars at start
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  // Bilirubin
  if (normalized === "total bilirubin" || normalized === "bilirubin total" || normalized.includes("serum bilirubin (total)") || normalized === "serum bilirubin total") return "tb";
  if (normalized === "direct bilirubin" || normalized === "bilirubin direct" || normalized.includes("serum bilirubin (direct)") || normalized === "serum bilirubin direct") return "db";
  if (normalized === "indirect bilirubin" || normalized === "bilirubin indirect" || normalized.includes("serum bilirubin (indirect)") || normalized === "serum bilirubin indirect") return "ib";

  // Proteins
  if (normalized === "total protein" || normalized === "protein total" || normalized === "serum total protein") return "tp";
  if (normalized === "albumin" || normalized === "serum albumin") return "alb";
  if (normalized === "globulin" || normalized === "serum globulin") return "glob";
  if (normalized === "albumin/globulin ratio" || normalized === "a/g ratio" || normalized === "a : g ratio" || normalized.includes("albumin globulin ratio") || normalized.includes("albumin/globulin")) return "agr";

  // Renal
  if (normalized === "blood urea" || normalized === "serum urea" || normalized === "urea") return "urea";
  if (normalized === "blood urea nitrogen" || normalized === "bun" || normalized === "blood urea nitrogen(bun)" || normalized === "blood urea nitrogen (bun)") return "bun";
  if (normalized === "serum creatinine" || normalized === "creatinine") return "cr";
  if (normalized === "bun/creatinine ratio" || normalized === "bun:creatinine ratio" || normalized.includes("bun/creatinine")) return "bcr";
  if (normalized === "urea/creatinine ratio" || normalized === "urea:creatinine ratio" || normalized.includes("urea/creatinine")) return "ucr";

  // Lipids
  if (normalized === "total cholesterol" || normalized === "cholesterol" || normalized === "serum cholesterol") return "tc";
  if (normalized === "hdl cholesterol" || normalized === "hdl" || normalized === "hdl-cholesterol" || normalized === "serum hdl") return "hdl";
  if (normalized === "ldl cholesterol" || normalized === "ldl" || normalized === "ldl-cholesterol" || normalized === "serum ldl") return "ldl";
  if (normalized === "vldl cholesterol" || normalized === "vldl" || normalized === "vldl-cholesterol" || normalized === "serum vldl") return "vldl";
  if (normalized === "triglycerides" || normalized === "triglyceride" || normalized === "serum triglycerides") return "tg";
  if (normalized === "cholesterol/hdl ratio" || normalized === "chol/hdl ratio" || normalized.includes("cholesterol/hdl")) return "chr";
  if (normalized === "ldl/hdl ratio" || normalized.includes("ldl/hdl")) return "lhr";

  // CBC
  if (normalized === "haemoglobin" || normalized === "hemoglobin" || normalized === "hb") return "hb";
  if (normalized === "pcv (haematocrit)" || normalized === "pcv" || normalized === "haematocrit" || normalized === "hematocrit") return "pcv";
  if (normalized === "rbc count (red blood cells)" || normalized === "rbc count" || normalized === "rbc" || normalized === "red blood cells") return "rbc";
  if (normalized === "mcv") return "mcv";
  if (normalized === "mch") return "mch";
  if (normalized === "mchc") return "mchc";

  return null;
};

const calculateAllDependents = (values, tests, changedId) => {
  const res = { ...values };

  // 1. Build mappings
  const keyToId = {};
  const idToKey = {};
  tests.forEach((test) => {
    (test.parameters || []).forEach((param) => {
      const key = getParamKey(param.name);
      if (key) {
        keyToId[key] = param.id;
        idToKey[param.id] = key;
      }
    });
  });

  const changedKey = changedId ? idToKey[changedId] : null;

  // Helper to get numeric value
  const getVal = (key) => {
    const id = keyToId[key];
    if (!id) return null;
    const val = res[id];
    if (val === undefined || val === null || val === "") return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  // Helper to set value
  const setVal = (key, value) => {
    const id = keyToId[key];
    if (id && value !== null && !isNaN(value) && isFinite(value)) {
      const formatted = Number.isInteger(value) ? value.toString() : parseFloat(value.toFixed(2)).toString();
      res[id] = formatted;
    }
  };

  // --- 1. Bilirubin: db + ib = tb ---
  const tb = getVal("tb");
  const db = getVal("db");
  const ib = getVal("ib");

  if (changedKey === "tb") {
    if (db !== null) setVal("ib", tb - db);
    else if (ib !== null) setVal("db", tb - ib);
  } else if (changedKey === "db") {
    if (tb !== null) setVal("ib", tb - db);
    else if (ib !== null) setVal("tb", db + ib);
  } else if (changedKey === "ib") {
    if (tb !== null) setVal("db", tb - ib);
    else if (db !== null) setVal("tb", db + ib);
  } else {
    // Initial load or other parameter change: fill missing if 2 out of 3 present
    if (tb !== null && db !== null && ib === null) setVal("ib", tb - db);
    else if (tb !== null && ib !== null && db === null) setVal("db", tb - ib);
    else if (db !== null && ib !== null && tb === null) setVal("tb", db + ib);
  }

  // --- 2. Proteins: alb + glob = tp ---
  const tp = getVal("tp");
  const alb = getVal("alb");
  const glob = getVal("glob");

  if (changedKey === "tp") {
    if (alb !== null) setVal("glob", tp - alb);
    else if (glob !== null) setVal("alb", tp - glob);
  } else if (changedKey === "alb") {
    if (tp !== null) setVal("glob", tp - alb);
    else if (glob !== null) setVal("tp", alb + glob);
  } else if (changedKey === "glob") {
    if (tp !== null) setVal("alb", tp - glob);
    else if (alb !== null) setVal("tp", alb + glob);
  } else {
    if (tp !== null && alb !== null && glob === null) setVal("glob", tp - alb);
    else if (tp !== null && glob !== null && alb === null) setVal("alb", tp - glob);
    else if (alb !== null && glob !== null && tp === null) setVal("tp", alb + glob);
  }

  // A/G Ratio: alb / glob
  const updatedAlb = getVal("alb");
  const updatedGlob = getVal("glob");
  if (updatedAlb !== null && updatedGlob !== null && updatedGlob !== 0) {
    setVal("agr", updatedAlb / updatedGlob);
  }

  // --- 3. Renal: bun * 2.14 = urea ---
  const urea = getVal("urea");
  const bun = getVal("bun");
  const cr = getVal("cr");

  if (changedKey === "urea") {
    setVal("bun", urea / 2.14);
  } else if (changedKey === "bun") {
    setVal("urea", bun * 2.14);
  } else {
    if (urea !== null && bun === null) setVal("bun", urea / 2.14);
    else if (bun !== null && urea === null) setVal("urea", bun * 2.14);
  }

  const updatedBun = getVal("bun");
  const updatedUrea = getVal("urea");
  if (cr !== null && cr !== 0) {
    if (updatedBun !== null) setVal("bcr", updatedBun / cr);
    if (updatedUrea !== null) setVal("ucr", updatedUrea / cr);
  }

  // --- 4. Lipids ---
  const tg = getVal("tg");
  // tg = vldl * 5 => vldl = tg / 5
  if (changedKey === "tg") {
    if (tg !== null) setVal("vldl", tg / 5);
  } else if (changedKey === "vldl") {
    const vldl = getVal("vldl");
    if (vldl !== null) setVal("tg", vldl * 5);
  } else {
    if (tg !== null && getVal("vldl") === null) setVal("vldl", tg / 5);
  }

  // tc = hdl + ldl + vldl
  const tc = getVal("tc");
  const hdl = getVal("hdl");
  const ldl = getVal("ldl");
  const vldl = getVal("vldl");

  if (changedKey === "tc") {
    if (hdl !== null && vldl !== null) setVal("ldl", tc - hdl - vldl);
    else if (ldl !== null && vldl !== null) setVal("hdl", tc - ldl - vldl);
    else if (hdl !== null && ldl !== null) setVal("vldl", tc - hdl - ldl);
  } else if (changedKey === "ldl") {
    if (hdl !== null && vldl !== null) setVal("tc", hdl + ldl + vldl);
    else if (tc !== null && vldl !== null) setVal("hdl", tc - ldl - vldl);
    else if (tc !== null && hdl !== null) setVal("vldl", tc - hdl - ldl);
  } else if (changedKey === "hdl") {
    if (ldl !== null && vldl !== null) setVal("tc", hdl + ldl + vldl);
    else if (tc !== null && vldl !== null) setVal("ldl", tc - hdl - vldl);
    else if (tc !== null && ldl !== null) setVal("vldl", tc - hdl - ldl);
  } else if (changedKey === "vldl" || (changedKey === "tg" && tg !== null)) {
    const currentVldl = getVal("vldl");
    if (currentVldl !== null) {
      if (hdl !== null && ldl !== null) setVal("tc", hdl + ldl + currentVldl);
      else if (tc !== null && hdl !== null) setVal("ldl", tc - hdl - currentVldl);
      else if (tc !== null && ldl !== null) setVal("hdl", tc - ldl - currentVldl);
    }
  } else {
    if (tc !== null && hdl !== null && vldl !== null && ldl === null) setVal("ldl", tc - hdl - vldl);
    else if (hdl !== null && ldl !== null && vldl !== null && tc === null) setVal("tc", hdl + ldl + vldl);
  }

  const updatedTc = getVal("tc");
  const updatedHdl = getVal("hdl");
  const updatedLdl = getVal("ldl");
  if (updatedHdl !== null && updatedHdl !== 0) {
    if (updatedTc !== null) setVal("chr", updatedTc / updatedHdl);
    if (updatedLdl !== null) setVal("lhr", updatedLdl / updatedHdl);
  }

  // --- 5. CBC: MCV, MCH, MCHC ---
  const hb = getVal("hb");
  const pcv = getVal("pcv");
  const rbc = getVal("rbc");

  if (pcv !== null && rbc !== null && rbc !== 0) {
    setVal("mcv", (pcv / rbc) * 10);
  }
  if (hb !== null && rbc !== null && rbc !== 0) {
    setVal("mch", (hb / rbc) * 10);
  }
  if (hb !== null && pcv !== null && pcv !== 0) {
    setVal("mchc", (hb / pcv) * 100);
  }

  return res;
};
const isOutOfRange = (valStr, min, max) => {
  if (!valStr || min === null || max === null) return false;
  const num = parseFloat(valStr);
  if (isNaN(num)) return false;
  return num < min || num > max;
};

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
  const [resultRegDetails, setResultRegDetails] = useState(null);
  const [resultTests, setResultTests] = useState([]);
  const [resultValues, setResultValues] = useState({}); // { [paramId]: value }
  const [reportNotes, setReportNotes] = useState("");
  const [resultSaving, setResultSaving] = useState(false);

  // Parameter Configurator Dialog
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configTest, setConfigTest] = useState(null);
  const [configParams, setConfigParams] = useState([]);

  // Toast notifications
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [adminSettings, setAdminSettings] = useState({ framePdfUrl: "", useFrameDefault: true });

  // Money Receipt Drawer states
  const [receiptDrawerOpen, setReceiptDrawerOpen] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [receivedInput, setReceivedInput] = useState(0);
  const [discountInput, setDiscountInput] = useState(0);
  const [discountPercentInput, setDiscountPercentInput] = useState(0);
  const [paymentModeInput, setPaymentModeInput] = useState("Cash");
  const [paymentRefNoInput, setPaymentRefNoInput] = useState("");
  const [remarkInput, setRemarkInput] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [sendSms, setSendSms] = useState(false);
  const [sendMail, setSendMail] = useState(false);

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
    loadData();
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

  const handleOpenReceiptDrawer = async (reg) => {
    setLoadingReceipt(true);
    setReceiptDrawerOpen(true);
    try {
      const res = await fetch(`/api/registrations/${reg.id}`).then((r) => r.json());
      if (res.success && res.registration) {
        setSelectedRegistration(res.registration);

        // Initialize inputs
        const total = parseFloat(res.registration.totalAmount || 0);
        const discount = parseFloat(res.registration.discountAmount || 0);
        const alreadyPaid = parseFloat(res.registration.receivedAmount || 0);
        const remainingDue = Math.max(0, total - discount - alreadyPaid);

        setDiscountInput(discount);
        setDiscountPercentInput(parseFloat(res.registration.discountPercent || 0));
        setReceivedInput(remainingDue); // default received input to remaining due
        setPaymentModeInput(res.registration.paymentMode || "Cash");
        setPaymentRefNoInput(res.registration.paymentRefNo || "");
        setRemarkInput("");
      } else {
        showToast(res.error || "Failed to load registration details.", "error");
        setReceiptDrawerOpen(false);
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading registration details.", "error");
      setReceiptDrawerOpen(false);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handleDiscountAmountChange = (val) => {
    const amt = parseFloat(val) || 0;
    setDiscountInput(amt);
    const total = parseFloat(selectedRegistration?.totalAmount || 0);
    if (total > 0) {
      setDiscountPercentInput(Math.round((amt / total) * 10000) / 100);
    }
  };

  const handleDiscountPercentChange = (val) => {
    const pct = parseFloat(val) || 0;
    setDiscountPercentInput(pct);
    const total = parseFloat(selectedRegistration?.totalAmount || 0);
    setDiscountInput(Math.round(total * (pct / 100) * 100) / 100);
  };

  const handleSavePayment = async () => {
    if (!selectedRegistration) return;
    setSavingPayment(true);
    try {
      const res = await fetch(`/api/registrations/${selectedRegistration.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          received: parseFloat(receivedInput) || 0,
          discountPercent: parseFloat(discountPercentInput) || 0,
          discountAmount: parseFloat(discountInput) || 0,
          paymentMode: paymentModeInput,
          paymentRefNo: paymentRefNoInput,
          remark: remarkInput,
        })
      }).then((r) => r.json());

      if (res.success) {
        showToast("Payment recorded successfully!", "success");
        setReceiptDrawerOpen(false);
        loadData(); // reload test reports table list
      } else {
        showToast(res.error || "Failed to record payment.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred while saving payment.", "error");
    } finally {
      setSavingPayment(false);
    }
  };

  const handlePrintReceipt = (reg) => {
    if (!reg) return;
    window.open(`/api/print-bill/${reg.id}`, "_blank");
  };

  const triggerAction = (actionName) => {
    handleCloseMenu();
    if (actionName === "Money Receipt") {
      handleOpenReceiptDrawer(selectedReg);
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
  const handleShowReportDirectly = async () => {
    handleCloseMenu();
    setPreviewLoading(true);
    setReportPreviewOpen(true);
    try {
      const res = await fetch(`/api/registrations/${selectedReg.id}/parameters`).then((r) => r.json());
      if (res.success) {
        setPreviewData(res.registration);
      } else {
        showToast(res.message, "error");
        setReportPreviewOpen(false);
      }
    } catch (err) {
      showToast(err.message || "Failed to load report preview", "error");
      setReportPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
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
  const handleOpenResultEntry = async () => {
    const regId = selectedReg.id;
    handleCloseMenu();
    try {

      // 2. Fetch test parameters
      const res = await fetch(`/api/registrations/${regId}/parameters`).then((r) => r.json());
      if (res.success) {
        setResultRegDetails(res.registration);

        // Map tests and their parameters
        const tests = res.registration.tests.map(rt => rt.test);
        setResultTests(tests);

        // Map current result values
        const values = {};
        res.registration.results.forEach((r) => {
          values[r.testParameterId] = r.value;
        });
        setResultValues(values);
        setReportNotes(res.registration.remark || "");
        setResultDialogOpen(true);
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to load result parameters", "error");
    }
  };

  const handleResultValueChange = (paramId, val) => {
    const updatedValues = {
      ...resultValues,
      [paramId]: val
    };
    const finalValues = calculateAllDependents(updatedValues, resultTests, paramId);
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

  const handleSaveResults = async () => {
    setResultSaving(true);
    try {
      // Map result values into array structure
      const resultsData = Object.keys(resultValues).map(paramId => ({
        testParameterId: parseInt(paramId),
        value: resultValues[paramId]
      }));

      const res = await fetch(`/api/registrations/${resultRegDetails.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultsData, reportNotes }),
      }).then((r) => r.json());
      if (res.success) {
        showToast(res.message, "success");
        setResultDialogOpen(false);
        loadData();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to save results", "error");
    } finally {
      setResultSaving(false);
    }
  };

  // Helper to determine active normal range based on age/gender
  const getReferenceRange = (param, reg) => {
    const isBaby = reg.ageUnit !== "Year" || reg.age < 12;
    if (isBaby) {
      return {
        rangeStr: param.normalRangeBaby || param.normalRangeDefault || "Normal",
        min: param.minValBaby,
        max: param.maxValBaby
      };
    }
    if (reg.gender === "Male") {
      return {
        rangeStr: param.normalRangeMale || param.normalRangeDefault || "Normal",
        min: param.minValMale,
        max: param.maxValMale
      };
    }
    return {
      rangeStr: param.normalRangeFemale || param.normalRangeDefault || "Normal",
      min: param.minValFemale,
      max: param.maxValFemale
    };
  };

  // Helper to check if result is out of range
  const isOutOfRange = (val, min, max) => {
    if (val === "" || val === undefined || val === null) return false;
    const num = parseFloat(val);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return true;
    if (max !== null && num > max) return true;
    return false;
  };

  // --- PARAMETER CONFIGURATOR ---
  const handleOpenConfigurator = (test) => {
    setConfigTest(test);
    // Clone parameters list
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

        // Re-load result entry details to show updated parameters
        if (resultRegDetails) {
          const freshParams = await fetch(`/api/registrations/${resultRegDetails.id}/parameters`).then((r) => r.json());
          if (freshParams.success) {
            setResultRegDetails(freshParams.registration);
            setResultTests(freshParams.registration.tests.map(rt => rt.test));
          }
        }
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to update parameters setup", "error");
    }
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
      {resultRegDetails && (
        <Dialog
          open={resultDialogOpen}
          onClose={() => setResultDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText", py: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              🧪 Test Result of Patient : {resultRegDetails.name} / Age: {resultRegDetails.age.toFixed(2)} {resultRegDetails.ageUnit} / {resultRegDetails.gender} / Reg No: {resultRegDetails.regNo}
            </Typography>
            <IconButton onClick={() => setResultDialogOpen(false)} size="small" sx={{ color: "primary.contrastText" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2, mt: 1 }}>
            {/* Header info */}
            <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption" color="text.secondary">Barcode</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{resultRegDetails.barcode?.replace(/^,\s*/, "") || "-"}</Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption" color="text.secondary">Mobile No</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{resultRegDetails.mobileNo}</Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption" color="text.secondary">Department</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>All Departments</Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption" color="text.secondary">Referred By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Self</Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Loop through each test and render its parameters */}
            {resultTests.map((test) => {
              const params = test.parameters || [];
              return (
                <Box key={test.id} sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, px: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", borderLeft: "4px solid", pl: 1, borderColor: "primary.main" }}>
                      {test.name} ({test.code})
                    </Typography>
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
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: "grey.100" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, width: 60 }}>S/No</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Test Parameter</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Normal Value</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 250 }}>Result</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 80 }}>Order</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {params.map((param, index) => {
                            const ref = getReferenceRange(param, resultRegDetails);
                            const val = resultValues[param.id] || "";
                            const isAbnormal = isOutOfRange(val, ref.min, ref.max);

                            const normalValLower = (ref.rangeStr || "").toLowerCase();
                            const isNegativeOrPositive = normalValLower.includes("negative") || normalValLower.includes("positive");
                            const isReactiveOrNonReactive = normalValLower.includes("reactive");
                            const showDropdown = isNegativeOrPositive || isReactiveOrNonReactive;
                            let dropdownOptions = [];
                            if (isReactiveOrNonReactive) {
                              dropdownOptions = ["Non-reactive", "Reactive"];
                            } else if (isNegativeOrPositive) {
                              dropdownOptions = ["Negative", "Positive"];
                            }
                            if (val && !dropdownOptions.includes(val)) {
                              dropdownOptions.push(val);
                            }

                            return (
                              <TableRow key={param.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{param.name}</TableCell>
                                <TableCell>{ref.rangeStr}</TableCell>
                                <TableCell>{param.unit}</TableCell>
                                <TableCell>
                                  <TextField
                                    className="result-input-field"
                                    select={showDropdown}
                                    size="small"
                                    fullWidth
                                    value={val}
                                    onChange={(e) => handleResultValueChange(param.id, e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    error={isAbnormal}
                                    sx={{
                                      "& .MuiInputBase-root": {
                                        bgcolor: isAbnormal ? "rgba(239, 68, 68, 0.15)" : "inherit"
                                      },
                                      "& .MuiInputBase-input": {
                                        py: 0.5,
                                        fontSize: "0.85rem",
                                        fontWeight: isAbnormal ? 700 : 500
                                      }
                                    }}
                                    InputProps={{
                                      endAdornment: isAbnormal && (
                                        <Tooltip title="Out of normal range!">
                                          <WarningIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                                        </Tooltip>
                                      )
                                    }}
                                  >
                                    {showDropdown ? (
                                      [
                                        <MenuItem key="empty" value=""><em>Select</em></MenuItem>,
                                        ...dropdownOptions.map(opt => (
                                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                        ))
                                      ]
                                    ) : null}
                                  </TextField>
                                </TableCell>
                                <TableCell>{param.order}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              );
            })}

            {/* Note/Remark editor */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Report Remarks / Summary Note</Typography>
              <TextField
                id="remarks-field"
                fullWidth
                multiline
                rows={4}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Enter overall review comment, findings summary or notes..."
                variant="outlined"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setResultDialogOpen(false)} variant="outlined" size="small">Cancel</Button>
            <Tooltip title={!canWrite ? "You do not have permission to enter results" : ""}>
              <span>
                <Button
                  onClick={handleSaveResults}
                  variant="contained"
                  size="small"
                  startIcon={resultSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  disabled={resultSaving || !canWrite}
                >
                  Save Results & Complete
                </Button>
              </span>
            </Tooltip>
          </DialogActions>
        </Dialog>
      )}

      {/* --- PARAMETER CONFIGURATOR DIALOG --- */}
      {configTest && (
        <Dialog
          open={configDialogOpen}
          onClose={() => setConfigDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
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
                  No parameters defined. Click "Add Field" to define parameters.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2} sx={{ maxHeight: 450, overflowY: "auto", pr: 1 }}>
                {configParams.map((param, index) => (
                  <Card variant="outlined" key={index} sx={{ p: 2, overflow: "visible" }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 5.5 }}>
                        <TextField
                          label="Parameter Name"
                          size="small"
                          fullWidth
                          value={param.name}
                          onChange={(e) => handleConfigParamChange(index, "name", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 2.5 }}>
                        <TextField
                          label="Unit"
                          size="small"
                          fullWidth
                          value={param.unit}
                          onChange={(e) => handleConfigParamChange(index, "unit", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 3 }}>
                        <TextField
                          label="Default Normal Text"
                          size="small"
                          fullWidth
                          value={param.normalRangeDefault}
                          onChange={(e) => handleConfigParamChange(index, "normalRangeDefault", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 1 }} sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveConfigParam(index)}
                          title="Remove Parameter"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>

                      <Grid size={{ xs: 12 }} sx={{ my: 0.5 }}><Divider /></Grid>

                      {/* Male Ranges */}
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>Male Ranges</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <TextField label="Min" size="small" type="number" value={param.minValMale} onChange={(e) => handleConfigParamChange(index, "minValMale", e.target.value)} />
                          <TextField label="Max" size="small" type="number" value={param.maxValMale} onChange={(e) => handleConfigParamChange(index, "maxValMale", e.target.value)} />
                        </Stack>
                        <TextField label="Display Range Label" size="small" fullWidth sx={{ mt: 1 }} disabled value={param.normalRangeMale} />
                      </Grid>

                      {/* Female Ranges */}
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "secondary.main" }}>Female Ranges</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <TextField label="Min" size="small" type="number" value={param.minValFemale} onChange={(e) => handleConfigParamChange(index, "minValFemale", e.target.value)} />
                          <TextField label="Max" size="small" type="number" value={param.maxValFemale} onChange={(e) => handleConfigParamChange(index, "maxValFemale", e.target.value)} />
                        </Stack>
                        <TextField label="Display Range Label" size="small" fullWidth sx={{ mt: 1 }} disabled value={param.normalRangeFemale} />
                      </Grid>

                      {/* Baby Ranges */}
                      <Grid size={{ xs: 4 }}>
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

      {/* --- REPORT PREVIEW DIALOG --- */}
      <Dialog
        open={reportPreviewOpen}
        onClose={() => setReportPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxHeight: "90vh" } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Report Preview</Typography>
          </Box>
          <IconButton onClick={() => setReportPreviewOpen(false)} size="small">
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
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Patient Name:</strong> {previewData.title} {previewData.name}</Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Lab No / ID:</strong> {previewData.labId} ({previewData.regNo})</Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Ref. Doctor:</strong> {previewData.refBy?.name || "Self / Walk-in"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
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
                          {test.parameters?.map((param, pIdx) => {
                            const result = previewData.results?.find(r => r.testParameterId === param.id);
                            const val = result ? result.value : "";
                            const ref = getReferenceRange(param, previewData);
                            const isAbnormal = isOutOfRange(val, ref.min, ref.max);

                            const isSectionHeader = !param.unit && !ref.rangeStr && !val;

                            return (
                              <TableRow key={pIdx} hover>
                                <TableCell sx={{ fontWeight: isSectionHeader ? 700 : 500, color: isSectionHeader ? "text.secondary" : "text.primary" }}>
                                  {param.name}
                                </TableCell>
                                <TableCell sx={{
                                  fontWeight: isAbnormal ? 700 : 500,
                                  color: isAbnormal ? "error.main" : "text.primary"
                                }}>
                                  {val || (isSectionHeader ? "" : "-")}
                                </TableCell>
                                <TableCell>{param.unit || "-"}</TableCell>
                                <TableCell>{ref.rangeStr || "-"}</TableCell>
                              </TableRow>
                            );
                          })}
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
          <Button onClick={() => setReportPreviewOpen(false)} variant="text" color="inherit" size="small">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Money Receipt Drawer */}
      <Drawer
        anchor="right"
        open={receiptDrawerOpen}
        onClose={() => setReceiptDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: "800px" }, p: 0, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }
        }}
      >
        {loadingReceipt ? (
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", width: { xs: "100%", sm: "800px" }, gap: 2 }}>
            <CircularProgress size={45} />
            <Typography variant="body2" color="text.secondary">Loading receipt details...</Typography>
          </Box>
        ) : selectedRegistration ? (
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "primary.main", color: "primary.contrastText", px: 3, py: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                💳 Bill Entry / Money Receipt
              </Typography>
              <IconButton onClick={() => setReceiptDrawerOpen(false)} size="small" sx={{ color: "primary.contrastText" }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Content (Scrollable) */}
            <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
              <Grid container spacing={3}>

                {/* Left Column - Patient & Previous Payments */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ mb: 3, borderRadius: 2, bgcolor: "grey.50" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}>
                        Patient Details
                      </Typography>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Reg. No</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRegistration.regNo}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Lab ID</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRegistration.labId}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Patient Name</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRegistration.title} {selectedRegistration.name}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Age / Gender</Typography>
                          <Typography variant="body2">{selectedRegistration.age} {selectedRegistration.ageUnit} / {selectedRegistration.gender}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Date</Typography>
                          <Typography variant="body2">{new Date(selectedRegistration.date).toLocaleDateString()}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Ref By</Typography>
                          <Typography variant="body2">{selectedRegistration.refBy?.name || "Self"}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                    Other Payments
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "grey.100" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Ref / Mode</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedRegistration.payments && selectedRegistration.payments.length > 0 ? (
                          selectedRegistration.payments.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell>{new Date(p.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</TableCell>
                              <TableCell>{p.paymentMode} {p.paymentRefNo ? `(${p.paymentRefNo})` : ""}</TableCell>
                              <TableCell align="right">₹{parseFloat(p.amount).toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center" color="text.secondary" sx={{ py: 2 }}>
                              No payments recorded.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Right Column - Test Listing & Calculator */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                    Test Details
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "grey.100" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Test Name</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedRegistration.tests?.map((t) => (
                          <TableRow key={t.testId}>
                            <TableCell>{t.test?.name}</TableCell>
                            <TableCell align="right">₹{parseFloat(t.test?.price || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>Subtotal (Tests):</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{parseFloat(selectedRegistration.totalAmount).toFixed(2)}</Typography>
                      </Box>

                      {parseFloat(selectedRegistration.collectionCharge || 0) > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>Collection Charge:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{parseFloat(selectedRegistration.collectionCharge).toFixed(2)}</Typography>
                        </Box>
                      )}

                      <Box sx={{ display: "flex", gap: 2 }}>
                        <TextField
                          label="Discount %"
                          size="small"
                          type="number"
                          value={discountPercentInput}
                          onChange={(e) => handleDiscountPercentChange(e.target.value)}
                          slotProps={{ htmlInput: { min: 0, max: 100, step: 0.1 } }}
                          fullWidth
                        />
                        <TextField
                          label="Discount ₹"
                          size="small"
                          type="number"
                          value={discountInput}
                          onChange={(e) => handleDiscountAmountChange(e.target.value)}
                          fullWidth
                        />
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed", borderColor: "divider", pt: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Net Bill Amount:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                          ₹{(parseFloat(selectedRegistration.totalAmount || 0) + parseFloat(selectedRegistration.collectionCharge || 0) - (parseFloat(discountInput) || 0)).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>Already Paid:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>₹{parseFloat(selectedRegistration.receivedAmount).toFixed(2)}</Typography>
                      </Box>

                      <TextField
                        label="Received Amount"
                        size="small"
                        type="number"
                        value={receivedInput}
                        onChange={(e) => setReceivedInput(parseFloat(e.target.value) || 0)}
                        fullWidth
                      />

                      <Box sx={{ display: "flex", justifyContent: "space-between", bgcolor: "error.lighter", p: 1, borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: "error.main", fontWeight: 700 }}>Due Amount:</Typography>
                        <Typography variant="subtitle2" sx={{ color: "error.main", fontWeight: 800 }}>
                          ₹{Math.max(0, (parseFloat(selectedRegistration.totalAmount || 0) + parseFloat(selectedRegistration.collectionCharge || 0)) - (parseFloat(discountInput) || 0) - parseFloat(selectedRegistration.receivedAmount || 0) - (parseFloat(receivedInput) || 0)).toFixed(2)}
                        </Typography>
                      </Box>

                      <Divider />

                      <TextField
                        select
                        label="Payment Mode"
                        size="small"
                        value={paymentModeInput}
                        onChange={(e) => setPaymentModeInput(e.target.value)}
                        fullWidth
                      >
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="UPI">UPI</MenuItem>
                        <MenuItem value="Card">Card</MenuItem>
                        <MenuItem value="Net Banking">Net Banking</MenuItem>
                      </TextField>

                      <TextField
                        label="Payment Ref.No"
                        size="small"
                        value={paymentRefNoInput}
                        onChange={(e) => setPaymentRefNoInput(e.target.value)}
                        placeholder="Transaction ID / Check No"
                        fullWidth
                      />

                      <TextField
                        label="Remark"
                        size="small"
                        value={remarkInput}
                        onChange={(e) => setRemarkInput(e.target.value)}
                        placeholder="Add payment remark"
                        fullWidth
                      />

                      <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                        <FormControlLabel
                          control={<Checkbox checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} size="small" />}
                          label={<Typography variant="body2">Send SMS</Typography>}
                        />
                        <FormControlLabel
                          control={<Checkbox checked={sendMail} onChange={(e) => setSendMail(e.target.checked)} size="small" />}
                          label={<Typography variant="body2">Send Mail</Typography>}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

              </Grid>
            </Box>

            {/* Footer Actions */}
            <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid", borderColor: "divider" }}>
              <Button onClick={() => setReceiptDrawerOpen(false)} variant="outlined">
                Cancel
              </Button>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Tooltip title={!canWrite ? "You do not have permission to process payments" : ""}>
                  <span>
                    <Button
                      variant="contained"
                      onClick={handleSavePayment}
                      startIcon={savingPayment ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                      disabled={savingPayment || !canWrite}
                      sx={{ px: 4 }}
                    >
                      {savingPayment ? "Saving..." : "Save"}
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title="Print Receipt">
                  <IconButton onClick={() => handlePrintReceipt(selectedRegistration)} color="primary">
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
                {/*
                <Tooltip title="Email Receipt">
                  <IconButton color="primary">
                    <EmailIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Worksheet">
                  <IconButton color="primary">
                    <WorksheetIcon />
                  </IconButton>
                </Tooltip>
                */}
              </Box>
            </Box>
          </Box>
        ) : null}
      </Drawer>

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
