"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
  Dialog,
  MenuItem,
  Stack,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  ExpandMore as ExpandMoreIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  MedicalServices as TestIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from "@mui/icons-material";

export default function MoneyReciptMobile({
  open,
  onClose,
  loadingReceipt,
  selectedRegistration,
  receivedInput,
  handleReceivedAmountChange,
  discountInput,
  handleDiscountAmountChange,
  discountPercentInput,
  handleDiscountPercentChange,
  paymentModeInput,
  setPaymentModeInput,
  paymentRefNoInput,
  setPaymentRefNoInput,
  remarkInput,
  setRemarkInput,
  savingPayment,
  handleSavePayment,
  sendSms,
  setSendSms,
  sendMail,
  setSendMail,
  handlePrintReceipt,
  canWrite
}) {
  const [activeTab, setActiveTab] = useState("billing"); // 'billing' | 'tests' | 'history'

  if (!open) return null;

  const totalBill = selectedRegistration
    ? parseFloat(selectedRegistration.totalAmount || 0) + parseFloat(selectedRegistration.collectionCharge || 0)
    : 0;
  const currentDiscount = parseFloat(discountInput) || 0;
  const netBill = Math.max(0, totalBill - currentDiscount);
  const alreadyPaid = selectedRegistration ? parseFloat(selectedRegistration.receivedAmount || 0) : 0;
  const remainingDue = Math.max(0, netBill - alreadyPaid);
  const currentEntered = parseFloat(receivedInput) || 0;
  const finalDueAfterPayment = Math.max(0, remainingDue - currentEntered);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: "#f8fafc",
          width: "100vw",
          height: "100vh",
          m: 0,
          p: 0,
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden"
        }
      }}
    >
      {/* ── TOP STICKY HEADER ── */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          position: "sticky",
          top: 0,
          zIndex: 1100
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ReceiptIcon fontSize="small" sx={{ opacity: 0.9 }} />
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                fontSize: "0.95rem",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {selectedRegistration
                ? `${selectedRegistration.title || ""} ${selectedRegistration.name}`
                : "Money Receipt"}
            </Typography>
          </Box>
          {selectedRegistration && (
            <Typography variant="caption" sx={{ opacity: 0.85, fontSize: "0.72rem", display: "block", mt: 0.3 }}>
              Reg: {selectedRegistration.regNo} • ID: {selectedRegistration.labId} • {selectedRegistration.gender} / {Math.round(selectedRegistration.age || 0)} {selectedRegistration.ageUnit?.charAt(0) || "Y"}
            </Typography>
          )}
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: "primary.contrastText" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {loadingReceipt ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            p: 3
          }}
        >
          <CircularProgress size={42} />
          <Typography variant="body2" color="text.secondary">
            Loading receipt details...
          </Typography>
        </Box>
      ) : selectedRegistration ? (
        <>
          {/* ── SEGMENTED QUICK TABS ── */}
          <Box
            sx={{
              display: "flex",
              bgcolor: "#ffffff",
              borderBottom: "1px solid",
              borderColor: "divider",
              px: 1.5,
              py: 1,
              gap: 1,
              position: "sticky",
              top: 56,
              zIndex: 1050
            }}
          >
            <Button
              size="small"
              variant={activeTab === "billing" ? "contained" : "outlined"}
              onClick={() => setActiveTab("billing")}
              startIcon={<PaymentIcon fontSize="small" />}
              sx={{
                flex: 1,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "0.78rem",
                py: 0.6,
                textTransform: "none"
              }}
            >
              Bill & Payment
            </Button>
            <Button
              size="small"
              variant={activeTab === "tests" ? "contained" : "outlined"}
              onClick={() => setActiveTab("tests")}
              startIcon={<TestIcon fontSize="small" />}
              sx={{
                flex: 1,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "0.78rem",
                py: 0.6,
                textTransform: "none"
              }}
            >
              Tests ({selectedRegistration.tests?.length || 0})
            </Button>
            <Button
              size="small"
              variant={activeTab === "history" ? "contained" : "outlined"}
              onClick={() => setActiveTab("history")}
              startIcon={<HistoryIcon fontSize="small" />}
              sx={{
                flex: 1,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "0.78rem",
                py: 0.6,
                textTransform: "none"
              }}
            >
              History ({selectedRegistration.payments?.length || 0})
            </Button>
          </Box>

          {/* ── SCROLLABLE CONTENT BODY ── */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 2, pb: 14 }}>
            {/* ── TAB 1: BILLING & PAYMENT ── */}
            {activeTab === "billing" && (
              <Stack spacing={2}>
                {/* Due Status Banner */}
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2.5,
                    bgcolor: remainingDue === 0 ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
                    borderColor: remainingDue === 0 ? "success.light" : "warning.light",
                    p: 1.75
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {remainingDue === 0 ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <WarningIcon color="warning" />
                      )}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {remainingDue === 0 ? "Fully Paid" : `Pending Due: ₹${remainingDue.toFixed(2)}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Net Bill: ₹{netBill.toFixed(2)} • Paid: ₹{alreadyPaid.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                    {remainingDue > 0 && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => handleReceivedAmountChange(remainingDue)}
                        sx={{ fontSize: "0.72rem", fontWeight: 700, py: 0.3, px: 1, borderRadius: 1.5 }}
                      >
                        Pay Full Due
                      </Button>
                    )}
                  </Box>
                </Card>

                {/* Calculation Card */}
                <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: "primary.main" }}>
                      📊 Billing Breakdown
                    </Typography>

                    <Stack spacing={1.2}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                        <Typography variant="body2" color="text.secondary">Subtotal (Tests):</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{parseFloat(selectedRegistration.totalAmount || 0).toFixed(2)}</Typography>
                      </Box>

                      {parseFloat(selectedRegistration.collectionCharge || 0) > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                          <Typography variant="body2" color="text.secondary">Collection Charge:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{parseFloat(selectedRegistration.collectionCharge).toFixed(2)}</Typography>
                        </Box>
                      )}

                      {/* Discount Inputs */}
                      <Box sx={{ display: "flex", gap: 1.5, mt: 0.5, mb: 0.5 }}>
                        <TextField
                          label="Discount %"
                          size="small"
                          type="number"
                          value={discountPercentInput}
                          onChange={(e) => handleDiscountPercentChange(e.target.value)}
                          slotProps={{ htmlInput: { min: 0, max: 100, step: 0.1 } }}
                          fullWidth
                          sx={{ "& .MuiInputBase-input": { fontSize: "0.85rem", fontWeight: 600 } }}
                        />
                        <TextField
                          label="Discount ₹"
                          size="small"
                          type="number"
                          value={discountInput}
                          onChange={(e) => handleDiscountAmountChange(e.target.value)}
                          fullWidth
                          sx={{ "& .MuiInputBase-input": { fontSize: "0.85rem", fontWeight: 600 } }}
                        />
                      </Box>

                      <Divider sx={{ my: 0.5, borderStyle: "dashed" }} />

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Net Bill Amount:</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", fontSize: "1rem" }}>
                          ₹{netBill.toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" color="text.secondary">Already Paid:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                          ₹{alreadyPaid.toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* New Payment Entry Card */}
                <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: "primary.light" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: "primary.main" }}>
                      💳 Record New Payment
                    </Typography>

                    <Stack spacing={2}>
                      <TextField
                        label="Received Amount (₹)"
                        size="small"
                        type="number"
                        value={receivedInput}
                        onChange={(e) => handleReceivedAmountChange(e.target.value)}
                        slotProps={{
                          htmlInput: {
                            min: 0,
                            max: remainingDue,
                            step: "0.01"
                          }
                        }}
                        helperText={`Max payable now: ₹${remainingDue.toFixed(2)}`}
                        fullWidth
                        autoFocus
                        sx={{
                          "& .MuiInputBase-input": { fontSize: "1.05rem", fontWeight: 700, color: "primary.main" }
                        }}
                      />

                      {/* Remaining After this entry */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: 1.2,
                          borderRadius: 2,
                          bgcolor: finalDueAfterPayment > 0 ? "#fee2e2" : "#dcfce7",
                          border: "1px solid",
                          borderColor: finalDueAfterPayment > 0 ? "#fca5a5" : "#86efac"
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700, color: finalDueAfterPayment > 0 ? "error.dark" : "success.dark", fontSize: "0.82rem" }}>
                          Remaining Due After Payment:
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: finalDueAfterPayment > 0 ? "error.dark" : "success.dark" }}>
                          ₹{finalDueAfterPayment.toFixed(2)}
                        </Typography>
                      </Box>

                      <TextField
                        select
                        label="Payment Mode"
                        size="small"
                        value={paymentModeInput}
                        onChange={(e) => setPaymentModeInput(e.target.value)}
                        fullWidth
                      >
                        <MenuItem value="Cash">💵 Cash</MenuItem>
                        <MenuItem value="UPI">📱 UPI / QR</MenuItem>
                        <MenuItem value="Card">💳 Card / POS</MenuItem>
                        <MenuItem value="Net Banking">🏦 Net Banking</MenuItem>
                      </TextField>

                      <TextField
                        label="Payment Ref / Txn ID"
                        size="small"
                        value={paymentRefNoInput}
                        onChange={(e) => setPaymentRefNoInput(e.target.value)}
                        placeholder="e.g., UPI Ref, Txn ID, Cheque No"
                        fullWidth
                      />

                      <TextField
                        label="Payment Remark"
                        size="small"
                        value={remarkInput}
                        onChange={(e) => setRemarkInput(e.target.value)}
                        placeholder="Optional payment notes"
                        fullWidth
                      />

                      <Box sx={{ display: "flex", gap: 2 }}>
                        <FormControlLabel
                          control={<Checkbox checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} size="small" />}
                          label={<Typography variant="body2" sx={{ fontSize: "0.82rem" }}>Send SMS</Typography>}
                        />
                        <FormControlLabel
                          control={<Checkbox checked={sendMail} onChange={(e) => setSendMail(e.target.checked)} size="small" />}
                          label={<Typography variant="body2" sx={{ fontSize: "0.82rem" }}>Send Mail</Typography>}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            )}

            {/* ── TAB 2: TESTS BREAKDOWN ── */}
            {activeTab === "tests" && (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                  Registered Tests ({selectedRegistration.tests?.length || 0})
                </Typography>

                {(selectedRegistration.tests || []).map((t, idx) => (
                  <Card key={t.testId || idx} variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box sx={{ flex: 1, pr: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>
                          {t.test?.name || `Test #${t.testId}`}
                        </Typography>
                        {t.test?.code && (
                          <Chip
                            label={`Code: ${t.test.code}`}
                            size="small"
                            sx={{ height: 20, fontSize: "0.68rem", mt: 0.5, fontWeight: 600 }}
                          />
                        )}
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        ₹{parseFloat(t.price !== undefined ? t.price : t.test?.price || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Card>
                ))}
              </Stack>
            )}

            {/* ── TAB 3: PAYMENT HISTORY ── */}
            {activeTab === "history" && (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                  Payment History ({selectedRegistration.payments?.length || 0})
                </Typography>

                {selectedRegistration.payments && selectedRegistration.payments.length > 0 ? (
                  selectedRegistration.payments.map((p, idx) => (
                    <Card key={p.id || idx} variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {p.paymentMode || "Cash"}
                          </Typography>
                          {p.paymentRefNo && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              Ref: {p.paymentRefNo}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.3 }}>
                            {new Date(p.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                          </Typography>
                        </Box>
                        <Chip
                          label={`₹${parseFloat(p.amount).toFixed(2)}`}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 800, fontSize: "0.82rem" }}
                        />
                      </Box>
                    </Card>
                  ))
                ) : (
                  <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                    <Typography variant="body2">No previous payments recorded.</Typography>
                  </Box>
                )}
              </Stack>
            )}
          </Box>

          {/* ── STICKY BOTTOM ACTION BAR ── */}
          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: "#ffffff",
              borderTop: "1px solid",
              borderColor: "divider",
              p: 1.5,
              px: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              zIndex: 1100,
              boxShadow: "0 -4px 16px rgba(0,0,0,0.08)"
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.68rem" }}>
                Receiving Now:
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1.1 }}>
                ₹{(parseFloat(receivedInput) || 0).toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Print Bill / Receipt">
                <IconButton
                  onClick={() => handlePrintReceipt(selectedRegistration)}
                  color="primary"
                  sx={{
                    border: "1px solid",
                    borderColor: "primary.main",
                    borderRadius: 2,
                    p: 0.9
                  }}
                >
                  <PrintIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                onClick={handleSavePayment}
                startIcon={savingPayment ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={savingPayment || !canWrite}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  textTransform: "none"
                }}
              >
                {savingPayment ? "Saving..." : "Save Payment"}
              </Button>
            </Box>
          </Box>
        </>
      ) : null}
    </Dialog>
  );
}
