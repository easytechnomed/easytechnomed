"use client";

import React, { Suspense } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import PaymentsClient from "./paymentsClient";

export default function SettingsPaymentsPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
            gap: 2,
          }}
        >
          <CircularProgress size={45} color="primary" />
          <Typography variant="body2" color="text.secondary">
            Loading subscription billing records...
          </Typography>
        </Box>
      }
    >
      <PaymentsClient />
    </Suspense>
  );
}
