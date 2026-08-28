"use client";

import React from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Divider
} from "@mui/material";

export default function PrivacyPage() {
  return (
    <Box sx={{ bgcolor: "#FFFFFF", minHeight: "100vh" }}>
      {/* Hero Header */}
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          color: "#111827",
          pt: { xs: 18, md: 22 },
          pb: { xs: 10, md: 12 },
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
            left: "-40px",
            width: "180px",
            height: "180px",
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
              Legal & Compliance
            </Typography>
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: "2.5rem", sm: "3.25rem", md: "3.85rem" },
              color: "#111827",
              letterSpacing: "-0.02em"
            }}
          >
            Privacy Policy
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontFamily: "var(--font-outfit), sans-serif",
              color: "#6B7280",
              fontWeight: 500
            }}
          >
            Last updated: July 8, 2026
          </Typography>
        </Container>
      </Box>

      {/* Content Section (Solid Gray 100 Background) */}
      <Box sx={{ bgcolor: "#F3F4F6", py: { xs: 8, md: 12 }, borderTop: "2px solid #E5E7EB" }}>
        <Container maxWidth="md">
          <Card
            elevation={0}
            sx={{
              border: "2px solid #E5E7EB",
              bgcolor: "#FFFFFF",
              borderRadius: "10px",
              boxShadow: "none !important",
              p: { xs: 3.5, md: 6 }
            }}
          >
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3.5, p: 0 }}>
              
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#111827", fontSize: "1.3rem", fontFamily: "var(--font-outfit), sans-serif" }}>
                  1. Overview
                </Typography>
                <Typography variant="body1" sx={{ color: "#4B5563", lineHeight: 1.8, fontSize: "0.98rem" }}>
                  Welcome to EasyTechnoMed. We value your privacy and are committed to protecting the medical, administrative, and clinical data you entrust to us. This Privacy Policy details how we collect, store, verify, and transmit data for patient registrations, referral metrics, and reports generated through our LIMS systems.
                </Typography>
              </Box>

              <Divider sx={{ borderColor: "#E5E7EB" }} />

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#111827", fontSize: "1.3rem", fontFamily: "var(--font-outfit), sans-serif" }}>
                  2. Data Collection & Processing
                </Typography>
                <Typography variant="body1" sx={{ color: "#4B5563", lineHeight: 1.8, mb: 2, fontSize: "0.98rem" }}>
                  We collect information to provide diagnostic automation, refer doctor listings, and generate pathology reports. This information falls under two categories:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ color: "#4B5563", pl: 3, display: "flex", flexDirection: "column", gap: 1.5, fontSize: "0.98rem" }}>
                  <li>
                    <strong style={{ color: "#111827" }}>Administrative Data:</strong> User login credentials, admin accounts, workspace slug designations, and clinic billing configurations.
                  </li>
                  <li>
                    <strong style={{ color: "#111827" }}>Clinical & Patient Data:</strong> Patient names, age/gender variables, mobile numbers for report deliveries, referenced doctor names, test parameters, and result inputs.
                  </li>
                </Typography>
              </Box>

              <Divider sx={{ borderColor: "#E5E7EB" }} />

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#111827", fontSize: "1.3rem", fontFamily: "var(--font-outfit), sans-serif" }}>
                  3. Security & Multi-Tenant Isolation
                </Typography>
                <Typography variant="body1" sx={{ color: "#4B5563", lineHeight: 1.8, fontSize: "0.98rem" }}>
                  All clinical records and patient data variables processed by EasyTechnoMed adhere to strict medical data security practices. The database structures enforce complete multi-tenant isolation, preventing data leaks between distinct workspace laboratories. All network communications are encrypted via TLS/HTTPS, and databases employ Advanced Encryption Standards (AES) at rest.
                </Typography>
              </Box>

              <Divider sx={{ borderColor: "#E5E7EB" }} />

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#111827", fontSize: "1.3rem", fontFamily: "var(--font-outfit), sans-serif" }}>
                  4. Data Retention & Deletion
                </Typography>
                <Typography variant="body1" sx={{ color: "#4B5563", lineHeight: 1.8, fontSize: "0.98rem" }}>
                  Workspaces retain data for as long as their subscription contract is active. Diagnostic records, logs, and doctor summaries can be archived or deleted by authorized personnel with write-permissions. Deleting a laboratory workspace deletes connected records, reference parameters, and client files permanently from our cloud database.
                </Typography>
              </Box>

              <Divider sx={{ borderColor: "#E5E7EB" }} />

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "#111827", fontSize: "1.3rem", fontFamily: "var(--font-outfit), sans-serif" }}>
                  5. Contact Information
                </Typography>
                <Typography variant="body1" sx={{ color: "#4B5563", lineHeight: 1.8, fontSize: "0.98rem" }}>
                  For compliance questions, data backup audits, or privacy requests, please send an email to our support team at:
                  <br />
                  <Typography component="span" sx={{ color: "#0f766e", fontWeight: 800, mt: 1, display: "inline-block" }}>
                    support@easytechnomed.com
                  </Typography>
                </Typography>
              </Box>

            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
}
