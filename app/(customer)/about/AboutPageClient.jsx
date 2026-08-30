"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button
} from "@mui/material";
import {
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  Bolt as SimplicityIcon,
  ArrowForward as ArrowForwardIcon
} from "@mui/icons-material";

export default function AboutPage() {
  const router = useRouter();

  const coreValues = [
    {
      title: "Easy to Use (No Training Needed)",
      desc: "A clean and simple design that anyone can learn in 5 minutes. No complicated settings, confusing menus, or technical headaches.",
      icon: <SimplicityIcon sx={{ fontSize: 28, color: "#FFFFFF" }} />,
      iconBg: "#0f766e"
    },
    {
      title: "Works Online & Offline",
      desc: "Keep working smoothly even during power cuts or when the internet is disconnected. All your data automatically syncs once you're back online.",
      icon: <TimelineIcon sx={{ fontSize: 28, color: "#FFFFFF" }} />,
      iconBg: "#10B981"
    },
    {
      title: "100% Safe & Secure",
      desc: "Your patient reports and lab records are backed up safely every single day with permanent QR code scanning access for patients.",
      icon: <SecurityIcon sx={{ fontSize: 28, color: "#FFFFFF" }} />,
      iconBg: "#F59E0B"
    }
  ];

  return (
    <Box sx={{ bgcolor: "#FFFFFF", minHeight: "100vh" }}>
      {/* Hero Header Section */}
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          color: "#111827",
          pt: { xs: 16, md: 20 },
          pb: { xs: 8, md: 12 },
          textAlign: "center",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Flat Geometric Decorative Shapes */}
        <Box
          sx={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            bgcolor: "rgba(15, 118, 110, 0.12)",
            pointerEvents: "none"
          }}
        />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          {/* Flat Section Badge */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              px: 2.2,
              py: 0.8,
              borderRadius: "6px",
              bgcolor: "rgba(15, 118, 110, 0.12)",
              mb: 2.5
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#0f766e" }} />
            <Typography
              sx={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontSize: "0.8rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#0f766e",
                fontWeight: 800
              }}
            >
              About EasyTechnoMed
            </Typography>
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 800,
              mb: 2.5,
              fontSize: { xs: "2.2rem", sm: "3rem", md: "3.5rem" },
              color: "#111827",
              letterSpacing: "-0.02em"
            }}
          >
            Simple & Fast Software for{" "}
            <Box component="span" sx={{ color: "#0f766e" }}>
              Diagnostic Labs
            </Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: "var(--font-outfit), sans-serif",
              color: "#4B5563",
              lineHeight: 1.7,
              fontSize: { xs: "1.05rem", md: "1.15rem" },
              maxWidth: 680,
              mx: "auto"
            }}
          >
            EasyTechnoMed helps pathology labs register patients, create accurate test reports, and share results without complicated steps or technical training.
          </Typography>
        </Container>
      </Box>

      {/* Core Mission Section */}
      <Box sx={{ bgcolor: "#F3F4F6", py: { xs: 9, md: 14 }, borderTop: "2px solid #E5E7EB" }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography
            sx={{
              fontFamily: "var(--font-outfit), sans-serif",
              color: "#0f766e",
              fontWeight: 800,
              mb: 1.5,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontSize: "0.85rem"
            }}
          >
            Our Mission
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 800,
              mb: 3,
              color: "#111827",
              fontSize: { xs: "1.8rem", md: "2.3rem" },
              letterSpacing: "-0.02em"
            }}
          >
            Helping Every Pathology Lab Run Digitally with Ease
          </Typography>
          <Typography variant="body1" sx={{ color: "#4B5563", mb: 3, lineHeight: 1.8, maxWidth: 720, mx: "auto", fontSize: "1.05rem" }}>
            We created EasyTechnoMed with one simple goal: to make everyday lab management easy, fast, and stress-free. Whether you operate a small local lab or a busy diagnostic clinic, you can manage your daily patient workflow from any computer, tablet, or mobile phone.
          </Typography>
          <Typography variant="body1" sx={{ color: "#4B5563", mb: 5, lineHeight: 1.8, maxWidth: 720, mx: "auto", fontSize: "1.05rem" }}>
            Our software works both online and offline. You can register patients, print clean PDF reports, and calculate doctor referral incentives in just a few simple clicks.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push("/auth/register")}
            endIcon={<ArrowForwardIcon sx={{ fontSize: "1.1rem" }} />}
            sx={{
              py: 1.5,
              px: 4,
              fontWeight: 800,
              fontSize: "1rem",
              borderRadius: "8px",
              bgcolor: "#0f766e",
              color: "#FFFFFF",
              boxShadow: "none !important",
              "&:hover": {
                bgcolor: "#115e59",
                boxShadow: "none !important",
                transform: "scale(1.04)"
              }
            }}
          >
            Start 5-Day Free Trial
          </Button>
        </Container>
      </Box>

      {/* Values Section */}
      <Box sx={{ bgcolor: "#FFFFFF", py: { xs: 9, md: 14 }, borderTop: "2px solid #E5E7EB" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.5,
                px: 2.2,
                py: 0.8,
                borderRadius: "6px",
                bgcolor: "rgba(15, 118, 110, 0.12)",
                mb: 2
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#0f766e" }} />
              <Typography
                sx={{
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontSize: "0.8rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#0f766e",
                  fontWeight: 800
                }}
              >
                Why Labs Trust Us
              </Typography>
            </Box>

            <Typography
              variant="h3"
              sx={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 800,
                color: "#111827",
                fontSize: { xs: "1.8rem", md: "2.3rem" },
                letterSpacing: "-0.02em"
              }}
            >
              Built for Speed, Accuracy, and Peace of Mind
            </Typography>
          </Box>

          <Grid container spacing={3.5}>
            {coreValues.map((val, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    bgcolor: "#FFFFFF",
                    border: "2px solid #E5E7EB",
                    borderRadius: "8px",
                    boxShadow: "none !important",
                    transition: "transform 0.2s, border-color 0.2s",
                    "&:hover": {
                      transform: "scale(1.03)",
                      borderColor: "#0f766e"
                    }
                  }}
                >
                  <CardContent sx={{ p: 4, display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        bgcolor: val.iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {val.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        color: "#111827",
                        fontSize: "1.25rem",
                        fontFamily: "var(--font-outfit), sans-serif"
                      }}
                    >
                      {val.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#4B5563", lineHeight: 1.7, fontSize: "0.95rem" }}>
                      {val.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
