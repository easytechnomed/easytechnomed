"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  ButtonGroup,
  Paper,
  Tabs,
  Tab,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  InputAdornment
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  OpenInNew as PreviewIcon,
  Info as HelpIcon,
  Refresh as RefreshIcon,
  Article as ReportIcon,
  PictureAsPdf as PdfIcon,
  DragIndicator as DragIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon,
  FormatColorFill as ColorIcon,
  TextFields as TypographyIcon,
  ViewColumn as ColumnIcon,
  Margin as MarginIcon,
  AssignmentInd as SignatoryIcon,
  RestartAlt as ResetIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  Visibility as ShowIcon,
  VisibilityOff as HideIcon,
  CheckCircle as CheckIcon,
  Palette as PaletteIcon
} from "@mui/icons-material";
import { useAdminPermissions } from "@/lib/clientAuth";
import { DEFAULT_COLUMNS, PDF_THEME_PRESETS } from "@/lib/pdfTheme";

export default function PdfSettingsClient() {
  const { hasPermission } = useAdminPermissions();
  const canWriteSettings = hasPermission("SETTINGS_WRITE");

  const [settings, setSettings] = useState({
    framePdfUrl: "",
    headerMargin: 140,
    footerMargin: 100,
    leftMargin: 45,
    rightMargin: 45,
    useFrameDefault: true,
    primaryColor: "#0f766e",
    headerBgColor: "#e2e8f0",
    headerTextColor: "#1e293b",
    textColor: "#0f172a",
    patientCardBgColor: "#f8fafc",
    patientCardBorderColor: "#e2e8f0",
    tableRowBorderColor: "#e2e8f0",
    departmentTextColor: "#ffffff",
    fontFamily: "Helvetica",
    headerFontSize: 9.0,
    parameterFontSize: 8.5,
    patientInfoFontSize: 9.0,
    departmentFontSize: 9.5,
    remarkFontSize: 8.5,
    columnOrder: DEFAULT_COLUMNS,
    authorizedSignatoryName1: "",
    authorizedSignatoryDegree1: "",
    authorizedSignatoryName2: "",
    authorizedSignatoryDegree2: "",
    showSignatures: true,
    showQrCode: true,
    showDepartmentBanner: true,
    showPatientBox: true,
  });

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Preview State
  const [previewMode, setPreviewMode] = useState("demo");
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceTimerRef = useRef(null);

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Load configuration from API
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings/pdf").then((r) => r.json());
        if (res.success && res.settings) {
          const s = res.settings;
          let parsedCols = DEFAULT_COLUMNS;
          if (s.columnOrder) {
            try {
              parsedCols = typeof s.columnOrder === "string" ? JSON.parse(s.columnOrder) : s.columnOrder;
            } catch {
              parsedCols = DEFAULT_COLUMNS;
            }
          }

          setSettings({
            framePdfUrl: s.framePdfUrl || "",
            headerMargin: s.headerMargin ?? 140,
            footerMargin: s.footerMargin ?? 100,
            leftMargin: s.leftMargin ?? 45,
            rightMargin: s.rightMargin ?? 45,
            useFrameDefault: s.useFrameDefault ?? true,
            primaryColor: s.primaryColor || "#0f766e",
            headerBgColor: s.headerBgColor || "#e2e8f0",
            headerTextColor: s.headerTextColor || "#1e293b",
            textColor: s.textColor || "#0f172a",
            patientCardBgColor: s.patientCardBgColor || "#f8fafc",
            patientCardBorderColor: s.patientCardBorderColor || "#e2e8f0",
            tableRowBorderColor: s.tableRowBorderColor || "#e2e8f0",
            departmentTextColor: s.departmentTextColor || "#ffffff",
            fontFamily: s.fontFamily || "Helvetica",
            headerFontSize: s.headerFontSize ?? 9.0,
            parameterFontSize: s.parameterFontSize ?? 8.5,
            patientInfoFontSize: s.patientInfoFontSize ?? 9.0,
            departmentFontSize: s.departmentFontSize ?? 9.5,
            remarkFontSize: s.remarkFontSize ?? 8.5,
            columnOrder: Array.isArray(parsedCols) && parsedCols.length > 0 ? parsedCols : DEFAULT_COLUMNS,
            authorizedSignatoryName1: s.authorizedSignatoryName1 || "",
            authorizedSignatoryDegree1: s.authorizedSignatoryDegree1 || "",
            authorizedSignatoryName2: s.authorizedSignatoryName2 || "",
            authorizedSignatoryDegree2: s.authorizedSignatoryDegree2 || "",
            showSignatures: s.showSignatures ?? true,
            showQrCode: s.showQrCode ?? true,
            showDepartmentBanner: s.showDepartmentBanner ?? true,
            showPatientBox: s.showPatientBox ?? true,
          });
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to load PDF studio settings.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Debounced Live Preview Refresh whenever ANY setting changes
  useEffect(() => {
    if (loading) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setPreviewLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      setPreviewKey(Date.now());
      setPreviewLoading(false);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    settings,
    previewMode
  ]);

  // Column Reordering Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updatedCols = [...settings.columnOrder];
    const [movedItem] = updatedCols.splice(draggedIndex, 1);
    updatedCols.splice(index, 0, movedItem);

    setSettings((prev) => ({
      ...prev,
      columnOrder: updatedCols
    }));

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveColumn = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= settings.columnOrder.length) return;

    const updatedCols = [...settings.columnOrder];
    const [movedItem] = updatedCols.splice(index, 1);
    updatedCols.splice(targetIndex, 0, movedItem);

    setSettings((prev) => ({
      ...prev,
      columnOrder: updatedCols
    }));
  };

  const updateColumnField = (index, field, value) => {
    const updatedCols = [...settings.columnOrder];
    updatedCols[index] = {
      ...updatedCols[index],
      [field]: value
    };
    setSettings((prev) => ({
      ...prev,
      columnOrder: updatedCols
    }));
  };

  // Apply 1-Click Color Preset
  const handleApplyPreset = (preset) => {
    setSettings((prev) => ({
      ...prev,
      primaryColor: preset.primaryColor,
      headerBgColor: preset.headerBgColor,
      headerTextColor: preset.headerTextColor,
      textColor: preset.textColor,
      patientCardBgColor: preset.patientCardBgColor,
      patientCardBorderColor: preset.patientCardBorderColor,
      tableRowBorderColor: preset.tableRowBorderColor,
      departmentTextColor: preset.departmentTextColor,
    }));
    showToast(`Applied theme preset: ${preset.name}`, "info");
  };

  // Reset All to Standard Defaults
  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset all colors, column positions, and font sizes to defaults?")) {
      setSettings((prev) => ({
        ...prev,
        headerMargin: 140,
        footerMargin: 100,
        leftMargin: 45,
        rightMargin: 45,
        primaryColor: "#0f766e",
        headerBgColor: "#e2e8f0",
        headerTextColor: "#1e293b",
        textColor: "#0f172a",
        patientCardBgColor: "#f8fafc",
        patientCardBorderColor: "#e2e8f0",
        tableRowBorderColor: "#e2e8f0",
        departmentTextColor: "#ffffff",
        fontFamily: "Helvetica",
        headerFontSize: 9.0,
        parameterFontSize: 8.5,
        patientInfoFontSize: 9.0,
        departmentFontSize: 9.5,
        remarkFontSize: 8.5,
        columnOrder: DEFAULT_COLUMNS,
        showSignatures: true,
        showQrCode: true,
        showDepartmentBanner: true,
        showPatientBox: true,
      }));
      showToast("Reset all settings to defaults!", "info");
    }
  };

  // File Upload Handlers
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast("Please upload a valid PDF file.", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/settings/upload-frame", {
        method: "POST",
        body: formData,
      }).then((r) => r.json());
      if (res.success && res.url) {
        handleInputChange("framePdfUrl", res.url);
        showToast("Letterhead frame PDF uploaded successfully!", "success");
      } else {
        showToast(res.error || "Failed to upload file.", "error");
      }
    } catch (err) {
      showToast("An error occurred during file upload.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleClearFrame = () => {
    handleInputChange("framePdfUrl", "");
    showToast("Template frame URL cleared. Click Save to apply changes.", "info");
  };

  // Save Settings to Backend
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...settings,
        columnOrder: JSON.stringify(settings.columnOrder),
      };

      const res = await fetch("/api/settings/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      if (res.success) {
        showToast(res.message || "All PDF settings saved successfully!", "success");
      } else {
        showToast(res.error || "Failed to save settings.", "error");
      }
    } catch (err) {
      showToast("An error occurred while saving settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Construct Live Preview Query URL
  const queryParams = new URLSearchParams({
    framePdfUrl: settings.framePdfUrl || "",
    headerMargin: String(settings.headerMargin),
    footerMargin: String(settings.footerMargin),
    leftMargin: String(settings.leftMargin),
    rightMargin: String(settings.rightMargin),
    useFrame: String(settings.useFrameDefault),
    primaryColor: settings.primaryColor,
    headerBgColor: settings.headerBgColor,
    headerTextColor: settings.headerTextColor,
    textColor: settings.textColor,
    patientCardBgColor: settings.patientCardBgColor,
    patientCardBorderColor: settings.patientCardBorderColor,
    tableRowBorderColor: settings.tableRowBorderColor,
    departmentTextColor: settings.departmentTextColor,
    fontFamily: settings.fontFamily,
    headerFontSize: String(settings.headerFontSize),
    parameterFontSize: String(settings.parameterFontSize),
    patientInfoFontSize: String(settings.patientInfoFontSize),
    departmentFontSize: String(settings.departmentFontSize),
    remarkFontSize: String(settings.remarkFontSize),
    columnOrder: JSON.stringify(settings.columnOrder),
    authorizedSignatoryName1: settings.authorizedSignatoryName1 || "",
    authorizedSignatoryDegree1: settings.authorizedSignatoryDegree1 || "",
    authorizedSignatoryName2: settings.authorizedSignatoryName2 || "",
    authorizedSignatoryDegree2: settings.authorizedSignatoryDegree2 || "",
    showSignatures: String(settings.showSignatures),
    showQrCode: String(settings.showQrCode),
    showDepartmentBanner: String(settings.showDepartmentBanner),
    showPatientBox: String(settings.showPatientBox),
    _t: String(previewKey),
  });

  const demoPreviewUrl = `/api/settings/preview-pdf?${queryParams.toString()}#toolbar=0&navpanes=0`;
  const rawPreviewUrl = settings.framePdfUrl ? `${settings.framePdfUrl}#toolbar=0&navpanes=0` : "";
  const activeIframeSrc = previewMode === "demo" ? demoPreviewUrl : rawPreviewUrl;

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "50vh", gap: 2 }}>
        <CircularProgress size={45} />
        <Typography variant="body2" color="text.secondary">
          Loading PDF Studio configuration...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Card variant="outlined" sx={{ borderRadius: 3, mb: 2, overflow: "hidden" }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Grid container spacing={3}>
            
            {/* ── LEFT COLUMN: STICKY LIVE PDF PREVIEW ────────────────────────── */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "#ffffff",
                  height: { xs: "550px", lg: "calc(100vh - 170px)" },
                  minHeight: "550px",
                  display: "flex",
                  flexDirection: "column",
                  position: { lg: "sticky" },
                  top: { lg: 80 }
                }}
              >
                {/* Preview Header / Controls */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", display: "flex", alignItems: "center", gap: 0.8 }}>
                      <ReportIcon fontSize="small" color="primary" /> Live Report Preview
                    </Typography>
                    {previewLoading && <CircularProgress size={16} color="primary" />}
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ButtonGroup size="small" variant="outlined">
                      <Button
                        variant={previewMode === "demo" ? "contained" : "outlined"}
                        onClick={() => setPreviewMode("demo")}
                        startIcon={<ReportIcon fontSize="small" />}
                        sx={{ textTransform: "none", fontSize: "0.75rem", px: 1.2 }}
                      >
                        Live CBC Report
                      </Button>
                      <Button
                        variant={previewMode === "raw" ? "contained" : "outlined"}
                        onClick={() => setPreviewMode("raw")}
                        startIcon={<PdfIcon fontSize="small" />}
                        disabled={!settings.framePdfUrl}
                        sx={{ textTransform: "none", fontSize: "0.75rem", px: 1.2 }}
                      >
                        Template Only
                      </Button>
                    </ButtonGroup>

                    <Tooltip title="Refresh Live Preview">
                      <IconButton size="small" onClick={() => setPreviewKey(Date.now())} color="primary">
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Open Full PDF in New Tab">
                      <IconButton
                        component="a"
                        href={previewMode === "demo" ? demoPreviewUrl.split("#")[0] : (settings.framePdfUrl || "#")}
                        target="_blank"
                        size="small"
                        color="primary"
                      >
                        <PreviewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* PDF Live Frame Iframe Container */}
                <Box
                  sx={{
                    flexGrow: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2.5,
                    overflow: "hidden",
                    bgcolor: "#f1f5f9",
                    position: "relative",
                    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.06)"
                  }}
                >
                  {previewMode === "raw" && !settings.framePdfUrl ? (
                    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 3, textAlign: "center" }}>
                      <Typography sx={{ fontSize: "3.5rem", mb: 1, filter: "grayscale(1)" }}>📄</Typography>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                        No Letterhead Frame Uploaded
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 260, mt: 0.5 }}>
                        Upload your background A4 PDF in Tab 4 to preview how report text aligns with your letterhead.
                      </Typography>
                    </Box>
                  ) : (
                    <iframe
                      key={previewKey}
                      src={activeIframeSrc}
                      width="100%"
                      height="100%"
                      style={{
                        border: "none",
                        display: "block",
                        width: "100%",
                        height: "100%"
                      }}
                      title="Live PDF Report Preview"
                    />
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: "center", display: "block" }}>
                  💡 Live Preview adjusts in real time as you reorder columns, change colors, fonts, or margins.
                </Typography>
              </Paper>
            </Grid>

            {/* ── RIGHT COLUMN: CUSTOMIZATION CONTROLS ───────────────────────── */}
            <Grid size={{ xs: 12, lg: 6 }}>
              {/* Studio Tabs */}
              <Paper variant="outlined" sx={{ borderRadius: 2.5, mb: 2.5, bgcolor: "background.paper" }}>
                <Tabs
                  value={activeTab}
                  onChange={(e, val) => setActiveTab(val)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    "& .MuiTab-root": {
                      textTransform: "none",
                      fontWeight: 700,
                      minHeight: 48,
                      fontSize: "0.85rem"
                    }
                  }}
                >
                  <Tab icon={<ColumnIcon fontSize="small" />} iconPosition="start" label="Columns Order" />
                  <Tab icon={<PaletteIcon fontSize="small" />} iconPosition="start" label="Colors & Themes" />
                  <Tab icon={<TypographyIcon fontSize="small" />} iconPosition="start" label="Typography" />
                  <Tab icon={<MarginIcon fontSize="small" />} iconPosition="start" label="Letterhead & Margins" />
                  <Tab icon={<SignatoryIcon fontSize="small" />} iconPosition="start" label="Signatories & Toggles" />
                </Tabs>
              </Paper>

              {/* ── TAB 0: COLUMNS ARRANGEMENT & DRAG-AND-DROP ────────────────── */}
              {activeTab === 0 && (
                <Box>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          1. Table Columns Position & Customization
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Drag and drop column cards to change their order (col1, col2, col3). Edit titles and toggle visibility.
                        </Typography>
                      </Box>
                      <Tooltip title="Reset column positions to standard default order">
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<ResetIcon fontSize="small" />}
                          onClick={() => setSettings((p) => ({ ...p, columnOrder: DEFAULT_COLUMNS }))}
                          sx={{ textTransform: "none", fontSize: "0.75rem" }}
                        >
                          Reset Order
                        </Button>
                      </Tooltip>
                    </Box>

                    {/* Column Reorder List */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      {settings.columnOrder.map((col, index) => {
                        const isDragging = draggedIndex === index;
                        const isOver = dragOverIndex === index;

                        return (
                          <Paper
                            key={col.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              borderRadius: 2.5,
                              cursor: "grab",
                              bgcolor: isDragging ? "action.hover" : isOver ? "primary.50" : col.visible !== false ? "#ffffff" : "grey.100",
                              border: isOver ? "2px dashed" : "1px solid",
                              borderColor: isOver ? "primary.main" : isDragging ? "primary.light" : "divider",
                              opacity: isDragging ? 0.4 : col.visible !== false ? 1 : 0.65,
                              transition: "all 0.15s ease",
                              boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                              "&:hover": {
                                borderColor: "primary.main",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                              }
                            }}
                          >
                            <Grid container spacing={1.5} alignItems="center">
                              {/* Drag Handle & Col Badge */}
                              <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Tooltip title="Click & Drag to reposition">
                                  <Box sx={{ cursor: "grab", display: "flex", color: "text.secondary", "&:hover": { color: "primary.main" } }}>
                                    <DragIcon />
                                  </Box>
                                </Tooltip>
                                <Chip
                                  label={`Col ${index + 1}`}
                                  size="small"
                                  color="primary"
                                  variant="filled"
                                  sx={{ fontWeight: 800, fontSize: "0.72rem", height: 22 }}
                                />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                                  ({col.id})
                                </Typography>
                              </Grid>

                              {/* Column Label Input */}
                              <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  label="Column Title"
                                  value={col.label || ""}
                                  onChange={(e) => updateColumnField(index, "label", e.target.value)}
                                  placeholder="e.g. Test Parameter"
                                  InputProps={{ sx: { fontSize: "0.85rem", height: 36 } }}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>

                              {/* Alignment & Actions */}
                              <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                                {/* Alignment Selector */}
                                <ButtonGroup size="small" variant="outlined">
                                  <Tooltip title="Align Left">
                                    <IconButton
                                      size="small"
                                      color={(col.align || "left") === "left" ? "primary" : "default"}
                                      onClick={() => updateColumnField(index, "align", "left")}
                                      sx={{ p: 0.6 }}
                                    >
                                      <AlignLeftIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Align Center">
                                    <IconButton
                                      size="small"
                                      color={col.align === "center" ? "primary" : "default"}
                                      onClick={() => updateColumnField(index, "align", "center")}
                                      sx={{ p: 0.6 }}
                                    >
                                      <AlignCenterIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Align Right">
                                    <IconButton
                                      size="small"
                                      color={col.align === "right" ? "primary" : "default"}
                                      onClick={() => updateColumnField(index, "align", "right")}
                                      sx={{ p: 0.6 }}
                                    >
                                      <AlignRightIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </ButtonGroup>

                                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                                {/* Move Up / Down Buttons */}
                                <Tooltip title="Move Up">
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={index === 0}
                                      onClick={() => moveColumn(index, -1)}
                                      color="primary"
                                    >
                                      <MoveUpIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Move Down">
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={index === settings.columnOrder.length - 1}
                                      onClick={() => moveColumn(index, 1)}
                                      color="primary"
                                    >
                                      <MoveDownIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>

                                {/* Visibility Toggle */}
                                <Tooltip title={col.visible !== false ? "Hide Column" : "Show Column"}>
                                  <IconButton
                                    size="small"
                                    color={col.visible !== false ? "primary" : "default"}
                                    onClick={() => updateColumnField(index, "visible", col.visible === false)}
                                  >
                                    {col.visible !== false ? <ShowIcon fontSize="small" /> : <HideIcon fontSize="small" />}
                                  </IconButton>
                                </Tooltip>
                              </Grid>
                            </Grid>
                          </Paper>
                        );
                      })}
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* ── TAB 1: COLORS & THEMES ────────────────────────────────────── */}
              {activeTab === 1 && (
                <Box>
                  {/* Theme Presets */}
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                      1-Click Theme Presets
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                      Select a curated pathology lab color scheme to instantly apply harmonious colors.
                    </Typography>

                    <Grid container spacing={1.5}>
                      {PDF_THEME_PRESETS.map((preset) => {
                        const isCurrent = settings.primaryColor === preset.primaryColor && settings.headerBgColor === preset.headerBgColor;
                        return (
                          <Grid size={{ xs: 6, sm: 4 }} key={preset.id}>
                            <Paper
                              variant="outlined"
                              onClick={() => handleApplyPreset(preset)}
                              sx={{
                                p: 1.5,
                                borderRadius: 2.5,
                                cursor: "pointer",
                                border: isCurrent ? "2px solid" : "1px solid",
                                borderColor: isCurrent ? "primary.main" : "divider",
                                bgcolor: isCurrent ? "primary.50" : "background.paper",
                                transition: "all 0.2s",
                                "&:hover": {
                                  borderColor: "primary.main",
                                  transform: "translateY(-2px)",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
                                }
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary" }}>
                                  {preset.name}
                                </Typography>
                                {isCurrent && <CheckIcon color="primary" sx={{ fontSize: 16 }} />}
                              </Box>
                              <Box sx={{ display: "flex", gap: 0.6 }}>
                                <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: preset.primaryColor, border: "1px solid rgba(0,0,0,0.1)" }} />
                                <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: preset.headerBgColor, border: "1px solid rgba(0,0,0,0.1)" }} />
                                <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: preset.patientCardBgColor, border: "1px solid rgba(0,0,0,0.1)" }} />
                              </Box>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Paper>

                  {/* Custom Color Pickers */}
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                      Custom Color Palette
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                      Customize each element's exact hex color code.
                    </Typography>

                    <Grid container spacing={2}>
                      {/* Department Banner Color */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                          Department Header Background
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <input
                            type="color"
                            value={settings.primaryColor}
                            onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                            style={{ width: 38, height: 38, border: "none", borderRadius: 8, cursor: "pointer", background: "none" }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            value={settings.primaryColor}
                            onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                            placeholder="#0f766e"
                          />
                        </Box>
                      </Grid>

                      {/* Department Banner Text Color */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                          Department Header Text Color
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <input
                            type="color"
                            value={settings.departmentTextColor}
                            onChange={(e) => handleInputChange("departmentTextColor", e.target.value)}
                            style={{ width: 38, height: 38, border: "none", borderRadius: 8, cursor: "pointer", background: "none" }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            value={settings.departmentTextColor}
                            onChange={(e) => handleInputChange("departmentTextColor", e.target.value)}
                            placeholder="#ffffff"
                          />
                        </Box>
                      </Grid>

                      {/* Table Header Background */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                          Table Header Row Background
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <input
                            type="color"
                            value={settings.headerBgColor}
                            onChange={(e) => handleInputChange("headerBgColor", e.target.value)}
                            style={{ width: 38, height: 38, border: "none", borderRadius: 8, cursor: "pointer", background: "none" }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            value={settings.headerBgColor}
                            onChange={(e) => handleInputChange("headerBgColor", e.target.value)}
                            placeholder="#e2e8f0"
                          />
                        </Box>
                      </Grid>

                      {/* Table Header Text Color */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                          Table Header Text Color
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <input
                            type="color"
                            value={settings.headerTextColor}
                            onChange={(e) => handleInputChange("headerTextColor", e.target.value)}
                            style={{ width: 38, height: 38, border: "none", borderRadius: 8, cursor: "pointer", background: "none" }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            value={settings.headerTextColor}
                            onChange={(e) => handleInputChange("headerTextColor", e.target.value)}
                            placeholder="#1e293b"
                          />
                        </Box>
                      </Grid>

                      {/* Parameter & Body Text Color */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                          Parameter & Values Text Color
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <input
                            type="color"
                            value={settings.textColor}
                            onChange={(e) => handleInputChange("textColor", e.target.value)}
                            style={{ width: 38, height: 38, border: "none", borderRadius: 8, cursor: "pointer", background: "none" }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            value={settings.textColor}
                            onChange={(e) => handleInputChange("textColor", e.target.value)}
                            placeholder="#0f172a"
                          />
                        </Box>
                      </Grid>

                      {/* Table Row Border / Divider Color */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                          Table Row Line / Divider Color
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <input
                            type="color"
                            value={settings.tableRowBorderColor}
                            onChange={(e) => handleInputChange("tableRowBorderColor", e.target.value)}
                            style={{ width: 38, height: 38, border: "none", borderRadius: 8, cursor: "pointer", background: "none" }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            value={settings.tableRowBorderColor}
                            onChange={(e) => handleInputChange("tableRowBorderColor", e.target.value)}
                            placeholder="#e2e8f0"
                          />
                        </Box>
                      </Grid>

                      {/* Patient Box Background */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                          Patient Card Background
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <input
                            type="color"
                            value={settings.patientCardBgColor}
                            onChange={(e) => handleInputChange("patientCardBgColor", e.target.value)}
                            style={{ width: 38, height: 38, border: "none", borderRadius: 8, cursor: "pointer", background: "none" }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            value={settings.patientCardBgColor}
                            onChange={(e) => handleInputChange("patientCardBgColor", e.target.value)}
                            placeholder="#f8fafc"
                          />
                        </Box>
                      </Grid>

                      {/* Patient Box Border */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                          Patient Card Border Color
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <input
                            type="color"
                            value={settings.patientCardBorderColor}
                            onChange={(e) => handleInputChange("patientCardBorderColor", e.target.value)}
                            style={{ width: 38, height: 38, border: "none", borderRadius: 8, cursor: "pointer", background: "none" }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            value={settings.patientCardBorderColor}
                            onChange={(e) => handleInputChange("patientCardBorderColor", e.target.value)}
                            placeholder="#e2e8f0"
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              )}

              {/* ── TAB 2: TYPOGRAPHY & FONT SIZES ───────────────────────────── */}
              {activeTab === 2 && (
                <Box>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                      Font Family & Typography
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                      Select the primary typeface and adjust font sizes for each section in points (pt).
                    </Typography>

                    {/* Font Family Selector */}
                    <FormControl size="small" fullWidth sx={{ mb: 3 }}>
                      <InputLabel>Font Family</InputLabel>
                      <Select
                        value={settings.fontFamily}
                        label="Font Family"
                        onChange={(e) => handleInputChange("fontFamily", e.target.value)}
                      >
                        <MenuItem value="Helvetica">Helvetica (Clean Sans-Serif - Recommended)</MenuItem>
                        <MenuItem value="TimesRoman">Times-Roman (Classic Medical Serif)</MenuItem>
                        <MenuItem value="Courier">Courier (Monospace / Lab Print)</MenuItem>
                      </Select>
                    </FormControl>

                    <Divider sx={{ mb: 2.5 }} />

                    {/* Font Size Sliders */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                      {/* Table Header Font Size */}
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Table Headers Font Size
                          </Typography>
                          <Chip label={`${settings.headerFontSize} pt`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        </Box>
                        <Slider
                          value={settings.headerFontSize}
                          min={7}
                          max={13}
                          step={0.5}
                          onChange={(e, val) => handleInputChange("headerFontSize", val)}
                          valueLabelDisplay="auto"
                        />
                      </Box>

                      {/* Parameter / Row Font Size */}
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Parameter Names & Observed Values Font Size
                          </Typography>
                          <Chip label={`${settings.parameterFontSize} pt`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        </Box>
                        <Slider
                          value={settings.parameterFontSize}
                          min={7}
                          max={12}
                          step={0.5}
                          onChange={(e, val) => handleInputChange("parameterFontSize", val)}
                          valueLabelDisplay="auto"
                        />
                      </Box>

                      {/* Patient Info Font Size */}
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Patient Demographics Font Size
                          </Typography>
                          <Chip label={`${settings.patientInfoFontSize} pt`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        </Box>
                        <Slider
                          value={settings.patientInfoFontSize}
                          min={7}
                          max={13}
                          step={0.5}
                          onChange={(e, val) => handleInputChange("patientInfoFontSize", val)}
                          valueLabelDisplay="auto"
                        />
                      </Box>

                      {/* Department Banner Font Size */}
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Department Header Banner Font Size
                          </Typography>
                          <Chip label={`${settings.departmentFontSize} pt`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        </Box>
                        <Slider
                          value={settings.departmentFontSize}
                          min={7.5}
                          max={14}
                          step={0.5}
                          onChange={(e, val) => handleInputChange("departmentFontSize", val)}
                          valueLabelDisplay="auto"
                        />
                      </Box>

                      {/* Remarks Font Size */}
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Remarks & Interpretation Note Font Size
                          </Typography>
                          <Chip label={`${settings.remarkFontSize} pt`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        </Box>
                        <Slider
                          value={settings.remarkFontSize}
                          min={7}
                          max={12}
                          step={0.5}
                          onChange={(e, val) => handleInputChange("remarkFontSize", val)}
                          valueLabelDisplay="auto"
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* ── TAB 3: LETTERHEAD & MARGINS ──────────────────────────────── */}
              {activeTab === 3 && (
                <Box>
                  {/* File Upload Box */}
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                      Letterhead Template PDF
                    </Typography>

                    {settings.framePdfUrl ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2, bgcolor: "rgba(15, 118, 110, 0.05)", border: "1px solid", borderColor: "primary.light", borderRadius: 2.5, mb: 2 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                            Active Letterhead File
                          </Typography>
                          <Typography variant="body2" sx={{ fontStyle: "italic", wordBreak: "break-all", fontWeight: 600, color: "primary.dark", mt: 0.5 }}>
                            {settings.framePdfUrl.split("/").pop()}
                          </Typography>
                        </Box>
                        <Tooltip title="Preview original template file">
                          <IconButton component="a" href={settings.framePdfUrl} target="_blank" color="primary" size="small" sx={{ bgcolor: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                            <PreviewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={!canWriteSettings ? "You do not have permission to clear templates" : "Remove Template"}>
                          <span>
                            <IconButton onClick={handleClearFrame} color="error" size="small" sx={{ bgcolor: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }} disabled={!canWriteSettings}>
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Box sx={{ p: 3, border: "2px dashed", borderColor: "grey.300", borderRadius: 2.5, textAlign: "center", bgcolor: "grey.50", mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
                          No background letterhead uploaded. Reports will print on blank clean A4 pages.
                        </Typography>
                        <Tooltip title={!canWriteSettings ? "You do not have permission to upload PDF templates" : ""}>
                          <span>
                            <Button
                              variant="contained"
                              component="label"
                              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
                              disabled={uploading || !canWriteSettings}
                              sx={{ textTransform: "none", borderRadius: 2 }}
                            >
                              {uploading ? "Uploading..." : "Upload Letterhead PDF"}
                              <input
                                type="file"
                                hidden
                                accept="application/pdf"
                                onChange={handleFileUpload}
                              />
                            </Button>
                          </span>
                        </Tooltip>
                      </Box>
                    )}

                    {settings.framePdfUrl && (
                      <Tooltip title={!canWriteSettings ? "You do not have permission to upload PDF templates" : ""}>
                        <span>
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
                            disabled={uploading || !canWriteSettings}
                            sx={{ textTransform: "none", borderRadius: 2 }}
                          >
                            {uploading ? "Uploading..." : "Upload Different PDF"}
                            <input
                              type="file"
                              hidden
                              accept="application/pdf"
                              onChange={handleFileUpload}
                            />
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </Paper>

                  {/* Margins Controls */}
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                      Page Margins (Spacing in pt)
                    </Typography>

                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                          Header Margin (Top Space)
                        </Typography>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={settings.headerMargin}
                          onChange={(e) => handleInputChange("headerMargin", parseInt(e.target.value) || 0)}
                          InputProps={{
                            inputProps: { min: 0 },
                            endAdornment: <InputAdornment position="end">pt</InputAdornment>
                          }}
                          helperText="Default: 140 pt (~1.94 in)"
                          sx={{ mt: 0.5 }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                          Footer Margin (Bottom Space)
                        </Typography>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={settings.footerMargin}
                          onChange={(e) => handleInputChange("footerMargin", parseInt(e.target.value) || 0)}
                          InputProps={{
                            inputProps: { min: 0 },
                            endAdornment: <InputAdornment position="end">pt</InputAdornment>
                          }}
                          helperText="Default: 100 pt (~1.38 in)"
                          sx={{ mt: 0.5 }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                          Left Margin
                        </Typography>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={settings.leftMargin}
                          onChange={(e) => handleInputChange("leftMargin", parseInt(e.target.value) || 0)}
                          InputProps={{
                            inputProps: { min: 0 },
                            endAdornment: <InputAdornment position="end">pt</InputAdornment>
                          }}
                          helperText="Default: 45 pt"
                          sx={{ mt: 0.5 }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                          Right Margin
                        </Typography>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={settings.rightMargin}
                          onChange={(e) => handleInputChange("rightMargin", parseInt(e.target.value) || 0)}
                          InputProps={{
                            inputProps: { min: 0 },
                            endAdornment: <InputAdornment position="end">pt</InputAdornment>
                          }}
                          helperText="Default: 45 pt"
                          sx={{ mt: 0.5 }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.useFrameDefault}
                              onChange={(e) => handleInputChange("useFrameDefault", e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Use Letterhead Frame by Default
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Automatically overlay patient reports on background letterhead during printing.
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              )}

              {/* ── TAB 4: SIGNATORIES & SECTION TOGGLES ──────────────────────── */}
              {activeTab === 4 && (
                <Box>
                  {/* Signatories */}
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                      Authorized Signatories
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                      Doctor names and qualifications that appear at the bottom signature area.
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Signatory 1 - Full Name"
                          size="small"
                          fullWidth
                          value={settings.authorizedSignatoryName1 || ""}
                          onChange={(e) => handleInputChange("authorizedSignatoryName1", e.target.value)}
                          placeholder="e.g. Dr. Ramesh Kumar"
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Signatory 1 - Degree / Qualifications"
                          size="small"
                          fullWidth
                          value={settings.authorizedSignatoryDegree1 || ""}
                          onChange={(e) => handleInputChange("authorizedSignatoryDegree1", e.target.value)}
                          placeholder="e.g. MBBS, MD (Pathology)"
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Signatory 2 - Full Name"
                          size="small"
                          fullWidth
                          value={settings.authorizedSignatoryName2 || ""}
                          onChange={(e) => handleInputChange("authorizedSignatoryName2", e.target.value)}
                          placeholder="e.g. Dr. Anita Sharma"
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Signatory 2 - Degree / Qualifications"
                          size="small"
                          fullWidth
                          value={settings.authorizedSignatoryDegree2 || ""}
                          onChange={(e) => handleInputChange("authorizedSignatoryDegree2", e.target.value)}
                          placeholder="e.g. DCP, Consulting Pathologist"
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Section Visibility Toggles */}
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                      Section Visibility Controls
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                      Enable or disable major report sections as needed.
                    </Typography>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.showPatientBox}
                              onChange={(e) => handleInputChange("showPatientBox", e.target.checked)}
                              color="primary"
                            />
                          }
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Show Patient Info Box</Typography>}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.showDepartmentBanner}
                              onChange={(e) => handleInputChange("showDepartmentBanner", e.target.checked)}
                              color="primary"
                            />
                          }
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Show Department Banner</Typography>}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.showSignatures}
                              onChange={(e) => handleInputChange("showSignatures", e.target.checked)}
                              color="primary"
                            />
                          }
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Show Signatures Block</Typography>}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.showQrCode}
                              onChange={(e) => handleInputChange("showQrCode", e.target.checked)}
                              color="primary"
                            />
                          }
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Show Verification QR Code</Typography>}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              )}

              {/* ── BOTTOM ACTION BAR ────────────────────────────────────────── */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<ResetIcon />}
                  onClick={handleResetDefaults}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Reset Defaults
                </Button>

                <Tooltip title={!canWriteSettings ? "You do not have permission to modify settings" : ""}>
                  <span>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                      disabled={saving || uploading || !canWriteSettings}
                      sx={{ px: 4, py: 1.2, borderRadius: 2, fontWeight: 800, textTransform: "none" }}
                    >
                      {saving ? "Saving Changes..." : "Save All Settings"}
                    </Button>
                  </span>
                </Tooltip>
              </Box>

            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))} sx={{ width: "100%", boxShadow: 3 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}
