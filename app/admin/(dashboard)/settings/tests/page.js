"use client";

import React, { Suspense } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import TestsClient from "@/app/(customer)/(dashboard)/settings/tests/testsClient";

export default function AdminSettingsTestsPage() {
  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}>
        ⚙️ System Settings & Preferences
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your profile, set custom test prices, configure letterhead frame PDFs, and adjust system defaults.
      </Typography>

      <Suspense fallback={
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "40vh", gap: 2 }}>
          <CircularProgress size={45} />
          <Typography variant="body2" color="text.secondary">
            Loading test configuration...
          </Typography>
        </Box>
      }>
        <TestsClient />
      </Suspense>
    </Box>
  );
}
