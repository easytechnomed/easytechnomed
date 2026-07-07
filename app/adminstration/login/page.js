"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  ThemeProvider,
  createTheme,
  CssBaseline
} from "@mui/material";
import { Shield as ShieldIcon } from "@mui/icons-material";
// Action import removed - using REST API instead

// Custom dark theme for superadmin
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#14b8a6", // Teal 500
    },
    background: {
      default: "#0f172a", // Slate 900
      paper: "#1e293b", // Slate 800
    },
  },
  typography: {
    fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
  },
});

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/adminstration/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).then((r) => r.json());
      
      if (res.success) {
        router.push(res.redirect);
      } else {
        setError(res.message || "Invalid credentials.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}>
          <CardContent sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: "rgba(20, 184, 166, 0.1)",
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2.5,
              }}
            >
              <ShieldIcon sx={{ fontSize: 36 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, textAlign: "center" }}>
              Administration Panel
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: "center" }}>
              SuperAdmin login for managing workspaces & admin accounts.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: "100%", mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              <TextField
                label="SuperAdmin Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                sx={{ mb: 2.5 }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                sx={{ mb: 4 }}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.2,
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Verify Identity"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
