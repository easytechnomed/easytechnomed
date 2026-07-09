"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Pagination
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  OpenInNew as PreviewIcon,
  Info as HelpIcon,
  Person as PersonIcon,
  Science as TestIcon,
  PictureAsPdf as PdfIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  List as ListIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { useSearchParams, useRouter } from "next/navigation";
import { useAdminPermissions } from "@/lib/clientAuth";
import TestsClient from "./tests/testsClient";

function SettingsContent({ defaultSection = "profile" }) {
  const { hasPermission } = useAdminPermissions();
  const canWriteSettings = hasPermission("SETTINGS_WRITE");
  const canWriteTests = hasPermission("TEST_WRITE");
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab");
  const [activeSection, setActiveSection] = useState(defaultSection);

  useEffect(() => {
    if (tab && ["profile", "tests", "pdf"].includes(tab)) {
      setActiveSection(tab);
    }
  }, [tab]);

  // PDF Settings states
  const [settings, setSettings] = useState({
    framePdfUrl: "",
    headerMargin: 140,
    footerMargin: 100,
    useFrameDefault: true,
    authorizedSignatoryName1: "",
    authorizedSignatoryDegree1: "",
    authorizedSignatoryName2: "",
    authorizedSignatoryDegree2: ""
  });

  // Profile states
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);



  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings").then((r) => r.json());
        if (res.success && res.settings) {
          setSettings({
            framePdfUrl: res.settings.framePdfUrl || "",
            headerMargin: res.settings.headerMargin ?? 140,
            footerMargin: res.settings.footerMargin ?? 100,
            useFrameDefault: res.settings.useFrameDefault ?? true,
            authorizedSignatoryName1: res.settings.authorizedSignatoryName1 || "",
            authorizedSignatoryDegree1: res.settings.authorizedSignatoryDegree1 || "",
            authorizedSignatoryName2: res.settings.authorizedSignatoryName2 || "",
            authorizedSignatoryDegree2: res.settings.authorizedSignatoryDegree2 || ""
          });
          setProfileName(res.settings.name || "");
          setProfileEmail(res.settings.email || "");
          setCompanyName(res.settings.companyName || "");
          setMobileNumber(res.settings.mobileNumber || "");
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to load settings data.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);



  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // PDF letterhead actions
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast("Please upload a valid PDF file.", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/settings/upload-frame", {
        method: "POST",
        body: formData,
      }).then((r) => r.json());
      if (res.success && res.url) {
        handleInputChange("framePdfUrl", res.url);
        showToast("Letterhead frame PDF uploaded successfully!", "success");
      } else {
        showToast(res.error || "Failed to upload file.", "error");
      }
    } catch (err) {
      showToast("An error occurred during file upload.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleClearFrame = () => {
    handleInputChange("framePdfUrl", "");
    showToast("Template frame URL cleared. Click Save to apply changes.", "info");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }).then((r) => r.json());
      if (res.success) {
        showToast(res.message, "success");
      } else {
        showToast(res.error || "Failed to save settings.", "error");
      }
    } catch (err) {
      showToast("An error occurred while saving settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Profile actions
  const handleProfileUpdate = async () => {
    if (!profileName.trim()) {
      showToast("Name is required.", "error");
      return;
    }

    if (oldPassword && (!newPassword || !confirmPassword)) {
      showToast("Please fill in both new password fields.", "error");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    setUpdatingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          oldPassword: oldPassword || null,
          newPassword: newPassword || null,
          confirmPassword: confirmPassword || null,
          companyName: companyName || null,
          mobileNumber: mobileNumber || null,
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(res.message || "Profile updated successfully!", "success");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(res.message || "Failed to update profile.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred while updating profile.", "error");
    } finally {
      setUpdatingProfile(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", gap: 2 }}>
        <CircularProgress size={45} />
        <Typography variant="body2" color="text.secondary">
          Loading system configurations...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}>
        ⚙️ System Settings & Preferences
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your profile, set custom test prices, configure letterhead frame PDFs, and adjust system defaults.
      </Typography>

      {activeSection === "profile" && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              👤 Update Profile Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Modify your login name and manage your account password.
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3} sx={{ maxWidth: 600 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Email Address"
                  fullWidth
                  size="small"
                  value={profileEmail}
                  disabled
                  helperText="Login email cannot be changed."
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Your Name"
                  fullWidth
                  size="small"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Company Name"
                  fullWidth
                  size="small"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Mobile Number"
                  fullWidth
                  size="small"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter mobile number"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1, mb: 1, color: "text.primary" }}>
                  Change Password (Optional)
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  size="small"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password to make password updates"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  size="small"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  size="small"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Tooltip title={!canWriteSettings ? "You do not have permission to update profiles" : ""}>
                <span>
                  <Button
                    variant="contained"
                    onClick={handleProfileUpdate}
                    startIcon={updatingProfile ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    disabled={updatingProfile || !canWriteSettings}
                    sx={{ px: 4 }}
                  >
                    {updatingProfile ? "Updating..." : "Update Profile"}
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeSection === "tests" && (
        <TestsClient />
      )}

      {activeSection === "pdf" && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
              📄 PDF Letterhead / Frame Overlay
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload a background A4 PDF that contains your pre-printed branding, logo header, and contact footer.
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={4}>
              {/* Col 1: Preview */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Letterhead Frame Preview
                </Typography>
                {settings.framePdfUrl ? (
                  <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden", bgcolor: "#f8fafc", height: 420, position: "relative", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                    <iframe
                      src={`${settings.framePdfUrl}#toolbar=0&navpanes=0`}
                      width="100%"
                      height="100%"
                      style={{ border: "none" }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ border: "2px dashed", borderColor: "grey.300", borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 3, bgcolor: "grey.50", height: 420, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "3rem", mb: 1, filter: "grayscale(1)" }}>📄</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      No Frame Uploaded
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, mt: 0.5 }}>
                      Upload an A4 template on the right side to preview how your letters look here.
                    </Typography>
                  </Box>
                )}
              </Grid>

              {/* Col 2: Upload and settings */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Upload Letterhead File
                  </Typography>

                  {settings.framePdfUrl ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2, bgcolor: "rgba(15, 118, 110, 0.05)", border: "1px solid", borderColor: "primary.light", borderRadius: 3, mb: 3 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                          Active PDF URL
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: "italic", wordBreak: "break-all", fontWeight: 500, color: "primary.dark", mt: 0.5 }}>
                          {settings.framePdfUrl.split("/").pop()}
                        </Typography>
                      </Box>
                      <Tooltip title="Preview PDF Template in new tab">
                        <IconButton component="a" href={settings.framePdfUrl} target="_blank" color="primary" size="small" sx={{ bgcolor: "white", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={!canWriteSettings ? "You do not have permission to clear templates" : "Delete/Clear Template"}>
                        <span>
                          <IconButton onClick={handleClearFrame} color="error" size="small" sx={{ bgcolor: "white", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }} disabled={!canWriteSettings}>
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Box sx={{ p: 4, border: "2px dashed", borderColor: "grey.300", borderRadius: 3, textAlign: "center", bgcolor: "grey.50", mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                        No background frame PDF configured. Reports will generate on blank white pages.
                      </Typography>
                      <Tooltip title={!canWriteSettings ? "You do not have permission to upload PDF templates" : ""}>
                        <span>
                          <Button
                            variant="contained"
                            component="label"
                            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
                            disabled={uploading || !canWriteSettings}
                            sx={{ textTransform: "none", borderRadius: 2 }}
                          >
                            {uploading ? "Uploading..." : "Upload Letterhead PDF"}
                            <input
                              type="file"
                              hidden
                              accept="application/pdf"
                              onChange={handleFileUpload}
                            />
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  )}
                  {settings.framePdfUrl && (
                    <Tooltip title={!canWriteSettings ? "You do not have permission to upload PDF templates" : ""}>
                      <span>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
                          disabled={uploading || !canWriteSettings}
                          sx={{ textTransform: "none", borderRadius: 2, mb: 3 }}
                        >
                          {uploading ? "Uploading..." : "Upload Different PDF"}
                          <input
                            type="file"
                            hidden
                            accept="application/pdf"
                            onChange={handleFileUpload}
                          />
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </Box>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Header Margin (Top Space)
                      </Typography>
                      <Tooltip title="Height in points (pt) to leave blank at the top of the page for your letterhead logo & header (e.g. 1 inch = 72pt).">
                        <IconButton size="small"><HelpIcon sx={{ fontSize: "1rem" }} /></IconButton>
                      </Tooltip>
                    </Box>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      value={settings.headerMargin}
                      onChange={(e) => handleInputChange("headerMargin", parseInt(e.target.value) || 0)}
                      InputProps={{ inputProps: { min: 0 } }}
                      placeholder="e.g. 140"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Footer Margin (Bottom Space)
                      </Typography>
                      <Tooltip title="Height in points (pt) to leave blank at the bottom of the page for your letterhead footer (e.g. 1.4 inches = 100pt).">
                        <IconButton size="small"><HelpIcon sx={{ fontSize: "1rem" }} /></IconButton>
                      </Tooltip>
                    </Box>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      value={settings.footerMargin}
                      onChange={(e) => handleInputChange("footerMargin", parseInt(e.target.value) || 0)}
                      InputProps={{ inputProps: { min: 0 } }}
                      placeholder="e.g. 100"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.useFrameDefault}
                          onChange={(e) => handleInputChange("useFrameDefault", e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Use Letterhead Frame by Default
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            When checked, the PDF print/export button will default to overlaying reports on the template frame.
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 0.5, color: "text.primary" }}>
                      Authorized Signatories (For Patient Reports)
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Signatory 1 - Full Name"
                      size="small"
                      fullWidth
                      value={settings.authorizedSignatoryName1 || ""}
                      onChange={(e) => handleInputChange("authorizedSignatoryName1", e.target.value)}
                      placeholder="e.g. Dr. Ramesh Kumar"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Signatory 1 - Qualifications / Degree"
                      size="small"
                      fullWidth
                      value={settings.authorizedSignatoryDegree1 || ""}
                      onChange={(e) => handleInputChange("authorizedSignatoryDegree1", e.target.value)}
                      placeholder="e.g. MBBS, MD (Pathology)"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Signatory 2 - Full Name"
                      size="small"
                      fullWidth
                      value={settings.authorizedSignatoryName2 || ""}
                      onChange={(e) => handleInputChange("authorizedSignatoryName2", e.target.value)}
                      placeholder="e.g. Dr. Anita Sharma"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Signatory 2 - Qualifications / Degree"
                      size="small"
                      fullWidth
                      value={settings.authorizedSignatoryDegree2 || ""}
                      onChange={(e) => handleInputChange("authorizedSignatoryDegree2", e.target.value)}
                      placeholder="e.g. DCP, Consulting Pathologist"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Tooltip title={!canWriteSettings ? "You do not have permission to modify settings" : ""}>
                <span>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    disabled={saving || uploading || !canWriteSettings}
                    sx={{ px: 4 }}
                  >
                    {saving ? "Saving..." : "Save Settings"}
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      )}



      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default function SettingsPage({ defaultSection = "profile" }) {
  return (
    <Suspense fallback={
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", gap: 2 }}>
        <CircularProgress size={45} />
        <Typography variant="body2" color="text.secondary">
          Loading system configurations...
        </Typography>
      </Box>
    }>
      <SettingsContent defaultSection={defaultSection} />
    </Suspense>
  );
}
