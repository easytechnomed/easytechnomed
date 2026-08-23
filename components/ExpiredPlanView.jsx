"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Stack,
  Chip
} from "@mui/material";
import {
  WarningAmber as WarningIcon,
  PhoneIphone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  Logout as LogoutIcon,
  HourglassBottom as HourglassIcon,
  Send as SendIcon,
  VerifiedUser as SecurityIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function ExpiredPlanView({ admin }) {
  const router = useRouter();
  const [contactNumber, setContactNumber] = useState(admin?.mobileNumber || "");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const formattedExpiry = admin?.expireAt
    ? new Date(admin.expireAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

  const handleResumeRequest = async (e) => {
    e?.preventDefault();
    if (!contactNumber.trim()) {
      setErrorMsg("Please enter your mobile or WhatsApp contact number.");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const messageContent = `Plan Renewal / Resume Service Request\n\nAdmin Name: ${admin?.name || "N/A"}\nEmail: ${admin?.email || "N/A"}\nContact: ${contactNumber.trim()}\nWorkspace: ${admin?.workspaceName || admin?.companyName || "N/A"}\nExpired At: ${formattedExpiry}\nNote: ${note.trim() || "Please contact to resume services."}`;

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: admin?.name || "Admin",
          emailOrPhone: contactNumber.trim(),
          message: messageContent,
        }),
      }).then((r) => r.json());

      if (res.success) {
        setIsSubmitted(true);
      } else {
        setErrorMsg(res.message || res.error || "Failed to send request. Please try again.");
      }
    } catch (err) {
      console.error("Resume request error:", err);
      setErrorMsg("Something went wrong while submitting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
    } catch (err) {
      console.error(err);
      window.location.href = "/auth/login";
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f8fafc",
        p: { xs: 2, sm: 3 },
        position: "relative",
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(15, 118, 110, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(245, 158, 11, 0.08) 0px, transparent 50%)",
      }}
    >
      <Card
        elevation={0}
        sx={{
          maxWidth: 540,
          width: "100%",
          borderRadius: 3,
          border: "1px solid",
          borderColor: "#e2e8f0",
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
          overflow: "hidden",
          bgcolor: "#ffffff",
        }}
      >
        {/* Top Header Bar */}
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor: "#fffbeb",
            borderBottom: "1px solid #fef3c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                bgcolor: "#fef3c7",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <WarningIcon fontSize="small" />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#92400e" }}>
              Service Notification
            </Typography>
          </Box>

          <Chip
            size="small"
            label="Plan Expired"
            sx={{
              bgcolor: "#fee2e2",
              color: "#b91c1c",
              fontWeight: 700,
              fontSize: "0.72rem",
              border: "1px solid #fecaca",
            }}
          />
        </Box>

        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {isSubmitted ? (
            /* Success State View */
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  bgcolor: "#f0fdf4",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                  boxShadow: "0 0 0 8px rgba(22, 163, 74, 0.1)",
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 38 }} />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>
                Request Submitted Successfully!
              </Typography>

              <Typography variant="body2" sx={{ color: "#475569", lineHeight: 1.6, mb: 2.5 }}>
                We have received your callback request. Our team will contact you on{" "}
                <strong style={{ color: "#0f766e" }}>{contactNumber}</strong> within{" "}
                <strong style={{ color: "#d97706" }}>1 to 2 hours</strong> to reactivate and resume your services.
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#f0fdf4",
                  borderColor: "#bbf7d0",
                  textAlign: "left",
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                  <SecurityIcon sx={{ color: "#16a34a", fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#166534" }}>
                    Your Data is 100% Safe & All Reports are Still Live
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "#15803d", display: "block" }}>
                  All your patient records, test templates, and report links remain securely active.
                </Typography>
              </Paper>

              <Button
                variant="text"
                size="small"
                onClick={() => setIsSubmitted(false)}
                sx={{ color: "#0f766e", fontWeight: 600, mb: 1 }}
              >
                Update Contact Number / Send Another Note
              </Button>
            </Box>
          ) : (
            /* Input & Request Form View */
            <Box component="form" onSubmit={handleResumeRequest}>
              <Box sx={{ mb: 2.5, textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>
                  Your Plan Has Expired
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569", lineHeight: 1.6 }}>
                  Your subscription for <strong>{admin?.workspaceName || admin?.companyName || "your lab"}</strong> expired on{" "}
                  <span style={{ color: "#b91c1c", fontWeight: 600 }}>{formattedExpiry}</span>.
                </Typography>
              </Box>

              {/* Data is Safe Reassurance Box */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  p: 1.8,
                  mb: 2.5,
                  borderRadius: 2,
                  bgcolor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                }}
              >
                <SecurityIcon sx={{ color: "#16a34a", fontSize: 22, mt: "2px", flexShrink: 0 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#166534", fontSize: "0.85rem" }}>
                    Your Data is Safe & All Reports are Still Live
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#15803d", display: "block", fontSize: "0.75rem", lineHeight: 1.4, mt: 0.3 }}>
                    Don’t worry — all your patient reports, previous tests, and PDF download links are completely safe and live.
                  </Typography>
                </Box>
              </Box>

              <Alert
                severity="info"
                icon={<HourglassIcon fontSize="inherit" />}
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: "#f0fdfa",
                  color: "#115e59",
                  borderColor: "#ccfbf1",
                  "& .MuiAlert-icon": { color: "#0f766e" },
                }}
              >
                <strong>Want to resume services?</strong> Enter your phone number below and our team will contact you in <strong>1–2 hours</strong>.
              </Alert>

              {errorMsg && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {errorMsg}
                </Alert>
              )}

              <Stack spacing={2} sx={{ mb: 3 }}>
                <TextField
                  label="Contact / WhatsApp Number"
                  placeholder="e.g. 9876543210"
                  fullWidth
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <PhoneIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />,
                    },
                  }}
                  helperText="We will call or message on this number to assist you."
                />

                <TextField
                  label="Message / Note (Optional)"
                  placeholder="e.g. Please activate 1 year renewal plan"
                  fullWidth
                  multiline
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting || !contactNumber.trim()}
                  startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                  sx={{
                    bgcolor: "#0f766e",
                    "&:hover": { bgcolor: "#115e59" },
                    py: 1.3,
                    fontWeight: 700,
                    borderRadius: 2,
                    fontSize: "0.95rem",
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Resume Service — Contact Me in 1-2 Hrs"}
                </Button>
              </Stack>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Bottom Actions & Logout */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1 }}>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Signed in as: <strong>{admin?.email}</strong>
            </Typography>

            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={handleLogout}
              disabled={isLoggingOut}
              startIcon={isLoggingOut ? <CircularProgress size={14} color="inherit" /> : <LogoutIcon fontSize="small" />}
              sx={{ borderRadius: 1.5, fontSize: "0.78rem", textTransform: "none" }}
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
