"use client";

import React, { useState, useMemo } from "react";
import {
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip
} from "@mui/material";
import {
  Numbers as NumbersIcon,
  CheckCircle as BooleanIcon,
  Notes as NotesIcon,
  AutoAwesome as PresetIcon
} from "@mui/icons-material";
import { toast } from "sonner";

const QUALITATIVE_PRESETS = [
  { label: "Negative / Positive", options: ["Negative", "Positive"], defaultNormal: "Negative" },
  { label: "Non-Reactive / Reactive", options: ["Non-Reactive", "Reactive"], defaultNormal: "Non-Reactive" },
  { label: "Absent / Present", options: ["Absent", "Present"], defaultNormal: "Absent" },
  { label: "Nil / Trace / + / ++ / +++", options: ["Nil", "Trace", "+", "++", "+++", "++++"], defaultNormal: "Nil" },
  { label: "Not Detected / Detected", options: ["Not Detected", "Detected"], defaultNormal: "Not Detected" },
  { label: "Normal / Abnormal", options: ["Normal", "Abnormal"], defaultNormal: "Normal" },
  { label: "Clear / Turbid / Hazy", options: ["Clear", "Slightly Hazy", "Hazy", "Turbid"], defaultNormal: "Clear" },
  { label: "Not Seen / Seen", options: ["Not Seen", "Seen"], defaultNormal: "Not Seen" },
  { label: "Non-Immune / Immune", options: ["Non-Immune", "Immune"], defaultNormal: "Non-Immune" },
];

