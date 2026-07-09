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
  Avatar,
  Button
} from "@mui/material";
import {
  LocalHospital as HospitalIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  WorkspacePremium as PremiumIcon,
  Bolt as SimplicityIcon
} from "@mui/icons-material";

export default function AboutPage() {
  const router = useRouter();

  const coreValues = [
    {
      title: "Absolute Security",
      desc: "We prioritize patient confidentiality and data safety, enforcing 100% HIPAA compliant standards and robust data encryption.",
      icon: <SecurityIcon sx={{ fontSize: 40 }} color="primary" />
    },
    {
      title: "Continuous Innovation",
      desc: "We are committed to upgrading diagnostic lab workflows through automated report delivery, doctor metrics, and statistics.",
      icon: <TimelineIcon sx={{ fontSize: 40 }} color="primary" />
    },
    {
      title: "Extreme Simplicity",
      desc: "We design clean, intuitive, and lag-free workflows that let technicians register patients and generate reports in seconds.",
      icon: <SimplicityIcon sx={{ fontSize: 40 }} color="primary" />
    }
  ];

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: "radial-gradient(circle at 10% 20%, rgba(20, 184, 166, 0.05) 0%, rgba(255, 255, 255, 0) 60%)",
          color: "text.primary",
          pt: { xs: 18, md: 22 },
          pb: { xs: 10, md: 14 },
          textAlign: "center"
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, fontSize: { xs: "2.5rem", md: "3.5rem" }, color: "text.primary" }}>
            About EasyTechnoMed
          </Typography>
          <Typography variant="h6" sx={{ color: "text.secondary", lineHeight: 1.7, fontWeight: 400, maxWidth: 700, mx: "auto" }}>
            Empowering diagnostic laboratories with state-of-the-art Laboratory Information Management System (LIMS) technology to deliver faster, highly secure, and error-free reports.
          </Typography>
        </Container>
      </Box>

      {/* Core Mission Section */}
      <Box sx={{ bgcolor: "#ffffff", py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Our Mission
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: "text.primary" }}>
            Modernizing diagnostics one laboratory at a time
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8, maxWidth: 750, mx: "auto" }}>
            At EasyTechnoMed, we believe that healthcare diagnostics should be seamless, instantaneous, and accessible. Our cloud-based pathology software bridges the gap between registration desks, testing stations, referral networks, and patient report delivery.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8, maxWidth: 750, mx: "auto" }}>
            By automating calculations, providing intuitive templates, and tracking referral analytics, we save diagnostic clinics up to 40% of their operational overhead, letting technicians focus on what matters most: medical analysis and patient care.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => router.push("/auth/login")}>
            Get Started Today
          </Button>
        </Container>
      </Box>

      {/* Values Section */}
      <Box sx={{ bgcolor: "background.default", py: { xs: 8, md: 12 }, borderTop: "1px solid rgba(0,0,0,0.03)", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Our Values
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: "text.primary" }}>
              The core principles we stand on
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {coreValues.map((val, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                <Card sx={{ height: "100%", border: "1px solid rgba(0,0,0,0.03)" }}>
                  <CardContent sx={{ p: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ display: "inline-flex", p: 1.5, borderRadius: 3, bgcolor: "rgba(15,118,110,0.06)", alignSelf: "flex-start" }}>
                      {val.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                      {val.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
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
