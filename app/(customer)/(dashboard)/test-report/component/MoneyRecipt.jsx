"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
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
  Tooltip,
  Drawer,
  MenuItem,
  Stack,
  TextField,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Print as PrintIcon
} from "@mui/icons-material";
import MoneyReciptMobile from "./MoneyReciptMobile";

export default function MoneyRecipt({ open, onClose, selectedReg, onSaveSuccess, canWrite }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loadingReceipt, setLoadingReceipt] = useState(true);
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

  // Toast notification inside component
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const loadReceiptDetails = async () => {
    setLoadingReceipt(true);
    try {
      const res = await fetch(`/api/registrations/${selectedReg.id}`).then((r) => r.json());
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
        setTimeout(onClose, 1500);
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading registration details.", "error");
      setTimeout(onClose, 1500);
    } finally {
      setLoadingReceipt(false);
    }
  };

  useEffect(() => {
    if (open && selectedReg) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadReceiptDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedReg]);

  const handleDiscountAmountChange = (val) => {
    const total = parseFloat(selectedRegistration?.totalAmount || 0) + parseFloat(selectedRegistration?.collectionCharge || 0);
    let amt = val === "" ? "" : parseFloat(val);
    if (amt !== "" && !isNaN(amt)) {
      if (amt < 0) amt = 0;
      if (amt > total) amt = total;
    } else {
      amt = 0;
    }
    setDiscountInput(amt);
    if (total > 0) {
      setDiscountPercentInput(Math.round((parseFloat(amt || 0) / total) * 10000) / 100);
    }
    const alreadyPaid = parseFloat(selectedRegistration?.receivedAmount || 0);
    const maxAllowed = Math.max(0, total - (parseFloat(amt) || 0) - alreadyPaid);
    if (parseFloat(receivedInput) > maxAllowed) {
      setReceivedInput(maxAllowed);
    }
  };

  const handleDiscountPercentChange = (val) => {
    let pct = val === "" ? "" : parseFloat(val);
    if (pct !== "" && !isNaN(pct)) {
      if (pct < 0) pct = 0;
      if (pct > 100) pct = 100;
    } else {
      pct = 0;
    }
    setDiscountPercentInput(pct);
    const total = parseFloat(selectedRegistration?.totalAmount || 0) + parseFloat(selectedRegistration?.collectionCharge || 0);
    const amt = Math.round(total * ((parseFloat(pct) || 0) / 100) * 100) / 100;
    setDiscountInput(amt);
    const alreadyPaid = parseFloat(selectedRegistration?.receivedAmount || 0);
    const maxAllowed = Math.max(0, total - amt - alreadyPaid);
    if (parseFloat(receivedInput) > maxAllowed) {
      setReceivedInput(maxAllowed);
    }
  };

  const handleReceivedAmountChange = (val) => {
    if (val === "") {
      setReceivedInput("");
      return;
    }
    let amt = parseFloat(val);
    if (isNaN(amt)) amt = 0;
    if (amt < 0) amt = 0;

    const totalBill = parseFloat(selectedRegistration?.totalAmount || 0) + parseFloat(selectedRegistration?.collectionCharge || 0);
    const currentDiscount = parseFloat(discountInput) || 0;
    const netBill = Math.max(0, totalBill - currentDiscount);
    const alreadyPaid = parseFloat(selectedRegistration?.receivedAmount || 0);
    const maxAllowed = Math.max(0, netBill - alreadyPaid);

    if (amt > maxAllowed) {
      amt = maxAllowed;
      showToast(`Received amount cannot exceed net due amount (₹${maxAllowed.toFixed(2)})`, "warning");
    }
    setReceivedInput(amt);
  };

  const handleSavePayment = async () => {
    if (!selectedRegistration) return;

    const totalBill = parseFloat(selectedRegistration.totalAmount || 0) + parseFloat(selectedRegistration.collectionCharge || 0);
    const currentDiscount = parseFloat(discountInput) || 0;
    const netBill = Math.max(0, totalBill - currentDiscount);
    const alreadyPaid = parseFloat(selectedRegistration.receivedAmount || 0);
    const maxAllowed = Math.max(0, netBill - alreadyPaid);
    const enteredReceived = parseFloat(receivedInput) || 0;

    if (enteredReceived > maxAllowed + 0.01) {
      showToast(`Received amount cannot exceed remaining net due amount of ₹${maxAllowed.toFixed(2)}.`, "error");
      return;
    }
    if (enteredReceived < 0) {
      showToast("Received amount cannot be negative.", "error");
      return;
    }

    setSavingPayment(true);
    try {
      const res = await fetch(`/api/registrations/${selectedRegistration.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          received: enteredReceived,
          discountPercent: parseFloat(discountPercentInput) || 0,
          discountAmount: parseFloat(discountInput) || 0,
          paymentMode: paymentModeInput,
          paymentRefNo: paymentRefNoInput,
          remark: remarkInput,
        })
      }).then((r) => r.json());

      if (res.success) {
        showToast("Payment recorded successfully!", "success");
        setTimeout(() => {
          onClose();
          if (onSaveSuccess) onSaveSuccess();
        }, 1000);
      } else {
        showToast(res.error || res.message || "Failed to record payment.", "error");
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

  if (!open) return null;

  if (isMobile) {
    return (
      <>
        <MoneyReciptMobile
          open={open}
          onClose={onClose}
          loadingReceipt={loadingReceipt}
          selectedRegistration={selectedRegistration}
          receivedInput={receivedInput}
          handleReceivedAmountChange={handleReceivedAmountChange}
          discountInput={discountInput}
          handleDiscountAmountChange={handleDiscountAmountChange}
          discountPercentInput={discountPercentInput}
          handleDiscountPercentChange={handleDiscountPercentChange}
          paymentModeInput={paymentModeInput}
          setPaymentModeInput={setPaymentModeInput}
          paymentRefNoInput={paymentRefNoInput}
          setPaymentRefNoInput={setPaymentRefNoInput}
          remarkInput={remarkInput}
          setRemarkInput={setRemarkInput}
          savingPayment={savingPayment}
          handleSavePayment={handleSavePayment}
          sendSms={sendSms}
          setSendSms={setSendSms}
          sendMail={sendMail}
          setSendMail={setSendMail}
          handlePrintReceipt={handlePrintReceipt}
          canWrite={canWrite}
        />

        {/* Internal Snackbar */}
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
      </>
    );
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
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
              <IconButton onClick={onClose} size="small" sx={{ color: "primary.contrastText" }}>
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
                        <Grid size={{ xs: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>Reg. No</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.78rem", wordBreak: "break-word" }}>{selectedRegistration.regNo}</Typography>
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>Lab ID</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.78rem" }}>{selectedRegistration.labId}</Typography>
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>Patient Name</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.78rem", wordBreak: "break-word" }}>{selectedRegistration.title} {selectedRegistration.name}</Typography>
                        </Grid>

                        <Grid size={{ xs: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>Age / Gender</Typography>
                          <Typography variant="body2" sx={{ fontSize: "0.78rem" }}>{selectedRegistration.age} {selectedRegistration.ageUnit} / {selectedRegistration.gender}</Typography>
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>Date</Typography>
                          <Typography variant="body2" sx={{ fontSize: "0.78rem" }}>{new Date(selectedRegistration.date).toLocaleDateString()}</Typography>
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>Ref By</Typography>
                          <Typography variant="body2" sx={{ fontSize: "0.78rem", wordBreak: "break-word" }}>{selectedRegistration.refBy?.name || "Self"}</Typography>
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
                            <TableCell align="right">₹{parseFloat(t.price !== undefined ? t.price : t.test?.price || 0).toFixed(2)}</TableCell>
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
                        onChange={(e) => handleReceivedAmountChange(e.target.value)}
                        slotProps={{
                          htmlInput: {
                            min: 0,
                            max: Math.max(0, (parseFloat(selectedRegistration.totalAmount || 0) + parseFloat(selectedRegistration.collectionCharge || 0)) - (parseFloat(discountInput) || 0) - parseFloat(selectedRegistration.receivedAmount || 0)),
                            step: "0.01"
                          }
                        }}
                        helperText={`Max payable: ₹${Math.max(0, (parseFloat(selectedRegistration.totalAmount || 0) + parseFloat(selectedRegistration.collectionCharge || 0)) - (parseFloat(discountInput) || 0) - parseFloat(selectedRegistration.receivedAmount || 0)).toFixed(2)}`}
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
              <Button onClick={onClose} variant="outlined">
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
              </Box>
            </Box>
          </Box>
        ) : null}
      </Drawer>

      {/* Internal Snackbar */}
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
    </>
  );
}
