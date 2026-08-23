"use client";

import React, { Suspense } from "react";
import { Box, Typography, CircularProgress, Chip } from "@mui/material";
import { PictureAsPdf as PdfIcon, Tune as CustomizeIcon } from "@mui/icons-material";
import PdfSettingsClient from "./pdfClient";

export default function SettingsPdfPage() {
  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: "primary.main", color: "white", display: "flex" }}>
            <PdfIcon fontSize="medium" />
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
                PDF Report Studio & Customization
              </Typography>
              <Chip
                icon={<CustomizeIcon sx={{ fontSize: "14px !important" }} />}
                label="Live Customizer"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: "0.75rem" }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
              Customize table column positions via drag & drop, colors, fonts, margins, and letterhead overlay with real-time live preview.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Suspense
        fallback={
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "40vh", gap: 2 }}>
            <CircularProgress size={45} />
            <Typography variant="body2" color="text.secondary">
              Loading PDF studio configuration...
            </Typography>
          </Box>
        }
      >
        <PdfSettingsClient />
      </Suspense>
    </Box>
  );
}
