"use client";

import React, { useState, useEffect } from "react";
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
  Tooltip,
} from "@mui/material";
import {
  ReceiptLong as ReceiptLongIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  CloudDone as CloudDoneIcon,
  CurrencyRupee as RupeeIcon,
  CalendarMonth as CalendarIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { toast } from "sonner";

export default function PaymentsClient() {
  const [payments, setPayments] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings/payments").then((r) => r.json());
        if (res.success) {
          setPayments(res.payments || []);
          setWorkspace(res.workspace || null);
          setTotalPaid(res.totalPaid || 0);
        } else {
          toast.error(res.error || "Failed to load subscription history.");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred while loading subscription data.");
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  const calculateRemainingDays = (expireAt) => {
    if (!expireAt) return null;
    const now = new Date();
    const expiry = new Date(expireAt);
    const diffMs = expiry.getTime() - now.getTime();
    if (diffMs <= 0) return { days: 0, expired: true };
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { days, expired: false };
  };

  const planStatus = workspace?.expireAt
    ? calculateRemainingDays(workspace.expireAt)
    : null;

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
          gap: 2,
        }}
      >
        <CircularProgress size={45} color="primary" />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Loading subscription payment records…
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Top Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ReceiptLongIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
              Subscription & Payment Invoices
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View your cloud plan status, payment history, and download official SaaS Tax Invoices.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* KPI Overview Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Card 1: Plan Status */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              p: 2.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              bgcolor: "background.paper",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px -2px rgba(0,0,0,0.04)",
            }}
          >
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Active Cloud License
                </Typography>
                {planStatus?.expired ? (
                  <Chip
                    icon={<WarningIcon sx={{ fontSize: "14px !important" }} />}
                    label="Plan Expired"
                    size="small"
                    color="error"
                    sx={{ fontWeight: 800, fontSize: "0.72rem" }}
                  />
                ) : (
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
                    label="Active Plan"
                    size="small"
                    color="success"
                    sx={{ fontWeight: 800, fontSize: "0.72rem" }}
                  />
                )}
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary", mt: 0.5 }}>
                {workspace?.expireAt
                  ? new Date(workspace.expireAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "No Expiry Limit"}
              </Typography>
            </Box>

            <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarIcon sx={{ fontSize: 18, color: "primary.main" }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: planStatus?.expired ? "error.main" : "primary.main" }}>
                {planStatus?.expired
                  ? "License expired. Please renew to continue access."
                  : planStatus
                  ? `${planStatus.days} days remaining in current billing cycle`
                  : "Continuous access enabled"}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

        {/* Payment Transactions Table */}
        <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Box
            sx={{
              p: 2.5,
              px: 3,
              bgcolor: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
                Billing & Tax Invoices History
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Official computer-generated Tax Invoices for all your plan renewals.
              </Typography>
            </Box>
          </Box>

          {payments.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8, px: 3 }}>
              <ReceiptLongIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                No payment transactions found
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, maxWidth: 360, mx: "auto" }}>
                When your account plan is renewed or extended, official billing invoices will automatically appear here.
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Mobile View (< md) */}
              <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 2, p: 2 }}>
                {payments.map((log, index) => (
                  <Paper
                    key={log.id || index}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: "background.paper",
                      borderRadius: 2.5,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 2px 6px -2px rgba(0,0,0,0.04)",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "#16a34a" }}>
                        ₹{Number(log.amount).toLocaleString("en-IN")}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 0.8 }}>
                        <Chip
                          label={log.paymentMode || "UPI"}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            bgcolor: "rgba(15, 118, 110, 0.08)",
                            color: "primary.main",
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

                    <Box sx={{ bgcolor: "#f8fafc", p: 1.5, borderRadius: 2, mb: 1.5 }}>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>
                            Payment Date
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {new Date(log.paidAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>
                            Ref / UTR
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: "break-all" }}>
                            {log.referenceNo || "—"}
                          </Typography>
                        </Grid>
                        {log.expireAt && (
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>
                              Plan Valid Until
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
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

                    {log.notes && log.notes !== "—" && (
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontStyle: "italic", mb: 1.5 }}>
                        Note: {log.notes}
                      </Typography>
                    )}

                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      fullWidth
                      startIcon={<DownloadIcon fontSize="small" />}
                      onClick={() => window.open(`/api/print-subscription-invoice/${log.uid || log.id}`, "_blank")}
                      sx={{
                        py: 0.8,
                        fontWeight: 700,
                        borderRadius: 2,
                      }}
                    >
                      Download Tax Invoice (PDF)
                    </Button>
                  </Paper>
                ))}
              </Box>

              {/* Desktop Table View (>= md) */}
              <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
                <Table>
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 50 }} align="center">
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
                      <TableCell sx={{ fontWeight: 700 }}>Ref / UTR No.</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Plan Valid Until</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Tax Invoice
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((log, index) => (
                      <TableRow key={log.id || index} hover>
                        <TableCell align="center" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.78rem" }}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                          {new Date(log.paidAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#16a34a", fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                          ₹{Number(log.amount).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`+${log.days}d`}
                            size="small"
                            sx={{ height: 22, fontSize: "0.72rem", fontWeight: 800, bgcolor: "#f0fdf4", color: "#166534" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.paymentMode || "UPI"}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              bgcolor:
                                log.paymentMode === "UPI"
                                  ? "rgba(15, 118, 110, 0.08)"
                                  : log.paymentMode === "Bank Transfer"
                                    ? "rgba(37, 99, 235, 0.08)"
                                    : log.paymentMode === "Cash"
                                      ? "rgba(22, 163, 74, 0.08)"
                                      : "#f1f5f9",
                              color:
                                log.paymentMode === "UPI"
                                  ? "primary.main"
                                  : log.paymentMode === "Bank Transfer"
                                    ? "#2563eb"
                                    : log.paymentMode === "Cash"
                                      ? "#16a34a"
                                      : "#334155",
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.82rem", color: "text.secondary", maxWidth: 140, wordBreak: "break-all" }}>
                          {log.referenceNo || "—"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.82rem", fontWeight: 600, color: "primary.main", whiteSpace: "nowrap" }}>
                          {log.expireAt
                            ? new Date(log.expireAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                            : "—"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", color: "text.secondary", maxWidth: 160 }}>
                          {log.notes || "—"}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Download Official SaaS Tax Invoice PDF">
                            <Button
                              variant="outlined"
                              size="small"
                              color="primary"
                              startIcon={<ReceiptLongIcon fontSize="small" />}
                              onClick={() => window.open(`/api/print-subscription-invoice/${log.uid || log.id}`, "_blank")}
                              sx={{
                                py: 0.4,
                                px: 1.5,
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                textTransform: "none",
                                borderRadius: 1.5,
                                whiteSpace: "nowrap",
                              }}
                            >
                              Download Bill
                            </Button>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Card>
    </Box>
  );
}
