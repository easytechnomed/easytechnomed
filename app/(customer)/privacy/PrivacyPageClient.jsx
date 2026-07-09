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
    <Box>
      {/* Hero Header */}
      <Box
        sx={{
          background: "linear-gradient(180deg, rgba(15, 118, 110, 0.08) 0%, rgba(248, 250, 252, 0) 100%)",
          color: "text.primary",
          pt: { xs: 18, md: 22 },
          pb: { xs: 10, md: 12 },
          textAlign: "center"
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: "2.3rem", md: "3.2rem" }, color: "text.primary" }}>
            Privacy Policy
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "text.secondary", fontWeight: 400 }}>
            Last updated: July 8, 2026
          </Typography>
        </Container>
      </Box>

      {/* Content Section */}
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 10 } }}>
        <Card variant="outlined" sx={{ border: "1px solid rgba(0,0,0,0.06)", p: { xs: 3, md: 5 } }}>
          <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "text.primary" }}>
                1. Overview
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Welcome to EasyTechnoMed. We value your privacy and are committed to protecting the medical, administrative, and clinical data you entrust to us. This Privacy Policy details how we collect, store, verify, and transmit data for patient registrations, referral metrics, and reports generated through our LIMS systems.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "text.primary" }}>
                2. Data Collection & Processing
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2 }}>
                We collect information to provide diagnostic automation, refer doctor listings, and generate pathology reports. This information falls under two categories:
              </Typography>
              <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <li>
                  <strong>Administrative Data:</strong> User login credentials, admin accounts, workspace slug designations, and clinic billing configurations.
                </li>
                <li>
                  <strong>Clinical & Patient Data:</strong> Patient names, age/gender variables, mobile numbers for report deliveries, referenced doctor names, test parameters, and result inputs.
                </li>
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "text.primary" }}>
                3. HIPAA Compliance & Security
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                All clinical records and patient data variables processed by EasyTechnoMed adhere to strict HIPAA confidentiality practices. The database structures enforce complete multi-tenant isolation, preventing data leaks between distinct workspace laboratories. All network calls are encrypted via TLS (SSL), and persistent databases use Advanced Encryption Standards (AES) at rest.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "text.primary" }}>
                4. Data Retention & Deletion
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Workspaces retain data for as long as their subscription contract is active. Diagnostic records, logs, and doctor summaries can be archived or deleted by authorized personnel with write-permissions. Deleting a laboratory workspace deletes connected records, reference parameters, and client files permanently from our cloud database.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: "text.primary" }}>
                5. Contact Information
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                For compliance questions, data backup audits, or privacy requests, please send an email to our support team at:
                <br />
                <Typography component="span" color="primary.main" sx={{ fontWeight: 700, mt: 1, display: "inline-block" }}>
                  support@easytechnomed.com
                </Typography>
              </Typography>
            </Box>

          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
