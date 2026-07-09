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
  CircularProgress
} from "@mui/material";
import {
  Email as EmailIcon
} from "@mui/icons-material";
import { toast } from "sonner";

export default function ContactPage() {
  // Form State
  const [formData, setFormData] = useState({ name: "", emailOrPhone: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.emailOrPhone.trim()) {
      toast.error("Please fill in required fields.");
      return;
    }

    setLoading(true);
    try {
      // Submitting using client lead endpoint
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          contact: formData.emailOrPhone,
          message: formData.message
        }),
      }).then((r) => r.json());

      if (res.success) {
        toast.success("Thank you for contacting us! Our team will get back to you shortly.");
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
    <Box>
      {/* Hero Banner */}
      <Box
        sx={{
          background: "linear-gradient(180deg, rgba(15, 118, 110, 0.08) 0%, rgba(248, 250, 252, 0) 100%)",
          color: "text.primary",
          pt: { xs: 18, md: 22 },
          pb: { xs: 10, md: 14 },
          textAlign: "center"
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, fontSize: { xs: "2.3rem", md: "3.5rem" }, color: "text.primary" }}>
            Contact Us
          </Typography>
          <Typography variant="h6" sx={{ color: "text.secondary", lineHeight: 1.7, fontWeight: 400, maxWidth: 600, mx: "auto" }}>
            Have questions about our cloud LIMS features or looking for a customized laboratory package? Reach out to us.
          </Typography>
        </Container>
      </Box>

      {/* Form and info split */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Grid container spacing={6}>
          
          {/* Left Side: Contact Information cards */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            
            <Box>
              <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Get In Touch
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: "text.primary" }}>
                We are here to assist your laboratory
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Our technical support and account managers respond to all inquiries within 24 hours.
              </Typography>
            </Box>

            <Card variant="outlined" sx={{ border: "1px solid rgba(0,0,0,0.06)", bgcolor: "background.paper" }}>
              <CardContent sx={{ p: 3, display: "flex", alignItems: "center", gap: 2.5 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(15,118,110,0.06)", color: "primary.main", display: "inline-flex" }}>
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
            <Card variant="outlined" sx={{ border: "1px solid rgba(0,0,0,0.06)", p: { xs: 3, md: 5 } }}>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}>
                  Send Message
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4.5 }}>
                  Enter your name and contact details, and we will contact you directly to demonstrate our platform.
                </Typography>

                <form onSubmit={handleContactSubmit}>
                  <Grid container spacing={3.5}>
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
                        slotProps={{ inputLabel: { shrink: true } }}
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
                        sx={{ py: 1.5, fontWeight: 700 }}
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
