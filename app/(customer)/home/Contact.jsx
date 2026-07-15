"use client";

import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Chip
} from "@mui/material";
import {
  SupportAgent as SupportIcon,
  PhoneAndroid as PhoneIcon
} from "@mui/icons-material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

export default function Contact({
  contactInput,
  setContactInput,
  inputType,
  loading,
  handleLeadSubmit
}) {
  return (
    <Box
      id="contact"
      sx={{
        py: { xs: 8, md: 12 },
        background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)", // Teal-50 to Sky-50
        borderTop: "1px solid rgba(15, 118, 110, 0.08)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Decorative floating blurred gradient spots */}
      <Box
        sx={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "40%",
          height: "40%",
          background: "radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, rgba(20, 184, 166, 0) 70%)",
          filter: "blur(60px)",
          pointerEvents: "none"
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-10%",
          right: "-10%",
          width: "40%",
          height: "40%",
          background: "radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0) 70%)",
          filter: "blur(60px)",
          pointerEvents: "none"
        }}
      />

      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Card
          variant="outlined"
          sx={{
            border: "1px solid rgba(15, 118, 110, 0.15)",
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            p: { xs: 2, sm: 4, md: 5 },
            boxShadow: "0 20px 40px -15px rgba(15, 118, 110, 0.08), 0 1px 3px 0 rgba(15, 118, 110, 0.05)"
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Grid container spacing={5} sx={{ alignItems: "center" }}>
              
              {/* Support Agent Illustration Column */}
              <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <Box
                  sx={{
                    position: "relative",
                    p: 3,
                    borderRadius: "50%",
                    bgcolor: "rgba(20, 184, 166, 0.08)",
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                    animation: "pulseGlow 2.5s infinite ease-in-out",
                    "@keyframes pulseGlow": {
                      "0%": { boxShadow: "0 0 0 0 rgba(20, 184, 166, 0.3)" },
                      "70%": { boxShadow: "0 0 0 20px rgba(20, 184, 166, 0)" },
                      "100%": { boxShadow: "0 0 0 0 rgba(20, 184, 166, 0)" }
                    }
                  }}
                >
                  <SupportIcon sx={{ fontSize: { xs: 56, md: 72 } }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", letterSpacing: 1 }}>
                  24/7 SUPPORT
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Average response: &lt; 2 hours
                </Typography>
              </Grid>

              {/* Contact Form Column */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Chip
                  label="FREE TRIAL & QUESTIONS"
                  color="primary"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    mb: 2,
                    bgcolor: "primary.main",
                    borderRadius: "9999px",
                    px: 1,
                    fontSize: "0.75rem",
                    letterSpacing: 0.5
                  }}
                />
                
                <Typography
                  variant="h3"
                  sx={{
                    fontSize: { xs: "1.75rem", sm: "2.1rem" },
                    fontWeight: 900,
                    mb: 2,
                    background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}
                >
                  Contact Us & Support
                </Typography>

                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    mb: 4,
                    lineHeight: 1.7,
                    fontSize: { xs: "0.925rem", sm: "1rem" }
                  }}
                >
                  Enter your email address or mobile number below to claim your 5-day free trial or to ask any questions. Our team will get in touch with you shortly.
                </Typography>

                {/* Contact Lead Capture Form */}
                <Box
                  component="form"
                  onSubmit={handleLeadSubmit}
                  sx={{
                    p: 1,
                    borderRadius: "16px",
                    bgcolor: "#ffffff",
                    border: "1px solid rgba(15, 118, 110, 0.15)",
                    boxShadow: "0 8px 30px rgba(15, 118, 110, 0.05)",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 1.5,
                    mb: 3.5,
                    transition: "all 0.3s ease",
                    "&:focus-within": {
                      borderColor: "primary.main",
                      boxShadow: "0 8px 30px rgba(15, 118, 110, 0.12)",
                      transform: "translateY(-2px)"
                    }
                  }}
                >
                  <TextField
                    fullWidth
                    variant="standard"
                    placeholder="Enter mobile number or email"
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    slotProps={{
                      input: {
                        disableUnderline: true,
                        startAdornment: (
                          <InputAdornment position="start" sx={{ pl: 2, pr: 0.5 }}>
                            {inputType === "mobile" ? (
                              <PhoneIcon sx={{ color: "primary.main" }} />
                            ) : (
                              <EmailOutlinedIcon sx={{ color: "primary.main" }} />
                            )}
                          </InputAdornment>
                        ),
                      }
                    }}
                    sx={{
                      justifyContent: "center",
                      "& .MuiInputBase-input": {
                        py: 1,
                        fontSize: "1rem",
                        fontWeight: 500
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    sx={{
                      py: { xs: 1.75, sm: 1.5 },
                      px: 4,
                      whiteSpace: "nowrap",
                      borderRadius: "12px",
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      textTransform: "none",
                      background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
                      boxShadow: "0 4px 15px rgba(15, 118, 110, 0.25)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                        transform: "translateY(-1px)",
                        boxShadow: "0 6px 20px rgba(15, 118, 110, 0.3)"
                      }
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      "Claim Free Trial"
                    )}
                  </Button>
                </Box>


              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
