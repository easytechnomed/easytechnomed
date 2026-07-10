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
  Grid,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Business as BusinessIcon,
  MyLocation as GPSIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
  Phone as PhoneIcon
} from "@mui/icons-material";
import { toast } from "sonner";


export default function OnBoardingPage() {
  const router = useRouter();
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Account Details", "Company & Address"];

  // Form states
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [freeTrialDays, setFreeTrialDays] = useState("14");
  const [companyName, setCompanyName] = useState("");
  
  // Address states
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // UI state
  const [fetchingGPS, setFetchingGPS] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleNext = () => {
    if (activeStep === 0) {
      if (!email.trim() || !password || !confirmPassword || !freeTrialDays) {
        toast.error("Please fill in all required fields.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
      const days = parseInt(freeTrialDays);
      if (isNaN(days) || days < 0) {
        toast.error("Please enter a valid number of trial days.");
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // GPS Location fetcher
  const handleGPSFetch = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setFetchingGPS(true);
    toast.info("Retrieving GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        setLatitude(lat.toString());
        setLongitude(lon.toString());
        
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await res.json();
          
          if (data && data.address) {
            const addr = data.address;
            setAddress1(addr.road || addr.suburb || addr.neighbourhood || "");
            setAddress2(addr.suburb || addr.neighbourhood || "");
            setCity(addr.city || addr.town || addr.village || addr.county || "");
            setState(addr.state || "");
            setPincode(addr.postcode || "");
            setCountry(addr.country || "");
            toast.success("Current address fetched from GPS successfully!");
          } else {
            toast.warning("GPS coordinates fetched, but address lookup failed.");
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          toast.warning("GPS coordinates fetched, but failed to connect to address lookup service.");
        } finally {
          setFetchingGPS(false);
        }
      },
      (error) => {
        console.error("GPS error:", error);
        toast.error(`GPS Fetch failed: ${error.message}`);
        setFetchingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/adminstration/api/onBoarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          mobileNumber: mobileNumber.trim() || null,
          password,
          confirmPassword,
          freeTrialDays,
          companyName,
          address1,
          address2,
          city,
          state,
          pincode,
          country,
          latitude,
          longitude
        })
      }).then(r => r.json());

      if (res.success) {
        toast.success(res.message || "Onboarding completed successfully!");
        setSuccessData(res);
      } else {
        toast.error(res.error || "Failed to complete onboarding.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during onboarding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexGrow: 1,
          overflowY: "auto",
          background: "linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)",
          p: { xs: 2.5, md: 4 }
        }}
      >
        <Card sx={{ maxWidth: successData ? 500 : 640, width: "100%", borderRadius: 4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
              <Box
                component="img"
                src="/logo/logobg.png"
                alt="PathLab Logo"
                sx={{
                  height: 48,
                  width: "auto",
                  mb: 2,
                  borderRadius: "4px"
                }}
              />
              <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
                Admin Onboarding
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5 }}>
                Register your laboratory workspace and import default tests.
              </Typography>
            </Box>

            {successData ? (
              // Success Screen
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", py: 2 }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  Onboarding Complete!
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                  Your laboratory workspace has been successfully registered and populated with default tests.
                </Typography>

                <Box sx={{ width: "100%", bgcolor: "rgba(0,0,0,0.02)", p: 2, borderRadius: 2, mb: 3, textAlign: "left", display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography variant="body2"><strong>Workspace Name:</strong> {successData.workspaceName}</Typography>
                  <Typography variant="body2"><strong>Administrator Email:</strong> {successData.email}</Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  color="primary"
                  onClick={() => router.push("/adminstration")}
                  sx={{ borderRadius: 2, py: 1.2 }}
                >
                  Go to SuperAdmin Login
                </Button>
              </Box>
            ) : (
              // Form Content
              <form onSubmit={handleSubmit}>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {activeStep === 0 ? (
                  // Step 1: Account Details
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <TextField
                      fullWidth
                      required
                      label="Admin Email Address"
                      type="email"
                      size="small"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon fontSize="small" sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        )
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Mobile Number (Optional)"
                      type="tel"
                      size="small"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon fontSize="small" sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        )
                      }}
                    />
                    <TextField
                      fullWidth
                      required
                      label="Password"
                      type="password"
                      size="small"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon fontSize="small" sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        )
                      }}
                    />
                    <TextField
                      fullWidth
                      required
                      label="Confirm Password"
                      type="password"
                      size="small"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon fontSize="small" sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        )
                      }}
                    />
                    <TextField
                      fullWidth
                      required
                      label="Free Trial Days"
                      type="number"
                      size="small"
                      value={freeTrialDays}
                      onChange={(e) => setFreeTrialDays(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimerIcon fontSize="small" sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        )
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      endIcon={<ArrowForwardIcon />}
                      sx={{ borderRadius: 2, mt: 2, py: 1.2 }}
                    >
                      Next Step
                    </Button>
                  </Box>
                ) : (
                  // Step 2: Company & Address Details
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <TextField
                      fullWidth
                      label="Company Name (Optional)"
                      size="small"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon fontSize="small" sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        )
                      }}
                    />

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        Admin Address Details
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleGPSFetch}
                        disabled={fetchingGPS}
                        startIcon={fetchingGPS ? <CircularProgress size={16} /> : <GPSIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        {fetchingGPS ? "Locating..." : "Use Current Location (GPS)"}
                      </Button>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Address Line 1"
                          size="small"
                          value={address1}
                          onChange={(e) => setAddress1(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Address Line 2"
                          size="small"
                          value={address2}
                          onChange={(e) => setAddress2(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          label="City"
                          size="small"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          label="State"
                          size="small"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          label="Pincode"
                          size="small"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Country"
                          size="small"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Latitude"
                          size="small"
                          value={latitude}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Longitude"
                          size="small"
                          value={longitude}
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={handleBack}
                        startIcon={<ArrowBackIcon />}
                        sx={{ borderRadius: 2, flex: 1, py: 1.2 }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        type="submit"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                        sx={{ borderRadius: 2, flex: 1, py: 1.2 }}
                      >
                        {saving ? "Onboarding..." : "Submit"}
                      </Button>
                    </Box>
                  </Box>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </Box>
  );
}

// Inline custom Divider component to ensure compatibility with MUI layout
function Divider({ sx }) {
  return <Box sx={{ borderBottom: "1px solid rgba(0,0,0,0.1)", ...sx }} />;
}