export default function EditParamDialog({ open, onClose, param, onSaveSuccess }) {
  const [editParamForm, setEditParamForm] = useState(() => {
    if (param) {
      // Determine initial valueType if not explicitly present
      let initialType = param.valueType || "NUMERIC";
      if (!param.valueType) {
        const norm = (param.normalRangeDefault || "").toLowerCase();
        if (
          norm.includes("negative") ||
          norm.includes("reactive") ||
          norm.includes("absent") ||
          norm.includes("detected") ||
          norm.includes("nil") ||
          (param.minValMale === null && param.maxValMale === null && param.normalRangeDefault)
        ) {
          initialType = "OPTIONS";
        }
      }

      return {
        id: param.id,
        name: param.name || "",
        code: param.code || "",
        unit: param.unit || "",
        valueType: initialType,
        options: param.options || (initialType === "OPTIONS" ? (param.normalRangeDefault?.includes("reactive") ? "Non-Reactive,Reactive" : "Negative,Positive") : ""),
        minValMale: param.minValMale !== null && param.minValMale !== undefined ? param.minValMale.toString() : "",
        maxValMale: param.maxValMale !== null && param.maxValMale !== undefined ? param.maxValMale.toString() : "",
        normalRangeMale: param.normalRangeMale || "",
        minValFemale: param.minValFemale !== null && param.minValFemale !== undefined ? param.minValFemale.toString() : "",
        maxValFemale: param.maxValFemale !== null && param.maxValFemale !== undefined ? param.maxValFemale.toString() : "",
        normalRangeFemale: param.normalRangeFemale || "",
        minValBaby: param.minValBaby !== null && param.minValBaby !== undefined ? param.minValBaby.toString() : "",
        maxValBaby: param.maxValBaby !== null && param.maxValBaby !== undefined ? param.maxValBaby.toString() : "",
        normalRangeBaby: param.normalRangeBaby || "",
        normalRangeDefault: param.normalRangeDefault || ""
      };
    } else {
      return {
        id: null,
        name: "",
        code: "",
        unit: "",
        valueType: "NUMERIC",
        options: "",
        minValMale: "",
        maxValMale: "",
        normalRangeMale: "",
        minValFemale: "",
        maxValFemale: "",
        normalRangeFemale: "",
        minValBaby: "",
        maxValBaby: "",
        normalRangeBaby: "",
        normalRangeDefault: ""
      };
    }
  });

  const [saving, setSaving] = useState(false);

  const parsedOptions = useMemo(() => {
    if (!editParamForm.options) return [];
    return editParamForm.options
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }, [editParamForm.options]);

  const handlePresetSelect = (preset) => {
    const optStr = preset.options.join(", ");
    setEditParamForm((prev) => ({
      ...prev,
      valueType: "OPTIONS",
      options: optStr,
      normalRangeDefault: preset.defaultNormal,
      unit: prev.unit || ""
    }));
  };

  const handleSaveParamEdit = async (e) => {
    e.preventDefault();
    if (!editParamForm.name.trim()) {
      toast.error("Parameter name is required.");
      return;
    }
    setSaving(true);
    try {
      const isNew = editParamForm.id === null;
      const url = isNew ? "/adminstration/api/parameters" : `/adminstration/api/parameters/${editParamForm.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editParamForm)
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message || (isNew ? "Parameter created successfully." : "Parameter updated successfully."));
        onSaveSuccess(res.parameter, isNew);
        onClose();
      } else {
        toast.error(res.error || `Failed to ${isNew ? "create" : "update"} parameter.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      maxWidth="md"
      fullWidth
    >
      <form onSubmit={handleSaveParamEdit}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editParamForm.id === null ? "Add New Parameter" : "Edit Parameter Dictionary Entry"}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 3 }}>
          {/* Top Metadata */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Parameter Name *"
                size="small"
                value={editParamForm.name}
                onChange={(e) => setEditParamForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. HIV I & II Antibody, Blood Glucose, Urine Albumin"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Variable Code (e.g. HIV1)"
                size="small"
                value={editParamForm.code}
                onChange={(e) => setEditParamForm((prev) => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^a-zA-Z0-9_]/g, "") }))}
                helperText="Alphanumeric formula code"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Unit"
                size="small"
                value={editParamForm.unit}
                onChange={(e) => setEditParamForm((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder={editParamForm.valueType === "NUMERIC" ? "e.g. mg/dL" : "Optional / None"}
              />
            </Grid>
          </Grid>

          {/* Parameter Result Type Selector */}
          <Box sx={{ bgcolor: "rgba(124, 58, 237, 0.04)", p: 2, borderRadius: 2, border: "1px solid rgba(124, 58, 237, 0.15)" }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", mb: 1.5 }}>
              Parameter Result Type &amp; Input Mode
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={editParamForm.valueType}
              onChange={(e, newType) => {
                if (newType) {
                  setEditParamForm((prev) => ({
                    ...prev,
                    valueType: newType,
                    ...(newType === "OPTIONS" && !prev.options ? { options: "Negative, Positive", normalRangeDefault: prev.normalRangeDefault || "Negative" } : {})
                  }));
                }
              }}
              sx={{ bgcolor: "#ffffff" }}
            >
              <ToggleButton value="NUMERIC" sx={{ py: 1, gap: 1 }}>
                <NumbersIcon fontSize="small" />
                <Box sx={{ textAlign: "left" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Numeric (Range / Min-Max)</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>Quantitative numbers with units</Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="OPTIONS" sx={{ py: 1, gap: 1 }}>
                <BooleanIcon fontSize="small" />
                <Box sx={{ textAlign: "left" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Qualitative / Options / Boolean</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>Negative/Positive, Reactive, Absent/Present</Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="TEXT" sx={{ py: 1, gap: 1 }}>
                <NotesIcon fontSize="small" />
                <Box sx={{ textAlign: "left" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Free Text Note</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>Descriptive smear or biopsy note</Typography>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Conditional Sections based on valueType */}
          {editParamForm.valueType === "OPTIONS" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "#fafafa" }}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <PresetIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    Quick Preset Templates (1-Click Setup)
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                  {QUALITATIVE_PRESETS.map((preset) => (
                    <Chip
                      key={preset.label}
                      label={preset.label}
                      clickable
                      color={editParamForm.options === preset.options.join(", ") ? "primary" : "default"}
                      variant={editParamForm.options === preset.options.join(", ") ? "filled" : "outlined"}
                      onClick={() => handlePresetSelect(preset)}
                      sx={{ fontWeight: 600, fontSize: "0.8rem", mb: 0.5 }}
                    />
                  ))}
                </Stack>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Selectable Options (comma-separated) *"
                    value={editParamForm.options}
                    onChange={(e) => setEditParamForm((prev) => ({ ...prev, options: e.target.value }))}
                    helperText="Comma-separated choices (e.g. Negative, Positive or Nil, Trace, +, ++, +++)"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  {parsedOptions.length > 0 ? (
                    <FormControl fullWidth size="small">
                      <InputLabel id="normal-choice-label">Default / Normal Value *</InputLabel>
                      <Select
                        labelId="normal-choice-label"
                        label="Default / Normal Value *"
                        value={editParamForm.normalRangeDefault || (parsedOptions[0] || "")}
                        onChange={(e) => setEditParamForm((prev) => ({ ...prev, normalRangeDefault: e.target.value }))}
                      >
                        {parsedOptions.map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt} (Normal / Expected)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      size="small"
                      label="Default Normal Choice"
                      value={editParamForm.normalRangeDefault}
                      onChange={(e) => setEditParamForm((prev) => ({ ...prev, normalRangeDefault: e.target.value }))}
                      placeholder="e.g. Negative"
                    />
                  )}
                </Grid>
              </Grid>

              {/* Preview of quick-buttons in result entry */}
              {parsedOptions.length > 0 && (
                <Box sx={{ p: 1.5, bgcolor: "#ffffff", borderRadius: 1.5, border: "1px dashed #cbd5e1" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 1 }}>
                    Preview: Result Entry 1-Click Buttons for Technician
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {parsedOptions.map((opt) => {
                      const isNormal = opt.toLowerCase() === (editParamForm.normalRangeDefault || "").toLowerCase();
                      return (
                        <Chip
                          key={opt}
                          label={opt}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: isNormal ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            color: isNormal ? "#059669" : "#dc2626",
                            border: `1px solid ${isNormal ? "#059669" : "#dc2626"}`
                          }}
                        />
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Box>
          )}

          {editParamForm.valueType === "NUMERIC" && (
            <>
              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Numerical Reference Values &amp; Ranges (Male / Female / Baby)
              </Typography>

              <Grid container spacing={3}>
                {/* Male Ranges */}
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", display: "block", mb: 1 }}>Male References</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Min Value" value={editParamForm.minValMale} onChange={(e) => setEditParamForm((prev) => ({ ...prev, minValMale: e.target.value }))} />
                    <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Max Value" value={editParamForm.maxValMale} onChange={(e) => setEditParamForm((prev) => ({ ...prev, maxValMale: e.target.value }))} />
                    <TextField fullWidth size="small" label="Range Text" value={editParamForm.normalRangeMale} onChange={(e) => setEditParamForm((prev) => ({ ...prev, normalRangeMale: e.target.value }))} placeholder="e.g. 13.5 - 17.5" />
                  </Box>
                </Grid>

                {/* Female Ranges */}
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "secondary.main", display: "block", mb: 1 }}>Female References</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Min Value" value={editParamForm.minValFemale} onChange={(e) => setEditParamForm((prev) => ({ ...prev, minValFemale: e.target.value }))} />
                    <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Max Value" value={editParamForm.maxValFemale} onChange={(e) => setEditParamForm((prev) => ({ ...prev, maxValFemale: e.target.value }))} />
                    <TextField fullWidth size="small" label="Range Text" value={editParamForm.normalRangeFemale} onChange={(e) => setEditParamForm((prev) => ({ ...prev, normalRangeFemale: e.target.value }))} placeholder="e.g. 12.0 - 15.5" />
                  </Box>
                </Grid>

                {/* Baby Ranges */}
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main", display: "block", mb: 1 }}>Baby / Child References</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Min Value" value={editParamForm.minValBaby} onChange={(e) => setEditParamForm((prev) => ({ ...prev, minValBaby: e.target.value }))} />
                    <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Max Value" value={editParamForm.maxValBaby} onChange={(e) => setEditParamForm((prev) => ({ ...prev, maxValBaby: e.target.value }))} />
                    <TextField fullWidth size="small" label="Range Text" value={editParamForm.normalRangeBaby} onChange={(e) => setEditParamForm((prev) => ({ ...prev, normalRangeBaby: e.target.value }))} placeholder="e.g. 11.0 - 14.0" />
                  </Box>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Default Fallback Range Text" value={editParamForm.normalRangeDefault} onChange={(e) => setEditParamForm((prev) => ({ ...prev, normalRangeDefault: e.target.value }))} placeholder="e.g. 12.0 - 17.0" />
                </Grid>
              </Grid>
            </>
          )}

          {editParamForm.valueType === "TEXT" && (
            <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "#fafafa" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Free Text parameters provide an open multiline/single-line entry in result processing without numeric range restrictions.
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="Default Note / Expected Finding (optional)"
                value={editParamForm.normalRangeDefault}
                onChange={(e) => setEditParamForm((prev) => ({ ...prev, normalRangeDefault: e.target.value }))}
                placeholder="e.g. No abnormality seen / Normal morphology"
              />
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? "Saving..." : (editParamForm.id === null ? "Create Parameter" : "Save Changes")}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
