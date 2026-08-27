"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import {
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon,
  ContentCopy as ContentCopyIcon,
  Business as WorkspaceIcon,
  Speed as SpeedIcon,
  DataUsage as TokenIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  ArrowForward as ArrowForwardIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { toast } from "sonner";

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function SuperAdminAiUsagePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Filters state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedWorkspace, setSelectedWorkspace] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedModel, setSelectedModel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [daysFilter, setDaysFilter] = useState(30);

  // Modal inspector state
  const [selectedLog, setSelectedLog] = useState(null);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [inspectTab, setInspectTab] = useState(0);

  // Active view tab
  const [viewTab, setViewTab] = useState(0);

  const fetchAiData = useCallback(async (customPage = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(customPage),
        limit: String(limit),
        days: String(daysFilter),
      });

      if (selectedWorkspace && selectedWorkspace !== "all") {
        params.append("workspaceId", selectedWorkspace);
      }
      if (selectedStatus && selectedStatus !== "all") {
        params.append("status", selectedStatus);
      }
      if (selectedModel && selectedModel !== "all") {
        params.append("model", selectedModel);
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const res = await fetch(`/adminstration/api/ai-usage?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.error || "Failed to load Gemini AI usage data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to AI usage API");
    } finally {
      setLoading(false);
    }
  }, [page, limit, daysFilter, selectedWorkspace, selectedStatus, selectedModel, searchQuery]);

  useEffect(() => {
    fetchAiData(1);
  }, [selectedWorkspace, selectedStatus, selectedModel, daysFilter, limit]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchAiData(newPage);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAiData(1);
  };

  const handleClearFilters = () => {
    setSelectedWorkspace("all");
    setSelectedStatus("all");
    setSelectedModel("all");
    setSearchQuery("");
    setDaysFilter(30);
    setPage(1);
  };

  const copyToClipboard = (text, label = "Text") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const kpis = data?.kpis || {
    totalCalls: 0,
    successCalls: 0,
    failedCalls: 0,
    successRate: 0,
    callsToday: 0,
    callsThisMonth: 0,
    totalPromptTokens: 0,
    totalCandidateTokens: 0,
    totalTokens: 0,
    activeWorkspacesCount: 0,
    avgLatencyMs: 0,
  };

  const leaderboard = data?.workspacesLeaderboard || [];
  const dailyTrend = data?.dailyTrend || [];
  const modelDistribution = data?.modelDistribution || [];
  const logs = data?.logs || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header Banner */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          pb: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 44,
                height: 44,
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 24, color: "#fff" }} />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: "-0.5px" }}>
              Gemini AI Usage & Workspace History
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", ml: { xs: 0, sm: 7.2 } }}>
            Real-time audit log, token consumption metrics, and workspace AI hit analytics
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={daysFilter}
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              sx={{ bgcolor: "background.paper", borderRadius: 2 }}
            >
              <MenuItem value={7}>Last 7 Days</MenuItem>
              <MenuItem value={14}>Last 14 Days</MenuItem>
              <MenuItem value={30}>Last 30 Days</MenuItem>
              <MenuItem value={60}>Last 60 Days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={() => fetchAiData(page)}
            disabled={loading}
            sx={{ px: 2.5, py: 1, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Top 5 KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Card 1: Total Calls & Success Rate */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              color: "#fff",
              borderRadius: 3,
              boxShadow: "0 8px 24px rgba(124, 58, 237, 0.25)",
              p: 2.5,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, opacity: 0.9 }}>
                Total Gemini Hits
              </Typography>
              <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", width: 36, height: 36 }}>
                <AutoAwesomeIcon sx={{ fontSize: 20, color: "#fff" }} />
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              {kpis.totalCalls.toLocaleString()}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={`${kpis.successRate}% Success`}
                size="small"
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              />
              {kpis.failedCalls > 0 && (
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  ({kpis.failedCalls} failed)
                </Typography>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Card 2: Total Tokens */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "background.paper",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              p: 2.5,
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                Total Tokens Used
              </Typography>
              <Avatar sx={{ bgcolor: "rgba(59, 130, 246, 0.1)", width: 36, height: 36 }}>
                <TokenIcon sx={{ fontSize: 20, color: "#3b82f6" }} />
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}>
              {kpis.totalTokens > 1000000
                ? `${(kpis.totalTokens / 1000000).toFixed(2)}M`
                : kpis.totalTokens > 1000
                ? `${(kpis.totalTokens / 1000).toFixed(1)}k`
                : kpis.totalTokens.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              Prompt: {kpis.totalPromptTokens.toLocaleString()} | Resp: {kpis.totalCandidateTokens.toLocaleString()}
            </Typography>
          </Card>
        </Grid>

        {/* Card 3: Today & Month Volume */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "background.paper",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              p: 2.5,
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                Live Hit Volume
              </Typography>
              <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.1)", width: 36, height: 36 }}>
                <CalendarIcon sx={{ fontSize: 20, color: "#10b981" }} />
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#10b981", mb: 1 }}>
              {kpis.callsToday.toLocaleString()}{" "}
              <Typography component="span" variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                today
              </Typography>
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              This Month: <b>{kpis.callsThisMonth.toLocaleString()} calls</b>
            </Typography>
          </Card>
        </Grid>

        {/* Card 4: Active AI Labs */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "background.paper",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              p: 2.5,
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                AI Enabled Labs
              </Typography>
              <Avatar sx={{ bgcolor: "rgba(245, 158, 11, 0.1)", width: 36, height: 36 }}>
                <WorkspaceIcon sx={{ fontSize: 20, color: "#f59e0b" }} />
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}>
              {kpis.activeWorkspacesCount}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Workspaces actively generating AI summaries
            </Typography>
          </Card>
        </Grid>

        {/* Card 5: Average Latency */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "background.paper",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              p: 2.5,
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                Avg Latency
              </Typography>
              <Avatar sx={{ bgcolor: "rgba(139, 92, 246, 0.1)", width: 36, height: 36 }}>
                <SpeedIcon sx={{ fontSize: 20, color: "#8b5cf6" }} />
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}>
              {kpis.avgLatencyMs ? `${kpis.avgLatencyMs} ms` : "—"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Average response time per Gemini call
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs (Overview Charts, Workspace Breakdown, Detailed Audit Logs) */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={viewTab}
          onChange={(_, newVal) => setViewTab(newVal)}
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: "0.95rem", minHeight: 48 },
          }}
        >
          <Tab label="Analytics & Trends" icon={<AutoAwesomeIcon fontSize="small" />} iconPosition="start" />
          <Tab
            label={`Workspaces Leaderboard (${leaderboard.length})`}
            icon={<WorkspaceIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            label={`Detailed API History Logs (${pagination.total})`}
            icon={<FilterIcon fontSize="small" />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* TAB 0: Visual Analytics & Trends */}
      {viewTab === 0 && (
        <Grid container spacing={3}>
          {/* Daily Trend Chart */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                    Daily Gemini AI Hit Trends
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Daily API call volume and success vs failed attempts
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, bgcolor: "#7c3aed", borderRadius: "50%" }} />
                    <Typography variant="caption">Successful Calls</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, bgcolor: "#ef4444", borderRadius: "50%" }} />
                    <Typography variant="caption">Failed</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ width: "100%", height: 320 }}>
                {dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="aiSuccessGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="aiFailGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          borderRadius: 8,
                          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                          border: "none",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="success"
                        name="Success"
                        stroke="#7c3aed"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#aiSuccessGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="failed"
                        name="Failed"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#aiFailGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      No AI call trend data available for selected period.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Model & Distribution Pie / Donut Chart */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 16px rgba(0,0,0,0.04)", height: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
                AI Model Distribution
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
                Hits grouped by Google Gemini model version
              </Typography>

              <Box sx={{ width: "100%", height: 260 }}>
                {modelDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={modelDistribution}
                        dataKey="count"
                        nameKey="model"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        {modelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      No model data available
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {modelDistribution.map((m, idx) => (
                  <Box key={m.model} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: COLORS[idx % COLORS.length] }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {m.model}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 700 }}>
                      {m.count} hits ({m.tokens.toLocaleString()} tokens)
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: Workspaces AI Leaderboard Table */}
      {viewTab === 1 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                Workspace AI Usage Leaderboard
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Detailed breakdown of Gemini AI usage per laboratory workspace
              </Typography>
            </Box>
            <Chip
              label={`${leaderboard.filter((w) => w.totalCalls > 0).length} Active AI Labs`}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "rgba(124, 58, 237, 0.04)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Workspace Name & Slug</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total AI Hits</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Success / Failed</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Success Rate</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Tokens</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Today Hits</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Last AI Activity</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        No workspaces found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  leaderboard.map((ws) => {
                    const rate = ws.totalCalls > 0 ? ((ws.successCalls / ws.totalCalls) * 100).toFixed(0) : "0";
                    return (
                      <TableRow
                        key={ws.id}
                        hover
                        sx={{
                          bgcolor: ws.totalCalls > 0 ? "inherit" : "rgba(0,0,0,0.01)",
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                bgcolor: ws.totalCalls > 0 ? "primary.main" : "grey.400",
                                width: 34,
                                height: 34,
                                fontSize: "0.85rem",
                                fontWeight: 700,
                              }}
                            >
                              {ws.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                                {ws.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                slug: {ws.slug}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {ws.totalCalls.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Chip
                              label={`${ws.successCalls} ok`}
                              size="small"
                              sx={{ bgcolor: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontWeight: 700, height: 22 }}
                            />
                            {ws.failedCalls > 0 && (
                              <Chip
                                label={`${ws.failedCalls} err`}
                                size="small"
                                sx={{ bgcolor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontWeight: 700, height: 22 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: 110 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Number(rate)}
                              sx={{
                                flexGrow: 1,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: "rgba(0,0,0,0.06)",
                                "& .MuiLinearProgress-bar": {
                                  bgcolor: Number(rate) >= 90 ? "#10b981" : Number(rate) >= 70 ? "#f59e0b" : "#ef4444",
                                },
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                              {rate}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                            {ws.totalTokens.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {ws.todayCalls > 0 ? (
                            <Chip
                              label={`${ws.todayCalls} today`}
                              size="small"
                              color="success"
                              sx={{ fontWeight: 700, height: 22 }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: "text.disabled" }}>
                              0
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {ws.lastUsed ? new Date(ws.lastUsed).toLocaleString("en-IN") : "Never"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSelectedWorkspace(String(ws.id));
                              setViewTab(2);
                            }}
                            sx={{ textTransform: "none", borderRadius: 1.5, py: 0.5, px: 1.5, fontSize: "0.75rem" }}
                          >
                            View Logs
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 2: Detailed History Audit Logs */}
      {viewTab === 2 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          {/* Search & Filter Bar */}
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              p: 2.5,
              bgcolor: "rgba(124, 58, 237, 0.02)",
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "center",
            }}
          >
            {/* Search query input */}
            <TextField
              size="small"
              placeholder="Search prompt, response, patient, admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 260 }, bgcolor: "background.paper", borderRadius: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            {/* Workspace dropdown */}
            <FormControl size="small" sx={{ minWidth: 180, bgcolor: "background.paper", borderRadius: 2 }}>
              <InputLabel>Workspace</InputLabel>
              <Select
                value={selectedWorkspace}
                label="Workspace"
                onChange={(e) => setSelectedWorkspace(e.target.value)}
              >
                <MenuItem value="all">All Workspaces</MenuItem>
                {leaderboard.map((ws) => (
                  <MenuItem key={ws.id} value={String(ws.id)}>
                    {ws.name} ({ws.totalCalls} hits)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Status dropdown */}
            <FormControl size="small" sx={{ minWidth: 130, bgcolor: "background.paper", borderRadius: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select value={selectedStatus} label="Status" onChange={(e) => setSelectedStatus(e.target.value)}>
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="SUCCESS">Success Only</MenuItem>
                <MenuItem value="FAILED">Failed Only</MenuItem>
              </Select>
            </FormControl>

            {/* Model dropdown */}
            <FormControl size="small" sx={{ minWidth: 170, bgcolor: "background.paper", borderRadius: 2 }}>
              <InputLabel>Model</InputLabel>
              <Select value={selectedModel} label="Model" onChange={(e) => setSelectedModel(e.target.value)}>
                <MenuItem value="all">All Models</MenuItem>
                <MenuItem value="gemini-3.5-flash-lite">gemini-3.5-flash-lite</MenuItem>
                <MenuItem value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</MenuItem>
              </Select>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<FilterIcon />}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 2 }}
            >
              Filter
            </Button>

            {(selectedWorkspace !== "all" || selectedStatus !== "all" || selectedModel !== "all" || searchQuery) && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClearFilters}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                Clear Filters
              </Button>
            )}
          </Box>

          {/* Logs Table */}
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "rgba(124, 58, 237, 0.04)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Workspace</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Triggered By</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Feature / Patient</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Model Used</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tokens</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Latency</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Inspect
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} color="primary" />
                      <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                        Loading Gemini AI call logs...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "text.secondary" }}>
                        No Gemini AI calls found matching criteria
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.disabled" }}>
                        Calls triggered during Test Report result entries will appear here automatically.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const isSuccess = log.status === "SUCCESS";
                    return (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {new Date(log.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                            {log.workspaceName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {log.workspaceSlug}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {log.adminName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {log.adminEmail}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.feature === "RESULT_SUGGESTION" ? "Result Remarks" : log.feature}
                            size="small"
                            sx={{
                              bgcolor: "rgba(124, 58, 237, 0.1)",
                              color: "primary.main",
                              fontWeight: 700,
                              height: 22,
                              mb: 0.5,
                            }}
                          />
                          {log.registration && (
                            <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                              Lab ID: <b>{log.registration.labId}</b> ({log.registration.patientName})
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.model}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.75rem", fontWeight: 600, height: 22 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {log.totalTokens}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            in: {log.promptTokens} | out: {log.candidateTokens}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {log.durationMs ? `${log.durationMs}ms` : "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {isSuccess ? (
                            <Chip
                              icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
                              label="Success"
                              size="small"
                              sx={{
                                bgcolor: "rgba(16, 185, 129, 0.12)",
                                color: "#10b981",
                                fontWeight: 700,
                                height: 24,
                              }}
                            />
                          ) : (
                            <Tooltip title={log.errorMessage || "Error"} arrow>
                              <Chip
                                icon={<ErrorIcon sx={{ fontSize: "14px !important" }} />}
                                label="Failed"
                                size="small"
                                sx={{
                                  bgcolor: "rgba(239, 68, 68, 0.12)",
                                  color: "#ef4444",
                                  fontWeight: 700,
                                  height: 24,
                                }}
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Inspect Prompt & AI Output">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedLog(log);
                                setInspectTab(0);
                                setInspectOpen(true);
                              }}
                              sx={{ bgcolor: "rgba(124, 58, 237, 0.08)" }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Showing {logs.length} of {pagination.total} records (Page {pagination.page} of {pagination.totalPages})
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={pagination.page <= 1 || loading}
                onClick={() => handlePageChange(pagination.page - 1)}
                sx={{ borderRadius: 1.5, textTransform: "none" }}
              >
                Previous
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => handlePageChange(pagination.page + 1)}
                sx={{ borderRadius: 1.5, textTransform: "none" }}
              >
                Next
              </Button>
            </Box>
          </Box>
        </Card>
      )}

      {/* Inspect Prompt & Response Dialog */}
      <Dialog
        open={inspectOpen}
        onClose={() => setInspectOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Gemini AI Call Inspector #{selectedLog?.id}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setInspectOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          {selectedLog && (
            <Box>
              {/* Context Summary Bar */}
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    Workspace
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedLog.workspaceName}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    Model
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedLog.model}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    Tokens & Latency
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedLog.totalTokens} tokens ({selectedLog.durationMs || 0}ms)
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedLog.status}
                    size="small"
                    color={selectedLog.status === "SUCCESS" ? "success" : "error"}
                    sx={{ fontWeight: 700, height: 22 }}
                  />
                </Grid>
              </Grid>

              {/* Tabs inside modal */}
              <Tabs
                value={inspectTab}
                onChange={(_, newVal) => setInspectTab(newVal)}
                sx={{ mb: 2, borderBottom: "1px solid", borderColor: "divider" }}
              >
                <Tab label="AI Generated Output" sx={{ textTransform: "none", fontWeight: 700 }} />
                <Tab label="Input Prompt" sx={{ textTransform: "none", fontWeight: 700 }} />
                {selectedLog.errorMessage && (
                  <Tab label="Error Details" sx={{ textTransform: "none", fontWeight: 700, color: "error.main" }} />
                )}
                <Tab label="Metadata & Patient Context" sx={{ textTransform: "none", fontWeight: 700 }} />
              </Tabs>

              {/* Tab 0: AI Output */}
              {inspectTab === 0 && (
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Generated Response / Clinical Summary:
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<ContentCopyIcon fontSize="small" />}
                      onClick={() => copyToClipboard(selectedLog.response, "AI Response")}
                      sx={{ textTransform: "none" }}
                    >
                      Copy Response
                    </Button>
                  </Box>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "rgba(124, 58, 237, 0.04)",
                      border: "1px solid",
                      borderColor: "rgba(124, 58, 237, 0.15)",
                      borderRadius: 2,
                      whiteSpace: "pre-wrap",
                      fontFamily: "inherit",
                      fontSize: "0.9rem",
                      lineHeight: 1.6,
                      color: "text.primary",
                      maxHeight: "350px",
                      overflowY: "auto",
                    }}
                  >
                    {selectedLog.response || (
                      <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                        No response was generated (Request failed).
                      </Typography>
                    )}
                  </Paper>
                </Box>
              )}

              {/* Tab 1: Input Prompt */}
              {inspectTab === 1 && (
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Full Prompt Sent to Gemini:
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<ContentCopyIcon fontSize="small" />}
                      onClick={() => copyToClipboard(selectedLog.prompt, "Input Prompt")}
                      sx={{ textTransform: "none" }}
                    >
                      Copy Prompt
                    </Button>
                  </Box>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "#1e1e2f",
                      color: "#a9b7c6",
                      borderRadius: 2,
                      fontFamily: "monospace",
                      fontSize: "0.82rem",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.5,
                      maxHeight: "350px",
                      overflowY: "auto",
                    }}
                  >
                    {selectedLog.prompt}
                  </Paper>
                </Box>
              )}

              {/* Tab 2: Error Details (if failed) */}
              {inspectTab === 2 && selectedLog.errorMessage && (
                <Box>
                  <Alert severity="error" sx={{ mb: 2, fontWeight: 600 }}>
                    {selectedLog.errorMessage}
                  </Alert>
                </Box>
              )}

              {/* Tab 3: Metadata & Patient Context */}
              {inspectTab === (selectedLog.errorMessage ? 3 : 2) && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Execution Breakdown
                    </Typography>
                    <Typography variant="body2">
                      • <b>Created At:</b> {new Date(selectedLog.createdAt).toLocaleString("en-IN")}
                    </Typography>
                    <Typography variant="body2">
                      • <b>Latency:</b> {selectedLog.durationMs || 0} milliseconds
                    </Typography>
                    <Typography variant="body2">
                      • <b>Prompt Tokens:</b> {selectedLog.promptTokens}
                    </Typography>
                    <Typography variant="body2">
                      • <b>Candidate (Output) Tokens:</b> {selectedLog.candidateTokens}
                    </Typography>
                    <Typography variant="body2">
                      • <b>Total Tokens:</b> {selectedLog.totalTokens}
                    </Typography>
                    <Typography variant="body2">
                      • <b>Client IP:</b> {selectedLog.ipAddress || "N/A"}
                    </Typography>
                  </Paper>

                  {selectedLog.registration && (
                    <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Linked Patient Test Registration
                      </Typography>
                      <Typography variant="body2">
                        • <b>Lab ID:</b> {selectedLog.registration.labId}
                      </Typography>
                      <Typography variant="body2">
                        • <b>Patient Name:</b> {selectedLog.registration.patientName}
                      </Typography>
                      <Typography variant="body2">
                        • <b>Reg No:</b> {selectedLog.registration.regNo}
                      </Typography>
                      <Typography variant="body2">
                        • <b>Age & Gender:</b> {selectedLog.registration.age} Yrs / {selectedLog.registration.gender}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setInspectOpen(false)} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
