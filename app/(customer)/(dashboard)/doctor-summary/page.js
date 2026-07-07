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
  CircularProgress
} from "@mui/material";
import {
  Print as PrintIcon,
  Search as SearchIcon,
  RestartAlt as ResetIcon
} from "@mui/icons-material";
// Action import removed

export default function DoctorSummaryPage() {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    // Default to the start of current month
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    return startOfMonth.toISOString().substring(0, 10);
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));

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
    const d = new Date();
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    setStartDate(startOfMonth.toISOString().substring(0, 10));
    setEndDate(new Date().toISOString().substring(0, 10));
    setTimeout(() => loadData(), 50);
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

  // Sum calculations
  const totalCount = summaryData.reduce((sum, item) => sum + item.count, 0);
  const totalAmount = summaryData.reduce((sum, item) => sum + item.amount, 0);
  const totalDiscount = summaryData.reduce((sum, item) => sum + item.discount, 0);
  const totalNetAmount = summaryData.reduce((sum, item) => sum + item.netAmount, 0);
  const totalIncentive = summaryData.reduce((sum, item) => sum + item.incentiveAmount, 0);
  const totalCollection = summaryData.reduce((sum, item) => sum + item.collection, 0);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header section with print utilities */}
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
          Doctor Referral Summary (Ref Summary)
        </Typography>

        <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={() => window.print()}>
          Print Summary
        </Button>
      </Box>

      {/* Date Filter Toolbar Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", gap: 1 }}>
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

      {/* Date range descriptor */}
      <Box sx={{ bgcolor: "#d1fae5", p: 1.5, borderRadius: "6px 6px 0 0", border: "1px solid #a7f3d0", borderBottom: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#065f46" }}>
          Ref Summary from {formatDate(startDate)} to {formatDate(endDate)}
        </Typography>
      </Box>

      {/* Doctor Summary Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "0 0 4px 4px" }}>
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 8, gap: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Loading summary reports...
            </Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead sx={{ bgcolor: "#e2e8f0" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>SNO</TableCell>
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
                  <TableCell colSpan={11} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No referral activities found in this date range.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {summaryData.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        "&:hover": { bgcolor: "rgba(16, 185, 129, 0.04)" }
                      }}
                    >
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>{item.name}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.lastPaid ? formatDate(item.lastPaid) : "-"}</TableCell>
                      <TableCell align="right">{item.incentivePercent}%</TableCell>
                      <TableCell align="right">{item.count}</TableCell>
                      <TableCell align="right">₹{item.amount.toFixed(2)}</TableCell>
                      <TableCell align="right">₹{item.discount.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>₹{item.netAmount.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ color: "primary.dark", fontWeight: 500 }}>₹{item.incentiveAmount.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ color: "success.main", fontWeight: 500 }}>
                        {item.collection > 0 ? `₹${item.collection.toFixed(2)}` : "0.00"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow sx={{ bgcolor: "#f1f5f9", "& td": { fontWeight: 800 } }}>
                    <TableCell colSpan={4}>Total</TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">{totalCount}</TableCell>
                    <TableCell align="right">₹{totalAmount.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{totalDiscount.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{totalNetAmount.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{totalIncentive.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: "success.main" }}>₹{totalCollection.toFixed(2)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
}
