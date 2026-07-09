"use client";

import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Tooltip
} from "@mui/material";
import {
  Email as EmailIcon,
  AutoFixHigh as AutoFixHighIcon
} from "@mui/icons-material";
import { toast } from "sonner";

export default function ContactPage() {
  // Form State
  const [formData, setFormData] = useState({ name: "", emailOrPhone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Word Counter Helper to disable AI button if less than 4 words
  const getWordCount = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  };
  const isAiDisabled = getWordCount(formData.message) < 4;

  const handleImproveWithAI = async () => {
    if (isAiDisabled || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: formData.message }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.improvedText) {
        setFormData((prev) => ({ ...prev, message: data.improvedText }));
        toast.success("Message improved by AI!");
      } else {
        toast.error(data.message || "AI failed to improve spelling and grammar.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to AI service.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.emailOrPhone.trim()) {
      toast.error("Please fill in required fields.");
      return;
    }

    setLoading(true);
    try {
      // Submitting to the new contact API
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message);
        setFormData({ name: "", emailOrPhone: "", message: "" });
      } else {
        toast.error(res.message || "Failed to submit request.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: { xs: "auto", md: "calc(100dvh - 64px)" },
        mt: "64px",
        display: "flex",
        alignItems: "center",
        background: "radial-gradient(circle at 10% 20%, rgba(20, 184, 166, 0.05) 0%, rgba(255, 255, 255, 0) 60%)",
        py: { xs: 12, md: 0 }
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          {/* Left Side: Contact Information */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: "text.primary", fontSize: { xs: "2.3rem", md: "3rem" } }}>
                Contact Us
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.7, fontWeight: 400, mb: 3 }}>
                Have questions about our cloud LIMS features or looking for a customized laboratory package? Reach out to us.
              </Typography>
              
              <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: "0.1em", mt: 4 }}>
                Get In Touch
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: "text.primary" }}>
                We are here to assist your laboratory
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Our support team responds to all email inquiries within 24 hours. For a faster response, send a direct message.
              </Typography>
            </Box>

            <Card variant="outlined" sx={{ border: "1px solid rgba(0,0,0,0.06)", bgcolor: "background.paper" }}>
              <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2.5 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(20, 184, 166, 0.06)", color: "primary.main", display: "inline-flex" }}>
                  <EmailIcon />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 700, textTransform: "uppercase" }}>
                    Support Email
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                    support@easytechnomed.com
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Side: Message form */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card variant="outlined" sx={{ border: "1px solid rgba(0,0,0,0.06)", p: { xs: 3, md: 4 } }}>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}>
                  Send Message
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
                  Enter your name and details, and we will contact you directly within 1 to 2 hours to demonstrate our platform.
                </Typography>

                <form onSubmit={handleContactSubmit}>
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Full Name *"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        fullWidth
                        required
                        size="small"
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Email Address or Mobile Number *"
                        value={formData.emailOrPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, emailOrPhone: e.target.value }))}
                        fullWidth
                        required
                        size="small"
                        placeholder="e.g. name@clinic.com or +91 99999..."
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Your Message / Inquiry (Optional)"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        fullWidth
                        multiline
                        rows={4}
                        size="small"
                        placeholder="Please let us know your requirements (e.g. number of technicians, test volume...)"
                        slotProps={{
                          inputLabel: { shrink: true },
                          input: {
                            endAdornment: (
                              <InputAdornment position="end" sx={{ alignSelf: "flex-end", mb: 1, mr: 0.5 }}>
                                <Tooltip
                                  title={
                                    isAiDisabled
                                      ? "Write at least 4 words to enable AI grammar helper"
                                      : "Improve spelling & grammar with Gemini AI"
                                  }
                                  arrow
                                >
                                  <span>
                                    <IconButton
                                      color="primary"
                                      onClick={handleImproveWithAI}
                                      disabled={isAiDisabled || aiLoading}
                                      size="small"
                                      sx={{
                                        bgcolor: isAiDisabled ? "transparent" : "rgba(20, 184, 166, 0.08)",
                                        "&:hover": {
                                          bgcolor: "rgba(20, 184, 166, 0.15)"
                                        }
                                      }}
                                    >
                                      {aiLoading ? (
                                        <CircularProgress size={18} color="inherit" />
                                      ) : (
                                        <AutoFixHighIcon fontSize="small" sx={{ color: isAiDisabled ? "text.disabled" : "primary.main" }} />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </InputAdornment>
                            )
                          }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        fullWidth
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{ py: 1.25, fontWeight: 700 }}
                      >
                        {loading ? "Submitting Inquiry..." : "Submit Inquiry"}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
