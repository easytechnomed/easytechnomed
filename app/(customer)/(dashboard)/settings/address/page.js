"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Divider,
  CircularProgress
} from "@mui/material";
import {
  Save as SaveIcon,
  LocationOn as LocationIcon
} from "@mui/icons-material";
import { toast } from "sonner";

export default function AddressSettingsPage() {
  const [address, setAddress] = useState({
    address1: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
    country: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadAddress() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings/address").then((r) => r.json());
        if (res.success && res.address) {
          setAddress({
            address1: res.address.address1 || "",
            address2: res.address.address2 || "",
            city: res.address.city || "",
            state: res.address.state || "",
            pincode: res.address.pincode || "",
            country: res.address.country || ""
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load address settings.");
      } finally {
        setLoading(false);
      }
    }
    loadAddress();
  }, []);

  const handleChange = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(address)
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message || "Address updated successfully!");
      } else {
        toast.error(res.error || "Failed to save address.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving address.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "50vh", gap: 2 }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Loading address details...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}>
        📍 Address Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure the official location details for your lab workspace. This address will be associated with your account.
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 800 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <LocationIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              🏢 Office / Laboratory Address
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, pl: 4 }}>
            Enter your physical office, clinic, or laboratory address.
          </Typography>
          <Divider sx={{ mb: 4 }} />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address Line 1"
                fullWidth
                size="small"
                value={address.address1}
                onChange={(e) => handleChange("address1", e.target.value)}
                placeholder="Street address, P.O. box, company name"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address Line 2"
                fullWidth
                size="small"
                value={address.address2}
                onChange={(e) => handleChange("address2", e.target.value)}
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="City"
                fullWidth
                size="small"
                value={address.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Enter city"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="State / Province / Region"
                fullWidth
                size="small"
                value={address.state}
                onChange={(e) => handleChange("state", e.target.value)}
                placeholder="Enter state"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Postal / Zip Code"
                fullWidth
                size="small"
                value={address.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                placeholder="Enter pincode"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Country"
                fullWidth
                size="small"
                value={address.country}
                onChange={(e) => handleChange("country", e.target.value)}
                placeholder="Enter country"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              disabled={saving}
              sx={{ px: 4, py: 1 }}
            >
              {saving ? "Saving..." : "Save Address"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
