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
  CircularProgress
} from "@mui/material";
import {
  SupportAgent as SupportIcon,
  PhoneAndroid as PhoneIcon,
  ArrowForward as ArrowForwardIcon
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
        scrollMarginTop: { xs: "72px", md: "80px" },
        py: { xs: 10, md: 16 },
        bgcolor: "#111827", // Solid Dark Gray Color Block
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Flat Poster Geometric Shapes */}
      <Box
        sx={{
          position: "absolute",
          top: "-60px",
          right: "-60px",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          bgcolor: "rgba(15, 118, 110, 0.15)",
          pointerEvents: "none"
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-40px",
          left: "-40px",
          width: "200px",
          height: "200px",
          transform: "rotate(45deg)",
          bgcolor: "rgba(255, 255, 255, 0.04)",
          pointerEvents: "none"
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ textAlign: "center", mb: { xs: 6, md: 8 } }}>
          {/* Flat Section Badge */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              px: 2.2,
              py: 0.8,
              borderRadius: "6px",
              bgcolor: "rgba(15, 118, 110, 0.2)",
              mb: 2.5
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "#0f766e"
              }}
            />
            <Typography
              sx={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontSize: "0.8rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#14b8a6",
                fontWeight: 800
              }}
            >
              Get Started In Minutes
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontSize: { xs: "2.4rem", sm: "3rem", md: "3.5rem" },
              fontWeight: 800,
              color: "#FFFFFF",
              mb: 2,
              letterSpacing: "-0.02em"
            }}
          >
            Ready to Modernize Your Pathology Lab?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: "var(--font-outfit), sans-serif",
              color: "#9CA3AF",
              maxWidth: 600,
              mx: "auto",
              fontSize: { xs: "1.05rem", md: "1.15rem" },
              lineHeight: 1.6
            }}
          >
            Leave your contact details and our medical software specialists will set up your 5-day free trial right away.
          </Typography>
        </Box>

        {/* Flat Color Block Card */}
        <Card
          elevation={0}
          sx={{
            border: "3px solid rgba(255, 255, 255, 0.15)",
            bgcolor: "#1F2937",
            borderRadius: "12px",
            p: { xs: 3, sm: 5, md: 6 },
            boxShadow: "none !important"
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Grid container spacing={5} sx={{ alignItems: "center" }}>
              {/* Support Icon Column */}
              <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    bgcolor: "#0f766e",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2
                  }}
                >
                  <SupportIcon sx={{ fontSize: 40 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "1.1rem", mb: 0.5, fontFamily: "var(--font-outfit), sans-serif" }}>
                  Free Setup & Training
                </Typography>
                <Typography variant="caption" sx={{ color: "#9CA3AF", fontSize: "0.85rem", fontWeight: 600 }}>
                  Average support response: &lt; 1 hour
                </Typography>
              </Grid>

              {/* Form Column */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography
                  sx={{
                    fontFamily: "var(--font-outfit), sans-serif",
                    fontWeight: 800,
                    fontSize: { xs: "1.4rem", sm: "1.6rem" },
                    color: "#FFFFFF",
                    mb: 1.5
                  }}
                >
                  Start Your 5-Day Free Trial
                </Typography>
                <Typography variant="body2" sx={{ color: "#9CA3AF", mb: 3, lineHeight: 1.6, fontSize: "0.95rem" }}>
                  Enter your mobile number or email address below. No credit card required.
                </Typography>

                <Box
                  component="form"
                  onSubmit={handleLeadSubmit}
                  sx={{
                    p: 0.75,
                    borderRadius: "8px",
                    bgcolor: "#FFFFFF",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 1,
                    boxShadow: "none !important"
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
                              <PhoneIcon sx={{ color: "#0f766e", fontSize: "1.3rem" }} />
                            ) : (
                              <EmailOutlinedIcon sx={{ color: "#0f766e", fontSize: "1.3rem" }} />
                            )}
                          </InputAdornment>
                        ),
                      }
                    }}
                    sx={{
                      "& .MuiInputBase-input": {
                        py: 1.3,
                        fontSize: "0.98rem",
                        fontWeight: 600,
                        color: "#111827"
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{
                      py: { xs: 1.5, sm: 1.3 },
                      px: 4,
                      minWidth: { xs: "100%", sm: "175px" },
                      whiteSpace: "nowrap",
                      borderRadius: "6px",
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      textTransform: "none",
                      bgcolor: "#0f766e",
                      color: "#FFFFFF",
                      boxShadow: "none !important",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      "&:hover": {
                        bgcolor: "#115e59",
                        boxShadow: "none !important",
                        transform: "scale(1.04)"
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
