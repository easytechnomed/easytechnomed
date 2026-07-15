"use client";

import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Grid
} from "@mui/material";
import {
  Close as CloseIcon,
  Badge as BadgeIcon,
  School as SchoolIcon,
  Business as ClinicIcon,
  Room as RoomIcon,
  Percent as PercentIcon
} from "@mui/icons-material";

export default function AddDoctorDrawer({ open, onClose, onSuccess, initialName = "" }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [degree, setDegree] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");
  const [incentive, setIncentive] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill name if passed from autocomplete input
  useEffect(() => {
    if (open) {
      setName(initialName);
      setError("");
    }
  }, [open, initialName]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Doctor name is required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || null,
          degree: degree.trim() || null,
          address: address.trim() || null,
          clinicName: clinicName.trim() || null,
          incentivePercent: parseFloat(incentive) || 0,
        }),
      }).then((r) => r.json());

      if (res.success) {
        // Reset form fields
        setName("");
        setCode("");
        setDegree("");
        setClinicName("");
        setAddress("");
        setIncentive("0");

        if (onSuccess) {
          onSuccess(res.doctor, res.message);
        }
      } else {
        setError(res.message || "Failed to add doctor.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: "100%", md: 500 },
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid",
          borderColor: "divider",
          boxShadow: "-10px 0 30px rgba(0,0,0,0.08)"
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          pb: 2
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
            Add New Doctor
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Register referral clinical partner
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ border: "1px solid", borderColor: "divider" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      {/* Content Form */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          flexGrow: 1,
          overflowY: "auto",
          bgcolor: "#fdfdfd"
        }}
      >
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Form Fields Grid */}
        <Grid container spacing={2.5}>
          {/* Row 1: Doctor Name & Doctor Code (2 fields) */}
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              label="Doctor Name"
              fullWidth
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Dr. John Doe"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Doctor Code (Optional)"
              fullWidth
              size="small"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Auto-generated"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Row 2: Qualification / Degree (1 multiline field) */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Qualification / Degree (Optional)"
              fullWidth
              multiline
              rows={2}
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="e.g. MBBS, MD (Medicine)\nFellowship in Cardiology"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                    <SchoolIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Row 3: Clinic Name & Incentive (2 fields) */}
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              label="Clinic Name (Optional)"
              fullWidth
              size="small"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="e.g. Metro Diagnostics"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ClinicIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Incentive (%)"
              fullWidth
              size="small"
              type="number"
              value={incentive}
              onChange={(e) => setIncentive(e.target.value)}
              placeholder="e.g. 10"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <PercentIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Row 4: Clinic Address (1 multiline field) */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Clinic Address (Optional)"
              fullWidth
              multiline
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Phase 1, Noida"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                    <RoomIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Action Footer */}
      <Box
        sx={{
          p: 3,
          pb: { xs: 4, sm: 3 },
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper"
        }}
      >
        <Button onClick={onClose} color="inherit" disabled={loading} sx={{ borderRadius: 2, px: 3 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !name.trim()}
          sx={{ borderRadius: 2, px: 4, textTransform: "none", fontWeight: 700 }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : "Add Doctor"}
        </Button>
      </Box>
    </Drawer>
  );
}
