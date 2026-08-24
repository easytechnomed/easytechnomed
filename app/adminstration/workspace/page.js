"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider,
  Checkbox,
  FormControlLabel,
  Chip,
  Alert,
  Drawer,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  TableSortLabel,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Business as WorkspaceIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  Sync as SyncIcon,
  Autorenew as AutorenewIcon,
  Science as ScienceIcon,
  People as PeopleIcon,
  AppRegistration as RegIcon,
  ReceiptLong as ReceiptLongIcon,
  CurrencyRupee as RupeeIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { toast } from "sonner";

function WorkspaceControllerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingWorkspaceId, setSyncingWorkspaceId] = useState(null);

  // Plan Renewal State for Workspace
  const [renewWorkspaceModalOpen, setRenewWorkspaceModalOpen] = useState(false);
  const [renewingWorkspace, setRenewingWorkspace] = useState(null);
  const [renewDays, setRenewDays] = useState(30);
  const [renewOriginalPrice, setRenewOriginalPrice] = useState(499);
  const [renewAmount, setRenewAmount] = useState(399);
  const [renewPaymentMode, setRenewPaymentMode] = useState("UPI");
  const [renewReferenceNo, setRenewReferenceNo] = useState("");
  const [renewNotes, setRenewNotes] = useState("");
  const [renewConfirmed, setRenewConfirmed] = useState(false);
  const [renewing, setRenewing] = useState(false);

  // Payment History Drawer State
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [paymentWorkspace, setPaymentWorkspace] = useState(null);
  const [paymentLogs, setPaymentLogs] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [totalWorkspacePaid, setTotalWorkspacePaid] = useState(0);

  // Sync Defaults Modal State
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncingWorkspace, setSyncingWorkspace] = useState(null);
  const [syncConfirmed, setSyncConfirmed] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Workspace Sorting State
  const [wsOrderBy, setWsOrderBy] = useState("name");
  const [wsOrder, setWsOrder] = useState("asc");

  const handleWsRequestSort = (property) => {
    const isAsc = wsOrderBy === property && wsOrder === "asc";
    setWsOrder(isAsc ? "desc" : "asc");
    setWsOrderBy(property);
  };

  const sortedWorkspaces = React.useMemo(() => {
    return [...workspaces].sort((a, b) => {
      let aVal = a[wsOrderBy];
      let bVal = b[wsOrderBy];

      if (wsOrderBy === "admins") {
        aVal = a.admins?.map((x) => x.name).join(", ").toLowerCase() || "";
        bVal = b.admins?.map((x) => x.name).join(", ").toLowerCase() || "";
      } else if (wsOrderBy === "today") {
        aVal = a.stats?.today || 0;
        bVal = b.stats?.today || 0;
      } else if (wsOrderBy === "last7Days") {
        aVal = a.stats?.last7Days || 0;
        bVal = b.stats?.last7Days || 0;
      } else if (wsOrderBy === "expireAt") {
        aVal = a.expireAt ? new Date(a.expireAt).getTime() : 0;
        bVal = b.expireAt ? new Date(b.expireAt).getTime() : 0;
      } else if (wsOrderBy === "isActive") {
        aVal = a.isActive ? 1 : 0;
        bVal = b.isActive ? 1 : 0;
      } else if (typeof aVal === "string") {
        aVal = (aVal || "").toLowerCase();
        bVal = (bVal || "").toLowerCase();
      }

      if (aVal < bVal) {
        return wsOrder === "asc" ? -1 : 1;
      }
      if (aVal > bVal) {
        return wsOrder === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [workspaces, wsOrderBy, wsOrder]);

  // Workspace Pagination State with URL params sync
  const urlPage = parseInt(searchParams.get("page"), 10) || 1;
  const urlLimit = parseInt(searchParams.get("limit"), 10) || 10;

  const [page, setPage] = useState(urlPage);
  const [limit, setLimit] = useState(urlLimit);

  useEffect(() => {
    const p = parseInt(searchParams.get("page"), 10);
    const l = parseInt(searchParams.get("limit"), 10);
    if (p && p !== page) setPage(p);
    if (l && l !== limit) setLimit(l);
  }, [searchParams]);

  const updateQueryParams = (newPage, newLimit) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("page", newPage.toString());
    currentParams.set("limit", newLimit.toString());
    router.push(`${pathname}?${currentParams.toString()}`);
  };

  const totalCount = sortedWorkspaces.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const currentPage = Math.min(page, totalPages);
  const paginatedWorkspaces = sortedWorkspaces.slice((currentPage - 1) * limit, currentPage * limit);

  const fromItem = totalCount > 0 ? (currentPage - 1) * limit + 1 : 0;
  const toItem = Math.min(currentPage * limit, totalCount);

  const handlePageChange = (newPage) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(validPage);
    updateQueryParams(validPage, limit);
  };

  const handleLimitChange = (newLimit) => {
    const parsedLimit = parseInt(newLimit, 10) || 10;
    setLimit(parsedLimit);
    setPage(1);
    updateQueryParams(1, parsedLimit);
  };

  const handleGoToPage = (targetPage) => {
    const parsedPage = parseInt(targetPage, 10) || 1;
    handlePageChange(parsedPage);
  };

  // Modals state
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Forms state
  const [workspaceForm, setWorkspaceForm] = useState({ name: "", slug: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const wsRes = await fetch("/adminstration/api/workspaces").then((r) => r.json());

      if (!wsRes.success && (wsRes.error === "NEXT_REDIRECT" || wsRes.error === "Unauthorized")) {
        router.push("/adminstration/login");
        return;
      }

      if (wsRes.success) {
        setWorkspaces(wsRes.workspaces);
      } else {
        toast.error(wsRes.error || "Failed to load workspaces.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load workspace data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle Workspace Status
  const handleToggleWorkspace = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const res = await fetch(`/adminstration/api/workspaces/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: newStatus }),
    }).then((r) => r.json());
    if (res.success) {
      toast.success(res.message);
      setWorkspaces((prev) =>
        prev.map((ws) => (ws.id === id ? { ...ws, isActive: newStatus } : ws))
      );
    } else {
      toast.error(res.error || "Failed to change workspace status.");
    }
  };

  const handleOpenSyncModal = (ws) => {
    setSyncingWorkspace(ws);
    setSyncConfirmed(false);
    setSyncModalOpen(true);
  };

  const handleConfirmSyncSubmit = async () => {
    if (!syncingWorkspace || !syncConfirmed) return;
    setSyncing(true);
    try {
      const res = await fetch(`/adminstration/api/workspaces/${syncingWorkspace.id}/sync-defaults`, {
        method: "POST",
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message || "Workspace synchronized successfully!");
        setSyncModalOpen(false);
        setSyncingWorkspace(null);
        fetchData();
      } else {
        toast.error(res.error || "Failed to sync workspace.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during synchronization.");
    } finally {
      setSyncing(false);
    }
  };

  // Delete Workspace
  const handleDeleteWorkspace = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this workspace? This will cascade delete ALL connected admins, registrations, and results!"
      )
    ) {
      return;
    }

    const res = await fetch(`/adminstration/api/workspaces/${id}`, { method: "DELETE" }).then((r) => r.json());
    if (res.success) {
      toast.success(res.message);
      fetchData();
    } else {
      toast.error(res.error || "Failed to delete workspace.");
    }
  };

  // Handle Workspace Create Submit
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceForm.name || !workspaceForm.slug) {
      toast.error("All fields are required.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/adminstration/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(workspaceForm),
    }).then((r) => r.json());
    if (res.success) {
      toast.success(res.message);
      setWorkspaceModalOpen(false);
      setWorkspaceForm({ name: "", slug: "" });
      fetchData();
    } else {
      toast.error(res.error || "Failed to create workspace.");
    }
    setSubmitting(false);
  };
  const handleWorkspaceSubmit = handleCreateWorkspace;

  const PLAN_PRESETS = [
    { label: "+30 Days (1M)", val: 30, mrp: 499, amount: 399 },
    { label: "+60 Days (2M)", val: 60, mrp: 999, amount: 799 },
    { label: "+90 Days (3M)", val: 90, mrp: 1499, amount: 1099 },
    { label: "+180 Days (6M)", val: 180, mrp: 2999, amount: 1999 },
    { label: "+365 Days (1Y)", val: 365, mrp: 5999, amount: 3999 },
  ];

  const handleOpenRenewWorkspace = (ws) => {
    setRenewingWorkspace(ws);
    setRenewDays(30);
    setRenewOriginalPrice(499);
    setRenewAmount(399);
    setRenewPaymentMode("UPI");
    setRenewReferenceNo("");
    setRenewNotes("");
    setRenewConfirmed(false);
    setRenewWorkspaceModalOpen(true);
  };

  const handleSelectPlanPreset = (preset) => {
    setRenewDays(preset.val);
    setRenewOriginalPrice(preset.mrp);
    setRenewAmount(preset.amount);
  };

  const handleCustomDaysChange = (val) => {
    setRenewDays(val);
    const d = parseInt(val, 10);
    if (!isNaN(d) && d > 0) {
      const preset = PLAN_PRESETS.find((p) => p.val === d);
      if (preset) {
        setRenewOriginalPrice(preset.mrp);
        setRenewAmount(preset.amount);
      } else {
        const calculatedMrp = Math.round((d / 30) * 499);
        setRenewOriginalPrice(calculatedMrp);
        setRenewAmount(Math.round(calculatedMrp * 0.8));
      }
    }
  };

  const handleOpenPaymentHistory = async (ws) => {
    setPaymentWorkspace(ws);
    setPaymentDrawerOpen(true);
    setLoadingPayments(true);
    setPaymentLogs([]);
    setTotalWorkspacePaid(0);

    try {
      const res = await fetch(`/adminstration/api/workspaces/${ws.id}/payments`).then((r) => r.json());
      if (res.success) {
        setPaymentLogs(res.payments || []);
        setTotalWorkspacePaid(res.totalPaid || 0);
      } else {
        toast.error(res.error || "Failed to load payment history.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payment history.");
    } finally {
      setLoadingPayments(false);
    }
  };

  const calculateNewWorkspaceExpiry = (ws, days) => {
    const daysNum = parseInt(days, 10) || 0;
    if (daysNum <= 0) return null;
    const now = new Date();
    let base = now;
    if (ws?.expireAt) {
      const exp = new Date(ws.expireAt);
      if (!isNaN(exp.getTime()) && exp > now) {
        base = exp;
      }
    }
    return new Date(base.getTime() + daysNum * 24 * 60 * 60 * 1000);
  };

  const handleRenewWorkspaceSubmit = async (e) => {
    e?.preventDefault();
    if (!renewingWorkspace) return;
    const daysNum = parseInt(renewDays, 10);
    if (isNaN(daysNum) || daysNum <= 0) {
      toast.error("Please enter a valid number of days (at least 1 day).");
      return;
    }
    if (!renewConfirmed) {
      toast.error("Please check the confirmation checkbox to extend the workspace plan.");
      return;
    }

    const mrpNum = parseFloat(renewOriginalPrice) || 0;
    const paidNum = parseFloat(renewAmount) || 0;
    const discountNum = mrpNum > paidNum ? mrpNum - paidNum : 0;

    setRenewing(true);
    try {
      const res = await fetch(`/adminstration/api/workspaces/${renewingWorkspace.id}/renew`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: daysNum,
          amount: paidNum,
          originalPrice: mrpNum,
          discount: discountNum,
          paymentMode: renewPaymentMode,
          referenceNo: renewReferenceNo,
          notes: renewNotes,
        }),
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message);
        setWorkspaces((prev) =>
          prev.map((w) =>
            w.id === renewingWorkspace.id ? { ...w, expireAt: res.workspace.expireAt, isActive: true } : w
          )
        );
        setRenewWorkspaceModalOpen(false);
        setRenewingWorkspace(null);
      } else {
        toast.error(res.error || "Failed to renew workspace plan.");
      }
    } catch (err) {
      console.error("Renew error:", err);
      toast.error("Something went wrong while renewing workspace plan.");
    } finally {
      setRenewing(false);
    }
  };

  const handleWorkspaceNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    setWorkspaceForm({ name, slug });
  };

  const totalWorkspaces = workspaces.length;
  const activeWorkspacesCount = workspaces.filter((w) => w.isActive).length;
  const expiredWorkspacesCount = workspaces.filter((w) => w.expireAt && new Date(w.expireAt) < new Date()).length;
  const totalRegToday = workspaces.reduce((sum, ws) => sum + (ws.stats?.today || 0), 0);

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2.5, md: 4 }, bgcolor: "background.default", overflowY: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
            Workspace Controller
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage, configure, and monitor laboratory workspaces, plan renewals & sync settings.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setWorkspaceModalOpen(true)}
          sx={{ fontWeight: 700, px: 2.5, py: 1, borderRadius: 2 }}
        >
          New Workspace
        </Button>
      </Box>

      {/* Summary KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 2.5 }}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "rgba(124, 58, 237, 0.1)", color: "primary.main" }}>
                <WorkspaceIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Total Workspaces
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {loading ? "…" : totalWorkspaces}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 2.5 }}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "rgba(34, 197, 94, 0.1)", color: "#16a34a" }}>
                <WorkspaceIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Active Labs
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#16a34a" }}>
                  {loading ? "…" : activeWorkspacesCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 2.5 }}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "rgba(239, 68, 68, 0.1)", color: "#dc2626" }}>
                <AutorenewIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Expired Plans
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: expiredWorkspacesCount > 0 ? "#dc2626" : "text.primary" }}>
                  {loading ? "…" : expiredWorkspacesCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 2.5 }}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "rgba(59, 130, 246, 0.1)", color: "#2563eb" }}>
                <RegIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Registrations Today
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#2563eb" }}>
                  {loading ? "…" : totalRegToday}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content: Mobile Cards (< md) & Desktop Table (>= md) */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
          {/* Mobile Cards View (< md) */}
          <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 2, p: 2 }}>
            {paginatedWorkspaces.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                No workspaces found. Create one to begin.
              </Box>
            ) : (
              paginatedWorkspaces.map((ws, idx) => {
                const serialNo = (currentPage - 1) * limit + idx + 1;
                const isExpired = ws.expireAt && new Date(ws.expireAt) < new Date();
                const daysLeft = ws.expireAt
                  ? Math.max(0, Math.ceil((new Date(ws.expireAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  : null;

                return (
                  <Card
                    key={ws.id}
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      p: 2,
                      border: isExpired ? "1px solid #fecaca" : "1px solid #e2e8f0",
                      bgcolor: isExpired ? "rgba(254, 242, 242, 0.3)" : "background.paper",
                      boxShadow: "0 2px 8px -2px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Header Row: S.No, Name, Slug, Switch */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={`#${serialNo}`}
                          size="small"
                          sx={{ fontWeight: 800, height: 22, fontSize: "0.72rem", bgcolor: "#f1f5f9", color: "#475569" }}
                        />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.2 }}>
                            {ws.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                            /{ws.slug}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: ws.isActive ? "#16a34a" : "text.secondary" }}>
                          {ws.isActive ? "Active" : "Inactive"}
                        </Typography>
                        <Switch
                          size="small"
                          checked={ws.isActive}
                          onChange={() => handleToggleWorkspace(ws.id, ws.isActive)}
                          color="primary"
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Details Grid */}
                    <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                      {/* Admins */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", fontSize: "0.72rem" }}>
                          Connected Admins:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.82rem" }}>
                          {ws.admins.length === 0 ? "No admins assigned" : ws.admins.map((adm) => adm.name).join(", ")}
                        </Typography>
                      </Grid>

                      {/* Plan Expiry */}
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", fontSize: "0.72rem" }}>
                          Plan Expiry
                        </Typography>
                        {ws.expireAt ? (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3, mt: 0.2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                              {new Date(ws.expireAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </Typography>
                            {isExpired ? (
                              <Chip
                                size="small"
                                label="Expired"
                                sx={{
                                  height: 18,
                                  fontSize: "0.65rem",
                                  bgcolor: "#fee2e2",
                                  color: "#dc2626",
                                  fontWeight: 800,
                                  width: "fit-content",
                                }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                label={`${daysLeft}d left`}
                                sx={{
                                  height: 18,
                                  fontSize: "0.65rem",
                                  bgcolor: "#f0fdf4",
                                  color: "#166534",
                                  fontWeight: 800,
                                  width: "fit-content",
                                }}
                              />
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                            No Expiry Set
                          </Typography>
                        )}
                      </Grid>

                      {/* Activity Stats */}
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", fontSize: "0.72rem" }}>
                          Registrations
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1.5, mt: 0.3 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", display: "block" }}>
                              Today
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: "#2563eb" }}>
                              {ws.stats?.today || 0}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", display: "block" }}>
                              Last 7d
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {ws.stats?.last7Days || 0}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Action Row */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AutorenewIcon fontSize="small" />}
                        onClick={() => handleOpenRenewWorkspace(ws)}
                        sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: "0.75rem", py: 0.4 }}
                      >
                        Renew Plan
                      </Button>

                      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                        <Tooltip title="View Subscription Payments">
                          <IconButton
                            color="secondary"
                            size="small"
                            onClick={() => handleOpenPaymentHistory(ws)}
                            sx={{ bgcolor: "rgba(124, 58, 237, 0.08)", borderRadius: 1.5 }}
                          >
                            <ReceiptLongIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sync Defaults">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenSyncModal(ws)}
                            sx={{ bgcolor: "#f1f5f9", borderRadius: 1.5 }}
                          >
                            <SyncIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteWorkspace(ws.id)}
                            sx={{ bgcolor: "#fee2e2", borderRadius: 1.5 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Card>
                );
              })
            )}
          </Box>

          {/* Desktop Table View (>= md) */}
          <TableContainer sx={{ display: { xs: "none", md: "block" }, overflowX: "auto" }}>
            <Table>
              <TableHead sx={{ bgcolor: "background.paper" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">
                    S.No
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel
                      active={wsOrderBy === "name"}
                      direction={wsOrderBy === "name" ? wsOrder : "asc"}
                      onClick={() => handleWsRequestSort("name")}
                    >
                      Workspace Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel
                      active={wsOrderBy === "slug"}
                      direction={wsOrderBy === "slug" ? wsOrder : "asc"}
                      onClick={() => handleWsRequestSort("slug")}
                    >
                      Slug
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel
                      active={wsOrderBy === "admins"}
                      direction={wsOrderBy === "admins" ? wsOrder : "asc"}
                      onClick={() => handleWsRequestSort("admins")}
                    >
                      Admins
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel
                      active={wsOrderBy === "expireAt"}
                      direction={wsOrderBy === "expireAt" ? wsOrder : "asc"}
                      onClick={() => handleWsRequestSort("expireAt")}
                    >
                      Plan Expiry
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    <TableSortLabel
                      active={wsOrderBy === "today"}
                      direction={wsOrderBy === "today" ? wsOrder : "asc"}
                      onClick={() => handleWsRequestSort("today")}
                    >
                      Reg Today
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    <TableSortLabel
                      active={wsOrderBy === "last7Days"}
                      direction={wsOrderBy === "last7Days" ? wsOrder : "asc"}
                      onClick={() => handleWsRequestSort("last7Days")}
                    >
                      Reg Last 7 Days
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    <TableSortLabel
                      active={wsOrderBy === "isActive"}
                      direction={wsOrderBy === "isActive" ? wsOrder : "asc"}
                      onClick={() => handleWsRequestSort("isActive")}
                    >
                      Active Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedWorkspaces.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No workspaces found. Create one to begin.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedWorkspaces.map((ws, idx) => (
                    <TableRow key={ws.id} hover>
                      <TableCell align="center" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.85rem" }}>
                        {(currentPage - 1) * limit + idx + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{ws.name}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>/{ws.slug}</TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        {ws.admins.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                            No admins
                          </Typography>
                        ) : (
                          ws.admins.map((adm) => adm.name).join(", ")
                        )}
                      </TableCell>
                      <TableCell>
                        {ws.expireAt ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.82rem" }}>
                              {new Date(ws.expireAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </Typography>
                            {new Date(ws.expireAt) < new Date() ? (
                              <Chip
                                label="Expired"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.68rem",
                                  bgcolor: "#fee2e2",
                                  color: "#b91c1c",
                                  fontWeight: 700,
                                  mt: 0.3,
                                }}
                              />
                            ) : (
                              <Chip
                                label={`${Math.max(1, Math.ceil((new Date(ws.expireAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d left`}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.68rem",
                                  bgcolor: "#f0fdf4",
                                  color: "#166534",
                                  fontWeight: 700,
                                  mt: 0.3,
                                }}
                              />
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                            No Expiry
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">{ws.stats?.today || 0}</TableCell>
                      <TableCell align="center">{ws.stats?.last7Days || 0}</TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={ws.isActive}
                          onChange={() => handleToggleWorkspace(ws.id, ws.isActive)}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center", alignItems: "center" }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AutorenewIcon fontSize="small" />}
                            onClick={() => handleOpenRenewWorkspace(ws)}
                            sx={{
                              py: 0.3,
                              px: 1,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              borderRadius: 1.5,
                              borderColor: "primary.main",
                              color: "primary.main",
                              "&:hover": { bgcolor: "primary.50" },
                            }}
                          >
                            Renew
                          </Button>
                          <Tooltip title="View Subscription Payment History">
                            <IconButton
                              color="secondary"
                              onClick={() => handleOpenPaymentHistory(ws)}
                              size="small"
                              sx={{ bgcolor: "rgba(124, 58, 237, 0.08)", "&:hover": { bgcolor: "rgba(124, 58, 237, 0.18)" } }}
                            >
                              <ReceiptLongIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Synchronize Default Tests & Templates">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenSyncModal(ws)}
                              size="small"
                            >
                              <SyncIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Workspace">
                            <IconButton color="error" onClick={() => handleDeleteWorkspace(ws.id)} size="small">
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

          {/* Pagination Footer */}
          {totalCount > 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
                gap: 2,
                px: 3,
                py: 2,
                borderTop: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              {/* Left: Range and Total Count */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Showing <strong style={{ color: "#7c3aed" }}>{fromItem}</strong> to{" "}
                  <strong style={{ color: "#7c3aed" }}>{toItem}</strong> of{" "}
                  <strong>{totalCount}</strong> laboratories
                </Typography>
              </Box>

              {/* Right: Controls (Rows Per Page + Go to Page + Navigation << < > >>) */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: { xs: "space-between", sm: "flex-end" },
                  flexWrap: "wrap",
                  gap: 1.5,
                }}
              >
                {/* Rows Per Page Selector */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    Rows:
                  </Typography>
                  <Select
                    size="small"
                    value={limit}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    sx={{
                      height: 32,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      "& .MuiSelect-select": { py: 0.5, px: 1.5 },
                    }}
                  >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                  </Select>
                </Box>

                {/* Go To Page Selector */}
                {totalPages > 1 && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                      Page:
                    </Typography>
                    <Select
                      size="small"
                      value={page}
                      onChange={(e) => handleGoToPage(e.target.value)}
                      sx={{
                        height: 32,
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        "& .MuiSelect-select": { py: 0.5, px: 1.5 },
                      }}
                    >
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <MenuItem key={p} value={p}>
                          {p}
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      of {totalPages}
                    </Typography>
                  </Box>
                )}

                {/* Navigation Buttons */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Tooltip title="First Page">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handlePageChange(1)}
                        disabled={page <= 1}
                        sx={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 1.5, p: 0.5 }}
                      >
                        <FirstPageIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Previous Page">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        sx={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 1.5, p: 0.5 }}
                      >
                        <ChevronLeftIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.4,
                      borderRadius: 1.5,
                      bgcolor: "rgba(124, 58, 237, 0.08)",
                      color: "primary.main",
                      fontWeight: 800,
                      fontSize: "0.82rem",
                    }}
                  >
                    {page} / {totalPages}
                  </Box>
                  <Tooltip title="Next Page">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages}
                        sx={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 1.5, p: 0.5 }}
                      >
                        <ChevronRightIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Last Page">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={page >= totalPages}
                        sx={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 1.5, p: 0.5 }}
                      >
                        <LastPageIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* New Workspace Modal */}
      <Dialog open={workspaceModalOpen} onClose={() => setWorkspaceModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create New Laboratory Workspace</DialogTitle>
        <form onSubmit={handleCreateWorkspace}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            <TextField
              label="Workspace / Lab Name"
              required
              fullWidth
              value={workspaceForm.name}
              onChange={handleWorkspaceNameChange}
              placeholder="e.g. Apollo Diagnostics"
            />
            <TextField
              label="URL Slug"
              required
              fullWidth
              value={workspaceForm.slug}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, slug: e.target.value })}
              helperText="This will be used for subdomain/path routing (e.g. /apollo-diagnostics)"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setWorkspaceModalOpen(false)} color="inherit" disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ fontWeight: 700 }}>
              {submitting ? "Creating..." : "Create Workspace"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Renew Workspace Plan Modal with Payment Tracking */}
      <Dialog open={renewWorkspaceModalOpen} onClose={() => setRenewWorkspaceModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <AutorenewIcon color="primary" />
          Renew Workspace Plan & Record Payment
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          {renewingWorkspace && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "rgba(124, 58, 237, 0.04)", borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary" }}>
                  {renewingWorkspace.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  /{renewingWorkspace.slug} • {renewingWorkspace.admins?.length || 0} Connected Admin(s)
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Current Status:
                  </Typography>
                  {renewingWorkspace.expireAt ? (
                    new Date(renewingWorkspace.expireAt) < new Date() ? (
                      <Chip
                        size="small"
                        label={`Expired on ${new Date(renewingWorkspace.expireAt).toLocaleDateString("en-IN")}`}
                        sx={{ bgcolor: "#fee2e2", color: "#b91c1c", fontWeight: 700, fontSize: "0.7rem", height: 20 }}
                      />
                    ) : (
                      <Chip
                        size="small"
                        label={`Valid till ${new Date(renewingWorkspace.expireAt).toLocaleDateString("en-IN")}`}
                        sx={{ bgcolor: "#f0fdf4", color: "#166534", fontWeight: 700, fontSize: "0.7rem", height: 20 }}
                      />
                    )
                  ) : (
                    <Chip
                      size="small"
                      label="No Expiry Date Set"
                      sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: "0.7rem", height: 20 }}
                    />
                  )}
                </Box>
              </Paper>

              {/* Plan Extension Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}>
                  1. Plan Duration Extension
                </Typography>
                <TextField
                  label="Extend Plan By (Days)"
                  type="number"
                  fullWidth
                  size="small"
                  value={renewDays}
                  onChange={(e) => handleCustomDaysChange(e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  slotProps={{ htmlInput: { min: 1, step: 1 } }}
                  helperText="Default is 30 days. Workspace and all associated admins will be extended."
                  required
                />

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mt: 1.5 }}>
                  {PLAN_PRESETS.map((preset) => (
                    <Chip
                      key={preset.val}
                      label={preset.label}
                      size="small"
                      onClick={() => handleSelectPlanPreset(preset)}
                      color={Number(renewDays) === preset.val ? "primary" : "default"}
                      variant={Number(renewDays) === preset.val ? "filled" : "outlined"}
                      clickable
                      sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Payment & Pricing Details Section */}
              <Box sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2, p: 2, bgcolor: "#fafafa" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: "text.primary", display: "flex", alignItems: "center", gap: 0.8 }}>
                  <RupeeIcon color="primary" fontSize="small" />
                  2. Pricing, Discount & Billing Details
                </Typography>
                
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Standard Plan MRP (₹)"
                      type="number"
                      fullWidth
                      size="small"
                      placeholder="e.g. 499"
                      value={renewOriginalPrice}
                      onChange={(e) => setRenewOriginalPrice(e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      slotProps={{ htmlInput: { min: 0, step: "any" } }}
                      helperText="Standard list / MRP rate"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Final Amount Received (₹)"
                      type="number"
                      fullWidth
                      size="small"
                      placeholder="e.g. 399 (0 for trial)"
                      value={renewAmount}
                      onChange={(e) => setRenewAmount(e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      slotProps={{ htmlInput: { min: 0, step: "any" } }}
                      helperText="Discounted amount paid by subscriber"
                      required
                    />
                  </Grid>

                  {/* Real-time Discount Breakdown Banner */}
                  {(parseFloat(renewOriginalPrice) || 0) > (parseFloat(renewAmount) || 0) && (
                    <Grid size={{ xs: 12 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.2,
                          px: 1.8,
                          bgcolor: "#ecfdf5",
                          borderColor: "#a7f3d0",
                          borderRadius: 2,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ color: "#166534", fontWeight: 700, fontSize: "0.82rem" }}>
                            🎉 Special Discount:
                          </Typography>
                          <Chip
                            label={`-₹${((parseFloat(renewOriginalPrice) || 0) - (parseFloat(renewAmount) || 0)).toLocaleString("en-IN")} (${Math.round((((parseFloat(renewOriginalPrice) || 0) - (parseFloat(renewAmount) || 0)) / (parseFloat(renewOriginalPrice) || 1)) * 100)}% OFF)`}
                            size="small"
                            sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 800, fontSize: "0.72rem" }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: "#166534", fontWeight: 600 }}>
                          MRP: ₹{renewOriginalPrice} → Final Paid: ₹{renewAmount}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Payment Mode</InputLabel>
                      <Select
                        value={renewPaymentMode}
                        label="Payment Mode"
                        onChange={(e) => setRenewPaymentMode(e.target.value)}
                      >
                        <MenuItem value="UPI">UPI / GPay / PhonePe / QR</MenuItem>
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Bank Transfer">Bank Transfer / NEFT / IMPS</MenuItem>
                        <MenuItem value="Card">Credit / Debit Card</MenuItem>
                        <MenuItem value="Cheque">Cheque</MenuItem>
                        <MenuItem value="Free Trial">Free / Complementary</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Transaction Ref / UTR No"
                      fullWidth
                      size="small"
                      placeholder="e.g. UPI/123456789"
                      value={renewReferenceNo}
                      onChange={(e) => setRenewReferenceNo(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Remarks / Notes"
                      fullWidth
                      size="small"
                      placeholder="e.g. 30 Days SaaS Plan Renewal"
                      value={renewNotes}
                      onChange={(e) => setRenewNotes(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>

                {calculateNewWorkspaceExpiry(renewingWorkspace, renewDays) && (
                <Alert
                  severity={
                    renewingWorkspace?.expireAt && new Date(renewingWorkspace.expireAt) > new Date()
                      ? "info"
                      : "success"
                  }
                  sx={{ borderRadius: 2, py: 1 }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {renewingWorkspace?.expireAt && new Date(renewingWorkspace.expireAt) > new Date() ? (
                      <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 600 }}>
                        ⏳ <strong>Active Plan:</strong> Current validity is till{" "}
                        <strong>
                          {new Date(renewingWorkspace.expireAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </strong>
                        . New <strong>+{renewDays || 0} days</strong> will be added on top of current expiry date.
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        ⚡ Plan extension of <strong>+{renewDays || 0} days</strong> will start from today.
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ fontSize: "0.85rem", color: "text.primary" }}>
                      New Expiry Date will be:{" "}
                      <strong style={{ color: "#0f766e" }}>
                        {calculateNewWorkspaceExpiry(renewingWorkspace, renewDays).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </strong>
                    </Typography>
                  </Box>
                </Alert>
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={renewConfirmed}
                    onChange={(e) => setRenewConfirmed(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.82rem", color: "text.primary" }}>
                    I confirm this plan extension and payment entry for this laboratory workspace.
                  </Typography>
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRenewWorkspaceModalOpen(false)} color="inherit" disabled={renewing}>
            Cancel
          </Button>
          <Button
            onClick={handleRenewWorkspaceSubmit}
            variant="contained"
            color="primary"
            disabled={renewing || !renewConfirmed || !renewDays || parseInt(renewDays, 10) <= 0}
            startIcon={renewing ? <CircularProgress size={16} color="inherit" /> : <AutorenewIcon />}
            sx={{ fontWeight: 700 }}
          >
            {renewing ? "Extending..." : "Confirm & Save Renewal"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sync Defaults Confirmation Dialog */}
      <Dialog
        open={syncModalOpen}
        onClose={() => !syncing && setSyncModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <SyncIcon color="primary" />
          Synchronize Workspace Defaults
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          {syncingWorkspace && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "rgba(124, 58, 237, 0.04)", borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary" }}>
                  {syncingWorkspace.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  /{syncingWorkspace.slug} • {syncingWorkspace.admins?.length || 0} Connected Admin(s)
                </Typography>
              </Paper>

              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                  This action will synchronize all <strong>global default tests, parameters, formulas, and category templates</strong> to this workspace. Any missing default tests will be automatically imported.
                </Typography>
              </Alert>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={syncConfirmed}
                    onChange={(e) => setSyncConfirmed(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.82rem", color: "text.primary" }}>
                    I confirm that I want to synchronize system defaults to this workspace.
                  </Typography>
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSyncModalOpen(false)} color="inherit" disabled={syncing}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSyncSubmit}
            variant="contained"
            color="primary"
            disabled={syncing || !syncConfirmed}
            startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
            sx={{ fontWeight: 700 }}
          >
            {syncing ? "Synchronizing..." : "Confirm & Synchronize"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Workspace Payment & Subscription History Drawer */}
      <Drawer
        anchor="right"
        open={paymentDrawerOpen}
        onClose={() => setPaymentDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 540, md: 740, lg: 820 },
            display: "flex",
            flexDirection: "column",
            height: "100%",
            bgcolor: "#f8fafc",
          },
        }}
      >
        {/* Fixed Header */}
        <Box
          sx={{
            p: 2.5,
            px: 3,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: "rgba(124, 58, 237, 0.1)",
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ReceiptLongIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, color: "text.primary" }}>
                Subscription Payments
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                {paymentWorkspace?.name} • <span style={{ color: "#7c3aed" }}>/{paymentWorkspace?.slug}</span>
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setPaymentDrawerOpen(false)}
            size="small"
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              "&:hover": { bgcolor: "grey.100" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Scrollable Body */}
        <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, sm: 3 } }}>
          {/* Total Collected KPI Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 2.5,
              borderRadius: 3,
              bgcolor: "background.paper",
              border: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 8px -2px rgba(0,0,0,0.04)",
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}
              >
                Total SaaS Revenue Collected
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#16a34a", mt: 0.5 }}>
                ₹{totalWorkspacePaid.toLocaleString("en-IN")}
              </Typography>
            </Box>
            <Chip
              label={`${paymentLogs.length} Transaction${paymentLogs.length === 1 ? "" : "s"}`}
              size="small"
              sx={{ bgcolor: "#f1f5f9", color: "#334155", fontWeight: 700, fontSize: "0.75rem", py: 0.5 }}
            />
          </Paper>

          {loadingPayments ? (
            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 10, gap: 1.5 }}>
              <CircularProgress size={36} color="primary" />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Loading subscription transactions…
              </Typography>
            </Box>
          ) : paymentLogs.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                textAlign: "center",
                py: 8,
                px: 3,
                bgcolor: "background.paper",
                borderRadius: 3,
                border: "1px dashed #cbd5e1",
              }}
            >
              <ReceiptLongIcon sx={{ fontSize: 52, color: "text.disabled", mb: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                No subscription payment records found
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, maxWidth: 320, mx: "auto" }}>
                Transactions are recorded automatically whenever a plan is extended or renewed.
              </Typography>
            </Paper>
          ) : (
            <Box>
              {/* Mobile View: Cards (< md) */}
              <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 2 }}>
                {paymentLogs.map((log, index) => (
                  <Paper
                    key={log.id || index}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: "background.paper",
                      borderRadius: 3,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 2px 8px -2px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Top Bar: Amount & Badges */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#16a34a", letterSpacing: "-0.5px" }}>
                          ₹{Number(log.amount).toLocaleString("en-IN")}
                        </Typography>
                        {log.amount === 0 && (
                          <Chip
                            label="Trial / Free"
                            size="small"
                            sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#f1f5f9", color: "#475569" }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.8, alignItems: "center" }}>
                        <Chip
                          label={log.paymentMode || "Cash"}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            bgcolor:
                              log.paymentMode === "UPI"
                                ? "rgba(124, 58, 237, 0.08)"
                                : log.paymentMode === "Bank Transfer"
                                ? "rgba(37, 99, 235, 0.08)"
                                : log.paymentMode === "Cash"
                                ? "rgba(22, 163, 74, 0.08)"
                                : "#f1f5f9",
                            color:
                              log.paymentMode === "UPI"
                                ? "#7c3aed"
                                : log.paymentMode === "Bank Transfer"
                                ? "#2563eb"
                                : log.paymentMode === "Cash"
                                ? "#16a34a"
                                : "#334155",
                          }}
                        />
                        <Chip
                          label={`+${log.days} Days`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            bgcolor: "#f0fdf4",
                            color: "#166534",
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Transaction Details Grid */}
                    <Box sx={{ bgcolor: "#f8fafc", p: 1.5, borderRadius: 2, mb: 1.5 }}>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", fontSize: "0.72rem" }}>
                            Payment Date
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.82rem", color: "text.primary" }}>
                            {new Date(log.paidAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", fontSize: "0.72rem" }}>
                            Ref / UTR No.
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.82rem", color: "text.primary", wordBreak: "break-all" }}>
                            {log.referenceNo || "—"}
                          </Typography>
                        </Grid>

                        {log.expireAt && (
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", fontSize: "0.72rem" }}>
                              Plan Valid Until
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#7c3aed" }}>
                              {new Date(log.expireAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>

                    {/* Notes / Remarks */}
                    {log.notes && log.notes !== "—" && (
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.8, px: 0.5, mb: 1 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem" }}>
                          Note:
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem", fontStyle: "italic" }}>
                          {log.notes}
                        </Typography>
                      </Box>
                    )}

                    {/* Download Bill Action */}
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      startIcon={<ReceiptLongIcon fontSize="small" />}
                      onClick={() => window.open(`/api/print-subscription-invoice/${log.uid || log.id}`, "_blank")}
                      sx={{
                        mt: 1,
                        py: 0.6,
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: 2,
                        borderColor: "rgba(124, 58, 237, 0.4)",
                        color: "#7c3aed",
                        "&:hover": {
                          bgcolor: "rgba(124, 58, 237, 0.08)",
                          borderColor: "#7c3aed",
                        },
                      }}
                    >
                      Download Bill (PDF)
                    </Button>
                  </Paper>
                ))}
              </Box>

              {/* Desktop View: Table (>= md) */}
              <TableContainer
                component={Paper}
                elevation={0}
                variant="outlined"
                sx={{ display: { xs: "none", md: "block" }, borderRadius: 2.5, bgcolor: "background.paper", overflowX: "auto" }}
              >
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 45 }} align="center">
                        #
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Payment Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Amount
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Duration
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Ref / UTR No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Valid Until</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Invoice
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentLogs.map((log, index) => (
                      <TableRow key={log.id || index} hover>
                        <TableCell align="center" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.75rem" }}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                          {new Date(log.paidAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#16a34a", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                          ₹{Number(log.amount).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`+${log.days}d`}
                            size="small"
                            sx={{ height: 20, fontSize: "0.68rem", fontWeight: 800, bgcolor: "#f0fdf4", color: "#166534" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.paymentMode || "Cash"}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              bgcolor:
                                log.paymentMode === "UPI"
                                  ? "rgba(124, 58, 237, 0.08)"
                                  : log.paymentMode === "Bank Transfer"
                                  ? "rgba(37, 99, 235, 0.08)"
                                  : log.paymentMode === "Cash"
                                  ? "rgba(22, 163, 74, 0.08)"
                                  : "#f1f5f9",
                              color:
                                log.paymentMode === "UPI"
                                  ? "#7c3aed"
                                  : log.paymentMode === "Bank Transfer"
                                  ? "#2563eb"
                                  : log.paymentMode === "Cash"
                                  ? "#16a34a"
                                  : "#334155",
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", color: "text.secondary", maxWidth: 130, wordBreak: "break-all" }}>
                          {log.referenceNo || "—"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#7c3aed", whiteSpace: "nowrap" }}>
                          {log.expireAt
                            ? new Date(log.expireAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", color: "text.secondary", maxWidth: 140 }}>
                          {log.notes || "—"}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ReceiptLongIcon sx={{ fontSize: "14px !important" }} />}
                            onClick={() => window.open(`/api/print-subscription-invoice/${log.uid || log.id}`, "_blank")}
                            sx={{
                              py: 0.3,
                              px: 1,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              textTransform: "none",
                              borderRadius: 1.5,
                              whiteSpace: "nowrap",
                              borderColor: "rgba(124, 58, 237, 0.4)",
                              color: "#7c3aed",
                              "&:hover": {
                                bgcolor: "rgba(124, 58, 237, 0.08)",
                                borderColor: "#7c3aed",
                              },
                            }}
                          >
                            Download Bill
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>

        {/* Fixed Footer with Quick Action */}
        <Box
          sx={{
            p: 2,
            px: 3,
            bgcolor: "background.paper",
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setPaymentDrawerOpen(false)}
            size="small"
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Close
          </Button>

          {paymentWorkspace && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AutorenewIcon />}
              onClick={() => {
                setPaymentDrawerOpen(false);
                handleOpenRenewWorkspace(paymentWorkspace);
              }}
              sx={{ fontWeight: 700, borderRadius: 2, px: 2 }}
            >
              Renew Workspace Plan
            </Button>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}

export default function WorkspaceControllerPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress color="primary" />
        </Box>
      }
    >
      <WorkspaceControllerContent />
    </Suspense>
  );
}
