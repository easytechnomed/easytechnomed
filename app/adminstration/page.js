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
  CircularProgress
} from "@mui/material";
import { Shield as ShieldIcon } from "@mui/icons-material";
// Action import removed - using REST API instead

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
      <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}>
        <CardContent sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Box
            component="img"
            src="/logo/logobg.png"
            alt="PathLab Logo"
            sx={{
              height: 54,
              width: "auto",
              mb: 3,
              borderRadius: "4px"
            }}
          />

          <Box
            sx={{
              p: 0.8,
              px: 2,
              borderRadius: "20px",
              bgcolor: "rgba(124, 58, 237, 0.08)",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 3,
            }}
          >
            <ShieldIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>
              Secure Area
            </Typography>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "text.primary", textAlign: "center" }}>
            SuperAdmin Login
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 4, textAlign: "center" }}>
            Please authenticate to access the console.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: "100%", mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <TextField
              label="Email Address"
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
  );
}
