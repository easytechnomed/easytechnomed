"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  InputAdornment,
  Switch,
  FormControlLabel,
  Pagination,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  Alert,
  Fade,
} from "@mui/material";
import {
  SystemUpdateAlt as VersionIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  AutoAwesome as AutoAwesomeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Spellcheck as GrammarIcon,
  Transform as RephraseIcon,
  Bolt as OptimizeIcon,
  CorporateFare as StandardIcon,
  Close as CloseIcon,
  Restore as UndoIcon,
  Check as AcceptIcon,
  NewReleases as NewReleasesIcon,
  Event as EventIcon,
  Lock as LockIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { toast } from "sonner";

export default function SuperAdminAppVersionPage() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, mandatory: 0, latestVersion: null, latestReleaseDate: null });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mandatoryFilter, setMandatoryFilter] = useState("all");

  // Create / Edit Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null); // null = create mode
  const [formData, setFormData] = useState({
    version: "",
    title: "",
    description: "",
    changes: "",
    isMandatory: false,
    isActive: true,
    releaseDate: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  // AI Assistance State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTargetField, setAiTargetField] = useState(null); // 'description' or 'changes'
  const [aiActiveAction, setAiActiveAction] = useState(null);
  const [aiMenuAnchor, setAiMenuAnchor] = useState(null);
  const [aiMenuField, setAiMenuField] = useState(null);
  const [aiPreviewData, setAiPreviewData] = useState(null); // { field, original, suggested, action }

  // 1-Click AI Full Release Generator State
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [aiGeneratingAll, setAiGeneratingAll] = useState(false);

  // Preview Dialog State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(null);

  // Delete Confirmation State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Versions
  const fetchVersions = useCallback(async (customPage = pagination.page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(customPage),
        limit: String(pagination.limit),
      });

      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (mandatoryFilter !== "all") params.append("mandatory", mandatoryFilter);

      const res = await fetch(`/adminstration/api/app-version?${params.toString()}`);
      const data = await res.json();

      if (!data.success && (data.error === "Unauthorized" || data.error === "NEXT_REDIRECT")) {
        router.push("/adminstration/login");
        return;
      }

      if (data.success) {
        setVersions(data.versions || []);
        setPagination(data.pagination || { page: customPage, limit: 10, totalCount: 0, totalPages: 1 });
        setStats(data.stats || { total: 0, active: 0, inactive: 0, mandatory: 0, latestVersion: null, latestReleaseDate: null });
      } else {
        toast.error(data.error || "Failed to load versions.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching version releases.");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, statusFilter, mandatoryFilter, router]);

  useEffect(() => {
    fetchVersions(1);
  }, [statusFilter, mandatoryFilter]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingVersion(null);
    setFormData({
      version: "",
      title: "",
      description: "",
      changes: "",
      isMandatory: false,
      isActive: true,
      releaseDate: new Date().toISOString().split("T")[0],
    });
    setAiPromptInput("");
    setAiPreviewData(null);
    setDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (versionItem) => {
    setEditingVersion(versionItem);
    setFormData({
      version: versionItem.version,
      title: versionItem.title || "",
      description: versionItem.description || "",
      changes: versionItem.changes || "",
      isMandatory: Boolean(versionItem.isMandatory),
      isActive: Boolean(versionItem.isActive),
      releaseDate: versionItem.releaseDate ? new Date(versionItem.releaseDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    });
    setAiPromptInput("");
    setAiPreviewData(null);
    setDialogOpen(true);
  };

  // Quick Toggle Active or Mandatory
  const handleToggleField = async (versionItem, field) => {
    try {
      const res = await fetch(`/adminstration/api/app-version/${versionItem.id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Version ${field} updated.`);
        fetchVersions();
      } else {
        toast.error(data.error || "Failed to update toggle.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error toggling version status.");
    }
  };

  // Save Form (Create or Edit)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.version.trim() || !formData.title.trim()) {
      toast.error("Version string and Title are required.");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingVersion
        ? `/adminstration/api/app-version/${editingVersion.id}`
        : "/adminstration/api/app-version";
      const method = editingVersion ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || (editingVersion ? "Version updated!" : "Version created!"));
        setDialogOpen(false);
        fetchVersions();
      } else {
        toast.error(data.error || "Failed to save version.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving version.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Version
  const handleDeleteConfirm = async () => {
    if (!versionToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/adminstration/api/app-version/${versionToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Version deleted.");
        setDeleteOpen(false);
        setVersionToDelete(null);
        fetchVersions();
      } else {
        toast.error(data.error || "Failed to delete version.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting version.");
    } finally {
      setDeleting(false);
    }
  };

  // Trigger AI Assistance
  const handleTriggerAi = async (action, fieldName) => {
    setAiMenuAnchor(null);
    const sourceText = formData[fieldName]?.trim();

    if (!sourceText) {
      toast.error(`Please enter some text in ${fieldName === "description" ? "Description" : "Changes"} first so AI can process it.`);
      return;
    }

    setAiLoading(true);
    setAiTargetField(fieldName);
    setAiActiveAction(action);

    try {
      const res = await fetch("/adminstration/api/app-version/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: sourceText,
          version: formData.version,
          title: formData.title,
          fieldType: fieldName,
        }),
      });

      const data = await res.json();

      if (data.success && data.resultText) {
        setAiPreviewData({
          field: fieldName,
          original: sourceText,
          suggested: data.resultText,
          action,
          modelUsed: data.modelUsed,
        });
        toast.success(`AI ${action} completed using ${data.modelUsed || "Gemini"}!`);
      } else {
        toast.error(data.error || "AI assistance failed. Please check Gemini API configuration.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error communicating with Gemini AI.");
    } finally {
      setAiLoading(false);
      setAiTargetField(null);
    }
  };

  // Accept AI Suggestion
  const handleApplyAiSuggestion = () => {
    if (!aiPreviewData) return;
    setFormData((prev) => ({
      ...prev,
      [aiPreviewData.field]: aiPreviewData.suggested,
    }));
    toast.success("AI suggestion applied to form!");
    setAiPreviewData(null);
  };

  // Discard AI Suggestion
  const handleDiscardAiSuggestion = () => {
    setAiPreviewData(null);
  };

  // 1-Click Generate Title, Summary, and Changelog from AI Prompt
  const handleGenerateAllWithAi = async (promptOverride) => {
    const rawPrompt = (typeof promptOverride === "string" ? promptOverride : aiPromptInput).trim();
    if (!rawPrompt) {
      toast.error("Please enter some details or notes in the AI prompt box first.");
      return;
    }

    setAiGeneratingAll(true);
    try {
      const res = await fetch("/adminstration/api/app-version/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_all",
          text: rawPrompt,
          version: formData.version,
          title: formData.title,
        }),
      });

      const data = await res.json();
      if (data.success && data.generated) {
        setFormData((prev) => ({
          ...prev,
          title: data.generated.title || prev.title,
          description: data.generated.description || prev.description,
          changes: data.generated.changes || prev.changes,
          version: (data.generated.suggestedVersion && !prev.version) ? data.generated.suggestedVersion : prev.version,
        }));
        toast.success(`✨ Title, Summary & Changelog generated using ${data.modelUsed || "Gemini AI"}!`);
      } else {
        toast.error(data.error || "Failed to generate release details with AI.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error communicating with Gemini AI.");
    } finally {
      setAiGeneratingAll(false);
    }
  };

  // Open Preview Modal
  const handleOpenPreview = (item) => {
    setPreviewVersion(item);
    setPreviewOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "100%", width: "100%", bgcolor: "background.default" }}>
      {/* Header Banner */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2, mb: 4 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(124, 58, 237, 0.1)", color: "primary.main", display: "flex" }}>
              <VersionIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: "-0.5px" }}>
              App Version Control & Release Manager
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Publish, manage, and distribute client application versions, mandatory upgrades, and Gemini AI-refined changelogs.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: { xs: "100%", sm: "auto" } }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={() => fetchVersions()}
            disabled={loading}
            sx={{ flex: { xs: 1, sm: "none" } }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{
              flex: { xs: 1, sm: "none" },
              bgcolor: "primary.main",
              boxShadow: "0 4px 14px 0 rgba(124, 58, 237, 0.39)",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            New Release
          </Button>
        </Box>
      </Box>

      {/* KPI Metrics Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Latest Active Version */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: "4px solid #7c3aed", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Current Active Release
                </Typography>
                <Chip
                  icon={<CheckCircleIcon sx={{ "&&": { color: "#10b981", fontSize: 16 } }} />}
                  label="Live"
                  size="small"
                  sx={{ bgcolor: "rgba(16, 185, 129, 0.1)", color: "#047857", fontWeight: 700, height: 22 }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main", mb: 0.5 }}>
                {stats.latestVersion || "None"}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {stats.latestReleaseDate
                  ? `Released: ${new Date(stats.latestReleaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                  : "No active versions published"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Published Releases */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: "4px solid #3b82f6", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Total Versions
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "rgba(59, 130, 246, 0.1)", color: "#2563eb" }}>
                  <NewReleasesIcon sx={{ fontSize: 18 }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
                {stats.total}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Lifetime releases in database
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active vs Inactive */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: "4px solid #10b981", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Active Distribution
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "rgba(16, 185, 129, 0.1)", color: "#059669" }}>
                  <CheckCircleIcon sx={{ fontSize: 18 }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
                {stats.active} <Typography component="span" variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>/ {stats.inactive} Inactive</Typography>
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {stats.active > 0 ? "Releases accessible to clients" : "No active releases"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Mandatory Releases */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: "4px solid #ef4444", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Mandatory Updates
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "rgba(239, 68, 68, 0.1)", color: "#dc2626" }}>
                  <LockIcon sx={{ fontSize: 18 }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: stats.mandatory > 0 ? "error.main" : "text.primary", mb: 0.5 }}>
                {stats.mandatory}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Enforced client update policies
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by version (e.g. 2.1.0), title, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchVersions(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearchQuery(""); fetchVersions(1); }}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Mandatory</InputLabel>
              <Select
                value={mandatoryFilter}
                label="Mandatory"
                onChange={(e) => setMandatoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Releases</MenuItem>
                <MenuItem value="yes">Mandatory Updates</MenuItem>
                <MenuItem value="no">Optional Updates</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 1 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => fetchVersions(1)}
              sx={{ height: 40 }}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Main Table Card */}
      <Card sx={{ overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "rgba(124, 58, 237, 0.04)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "text.primary", py: 2, width: 70 }}>S.No</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>Version</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>Title & Summary</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>Release Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.primary", textAlign: "center" }}>Mandatory</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.primary", textAlign: "center" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.primary", textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} color="primary" />
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5 }}>
                      Loading version releases...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : versions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Box sx={{ p: 2, borderRadius: "50%", bgcolor: "rgba(124, 58, 237, 0.08)", display: "inline-flex", mb: 1.5 }}>
                      <VersionIcon sx={{ fontSize: 40, color: "primary.main" }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                      No app versions found
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 400, mx: "auto", mb: 2 }}>
                      {searchQuery || statusFilter !== "all" || mandatoryFilter !== "all"
                        ? "Try clearing your filters or search query to find releases."
                        : "Click 'New Release' above to publish your first application version with Gemini AI assistance."}
                    </Typography>
                    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                      Publish First Version
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                versions.map((ver, index) => (
                  <TableRow
                    key={ver.id}
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      bgcolor: ver.isMandatory ? "rgba(239, 68, 68, 0.015)" : "inherit",
                    }}
                  >
                    {/* S.No */}
                    <TableCell sx={{ fontWeight: 700, color: "text.secondary", py: 2 }}>
                      {((pagination.page - 1) * pagination.limit) + index + 1}
                    </TableCell>

                    {/* Version Chip */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={ver.version}
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.875rem",
                            bgcolor: ver.isActive ? "rgba(124, 58, 237, 0.12)" : "rgba(0, 0, 0, 0.08)",
                            color: ver.isActive ? "primary.main" : "text.secondary",
                            borderRadius: "6px",
                          }}
                        />
                        {ver.isMandatory && (
                          <Tooltip title="Forced Mandatory Update" arrow>
                            <LockIcon sx={{ fontSize: 16, color: "error.main" }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>

                    {/* Title and Description Snippet */}
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", mb: 0.2 }}>
                        {ver.title}
                      </Typography>
                      {ver.description ? (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            fontSize: "0.825rem",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            maxWidth: 480,
                          }}
                        >
                          {ver.description}
                        </Typography>
                      ) : (
                        <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>
                          No description provided
                        </Typography>
                      )}
                    </TableCell>

                    {/* Release Date */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <EventIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                          {new Date(ver.releaseDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Mandatory Switch */}
                    <TableCell align="center">
                      <Tooltip title={ver.isMandatory ? "Mandatory Update" : "Optional Update"} arrow>
                        <Switch
                          size="small"
                          color="error"
                          checked={Boolean(ver.isMandatory)}
                          onChange={() => handleToggleField(ver, "isMandatory")}
                        />
                      </Tooltip>
                    </TableCell>

                    {/* Active Switch */}
                    <TableCell align="center">
                      <Tooltip title={ver.isActive ? "Published & Active" : "Inactive / Draft"} arrow>
                        <Switch
                          size="small"
                          color="success"
                          checked={Boolean(ver.isActive)}
                          onChange={() => handleToggleField(ver, "isActive")}
                        />
                      </Tooltip>
                    </TableCell>

                    {/* Action Buttons */}
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                        <Tooltip title="Preview User Announcement" arrow>
                          <IconButton size="small" color="primary" onClick={() => handleOpenPreview(ver)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Version" arrow>
                          <IconButton size="small" color="info" onClick={() => handleOpenEdit(ver)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Release" arrow>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setVersionToDelete(ver);
                              setDeleteOpen(true);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid", borderColor: "divider" }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} releases
            </Typography>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={(e, p) => fetchVersions(p)}
              color="primary"
              shape="rounded"
              size="small"
            />
          </Box>
        )}
      </Card>

      {/* CREATE / EDIT DIALOG WITH INTEGRATED GEMINI AI */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && !aiLoading && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(124, 58, 237, 0.1)", color: "primary.main", display: "flex" }}>
              <VersionIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {editingVersion ? `Edit Version ${editingVersion.version}` : "Publish New App Version"}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Fill in version details and use Gemini AI to refine descriptions & changelogs.
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setDialogOpen(false)} disabled={submitting || aiLoading}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ py: 2.5 }}>
            {/* ✨ 1-Click Instant AI Release Generator */}
            <Box
              sx={{
                p: 2.25,
                mb: 3,
                borderRadius: 2.5,
                background: "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)",
                border: "1.5px solid rgba(124, 58, 237, 0.25)",
                boxShadow: "0 4px 16px rgba(124, 58, 237, 0.06)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: "rgba(124, 58, 237, 0.15)", color: "#7c3aed", display: "flex" }}>
                    <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#6d28d9" }}>
                    Instant AI Release Generator
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label="1-Click Auto-Fill"
                  sx={{ bgcolor: "rgba(124, 58, 237, 0.12)", color: "#6d28d9", fontWeight: 800, fontSize: "0.68rem" }}
                />
              </Box>

              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5, lineHeight: 1.4 }}>
                Type your release notes or bullet points below. Gemini AI will automatically generate and fill the <strong>Release Title</strong>, <strong>Executive Summary</strong>, and <strong>Structured Changelog</strong> in one click.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, alignItems: "stretch" }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={4}
                  size="small"
                  placeholder="Type release details... e.g. Added automated WhatsApp report PDF delivery, fixed discount calculation bug on patient billing, optimized registration page speed to sub-second load, version 2.4.0"
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  disabled={aiGeneratingAll}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleGenerateAllWithAi();
                    }
                  }}
                  sx={{
                    bgcolor: "#FFFFFF",
                    borderRadius: 1.5,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleGenerateAllWithAi()}
                  disabled={aiGeneratingAll || !aiPromptInput.trim()}
                  startIcon={aiGeneratingAll ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
                  sx={{
                    bgcolor: "#7c3aed",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    px: 3,
                    py: 1,
                    borderRadius: 1.5,
                    whiteSpace: "nowrap",
                    alignSelf: { xs: "stretch", sm: "center" },
                    minHeight: { sm: 54 },
                    boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
                    "&:hover": { bgcolor: "#6d28d9" },
                  }}
                >
                  {aiGeneratingAll ? "Generating..." : "Generate with AI"}
                </Button>
              </Box>

              {/* Quick Starter Templates */}
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mt: 1.25 }}>
                <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, fontSize: "0.68rem" }}>
                  Quick Examples:
                </Typography>
                {[
                  { label: "⚡ Speed & Bug Fixes", text: "Optimized patient registration and test load speed to sub-second response, fixed invoice discount calculation, cleaned drawer navigation delay on mobile" },
                  { label: "🚀 WhatsApp & Reporting", text: "Added automated WhatsApp delivery for test PDF reports, QR code scanning verification, enhanced money receipt printing" },
                  { label: "🔒 Security & Multi-Tenant", text: "Strengthened workspace role permissions, updated database indexing for multi-tenant isolation, mandatory security patch" },
                ].map((tpl) => (
                  <Chip
                    key={tpl.label}
                    size="small"
                    label={tpl.label}
                    onClick={() => setAiPromptInput(tpl.text)}
                    sx={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      bgcolor: "rgba(255, 255, 255, 0.85)",
                      border: "1px solid rgba(124, 58, 237, 0.2)",
                      "&:hover": { bgcolor: "rgba(124, 58, 237, 0.1)" },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Version, Title, Date Grid */}
            <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="Version String"
                  placeholder="e.g. 2.1.0 or v2.1.0"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  helperText="Follow semantic versioning (Major.Minor.Patch)"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  fullWidth
                  required
                  label="Release Title"
                  placeholder="e.g. Performance Updates & Bug Fixes"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Release Date"
                  value={formData.releaseDate}
                  onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {/* Switches: Mandatory & Active */}
            <Box sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: "rgba(0, 0, 0, 0.02)", border: "1px solid", borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Active Status
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Make this release live and visible to client applications
                    </Typography>
                  </Box>
                }
              />

              <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isMandatory}
                    onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                    color="error"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: formData.isMandatory ? "error.main" : "text.primary" }}>
                      Mandatory Update
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Enforce users to update before proceeding
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {/* Description Field with AI Toolbar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                  Release Summary / Description
                </Typography>

                {/* Gemini AI Assistant Button & Toolbar */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={aiLoading && aiTargetField === "description" ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon sx={{ color: "#7c3aed" }} />}
                    onClick={(e) => {
                      setAiMenuField("description");
                      setAiMenuAnchor(e.currentTarget);
                    }}
                    disabled={aiLoading}
                    sx={{
                      borderColor: "rgba(124, 58, 237, 0.4)",
                      color: "primary.main",
                      bgcolor: "rgba(124, 58, 237, 0.04)",
                      fontWeight: 700,
                      fontSize: "0.775rem",
                      textTransform: "none",
                      "&:hover": {
                        bgcolor: "rgba(124, 58, 237, 0.1)",
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    {aiLoading && aiTargetField === "description" ? "Gemini Refining..." : "✨ AI Assist"}
                  </Button>
                </Box>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Brief summary of what this release brings to EasyTechnoMed users..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Box>

            {/* Changes / Detailed Changelog Field with AI Toolbar */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                    Detailed Changes & Release Notes
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Use markdown or bullet points. Use "Company Standard" AI to format into 🚀 What's New, ⚡ Improvements, 🛠️ Fixes.
                  </Typography>
                </Box>

                {/* Gemini AI Assistant Button & Toolbar */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={aiLoading && aiTargetField === "changes" ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon sx={{ color: "#7c3aed" }} />}
                    onClick={(e) => {
                      setAiMenuField("changes");
                      setAiMenuAnchor(e.currentTarget);
                    }}
                    disabled={aiLoading}
                    sx={{
                      borderColor: "rgba(124, 58, 237, 0.4)",
                      color: "primary.main",
                      bgcolor: "rgba(124, 58, 237, 0.04)",
                      fontWeight: 700,
                      fontSize: "0.775rem",
                      textTransform: "none",
                      "&:hover": {
                        bgcolor: "rgba(124, 58, 237, 0.1)",
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    {aiLoading && aiTargetField === "changes" ? "Gemini Refining..." : "✨ AI Assist"}
                  </Button>
                </Box>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={5}
                placeholder={`- Added new PDF formula engine\n- Optimized test parameter syncing\n- Fixed patient registration search glitch`}
                value={formData.changes}
                onChange={(e) => setFormData({ ...formData, changes: e.target.value })}
              />
            </Box>

            {/* AI Suggestion Comparison Card (if generated) */}
            {aiPreviewData && (
              <Fade in={Boolean(aiPreviewData)}>
                <Card sx={{ mt: 2.5, border: "1.5px solid #7c3aed", bgcolor: "rgba(124, 58, 237, 0.02)" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AutoAwesomeIcon sx={{ color: "primary.main", fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>
                          Gemini AI Suggestion ({aiPreviewData.action.toUpperCase()} - {aiPreviewData.field.toUpperCase()})
                        </Typography>
                        {aiPreviewData.modelUsed && (
                          <Chip label={aiPreviewData.modelUsed} size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }} />
                        )}
                      </Box>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="inherit"
                          startIcon={<UndoIcon />}
                          onClick={handleDiscardAiSuggestion}
                        >
                          Discard
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<AcceptIcon />}
                          onClick={handleApplyAiSuggestion}
                          sx={{ bgcolor: "primary.main" }}
                        >
                          Apply to {aiPreviewData.field}
                        </Button>
                      </Box>
                    </Box>

                    <Paper sx={{ p: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.875rem", maxHeight: 200, overflowY: "auto" }}>
                      {aiPreviewData.suggested}
                    </Paper>
                  </CardContent>
                </Card>
              </Fade>
            )}
          </DialogContent>

          <Divider />
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AcceptIcon />}
              sx={{ bgcolor: "primary.main" }}
            >
              {submitting ? "Saving..." : editingVersion ? "Save Changes" : "Publish Version"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* AI ACTIONS POPUP MENU */}
      <Menu
        anchorEl={aiMenuAnchor}
        open={Boolean(aiMenuAnchor)}
        onClose={() => setAiMenuAnchor(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 220,
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Gemini AI Enhancer
          </Typography>
        </Box>
        <Divider />

        <MenuItem onClick={() => handleTriggerAi("grammar", aiMenuField)}>
          <ListItemIcon>
            <GrammarIcon fontSize="small" sx={{ color: "#3b82f6" }} />
          </ListItemIcon>
          <ListItemText
            primary="Check Grammar"
            secondary="Fix spelling, punctuation, and typos"
            primaryTypographyProps={{ fontWeight: 600, fontSize: "0.875rem" }}
            secondaryTypographyProps={{ fontSize: "0.75rem" }}
          />
        </MenuItem>

        <MenuItem onClick={() => handleTriggerAi("rephrase", aiMenuField)}>
          <ListItemIcon>
            <RephraseIcon fontSize="small" sx={{ color: "#10b981" }} />
          </ListItemIcon>
          <ListItemText
            primary="Rephrase"
            secondary="Rewrite with professional, engaging tone"
            primaryTypographyProps={{ fontWeight: 600, fontSize: "0.875rem" }}
            secondaryTypographyProps={{ fontSize: "0.75rem" }}
          />
        </MenuItem>

        <MenuItem onClick={() => handleTriggerAi("optimize", aiMenuField)}>
          <ListItemIcon>
            <OptimizeIcon fontSize="small" sx={{ color: "#f59e0b" }} />
          </ListItemIcon>
          <ListItemText
            primary="Optimize"
            secondary="Concise, punchy bulleted highlights"
            primaryTypographyProps={{ fontWeight: 600, fontSize: "0.875rem" }}
            secondaryTypographyProps={{ fontSize: "0.75rem" }}
          />
        </MenuItem>

        <MenuItem onClick={() => handleTriggerAi("standard", aiMenuField)}>
          <ListItemIcon>
            <StandardIcon fontSize="small" sx={{ color: "#7c3aed" }} />
          </ListItemIcon>
          <ListItemText
            primary="Company Standard"
            secondary="Format with 🚀 Features, ⚡ Improvements, 🛠️ Fixes"
            primaryTypographyProps={{ fontWeight: 600, fontSize: "0.875rem" }}
            secondaryTypographyProps={{ fontSize: "0.75rem" }}
          />
        </MenuItem>
      </Menu>

      {/* USER ANNOUNCEMENT PREVIEW MODAL */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <VisibilityIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              End-User Announcement Preview
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setPreviewOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ py: 3 }}>
          {previewVersion && (
            <Card sx={{ border: "2px solid", borderColor: previewVersion.isMandatory ? "error.main" : "primary.main", borderRadius: 3, overflow: "hidden" }}>
              <Box sx={{ p: 2.5, bgcolor: previewVersion.isMandatory ? "rgba(239, 68, 68, 0.08)" : "rgba(124, 58, 237, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: previewVersion.isMandatory ? "error.main" : "primary.main", color: "#fff", display: "flex" }}>
                    <VersionIcon />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", color: previewVersion.isMandatory ? "error.main" : "primary.main", letterSpacing: "0.5px" }}>
                      {previewVersion.isMandatory ? "Mandatory Update Required" : "New Update Available"}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                      Version {previewVersion.version}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={new Date(previewVersion.releaseDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                  {previewVersion.title}
                </Typography>

                {previewVersion.description && (
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5, lineHeight: 1.6 }}>
                    {previewVersion.description}
                  </Typography>
                )}

                {previewVersion.changes && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                      What's New in this Release:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: "rgba(0, 0, 0, 0.02)", borderRadius: 2, whiteSpace: "pre-wrap", fontSize: "0.875rem", lineHeight: 1.7 }}>
                      {previewVersion.changes}
                    </Paper>
                  </Box>
                )}

                <Box sx={{ mt: 3, display: "flex", gap: 1.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color={previewVersion.isMandatory ? "error" : "primary"}
                    sx={{
                      py: 1.2,
                      fontWeight: 700,
                      bgcolor: previewVersion.isMandatory ? "error.main" : "primary.main",
                    }}
                  >
                    {previewVersion.isMandatory ? "Update Now (Required)" : "Install Update"}
                  </Button>
                  {!previewVersion.isMandatory && (
                    <Button fullWidth variant="outlined" color="inherit">
                      Remind Me Later
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPreviewOpen(false)} color="inherit">
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main" }}>
          <WarningIcon color="error" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Are you sure you want to permanently delete App Version release <strong>"{versionToDelete?.version}" ({versionToDelete?.title})</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} color="inherit" disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? "Deleting..." : "Delete Release"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
