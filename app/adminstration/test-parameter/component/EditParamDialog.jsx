"use client";

import React, { useState } from "react";
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
  Box
} from "@mui/material";
import { toast } from "sonner";

export default function EditParamDialog({ open, onClose, param, onSaveSuccess }) {
  const [editParamForm, setEditParamForm] = useState(() => {
    if (param) {
      return {
        id: param.id,
        name: param.name || "",
        code: param.code || "",
        unit: param.unit || "",
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
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Parameter Name *"
                size="small"
                value={editParamForm.name}
                onChange={(e) => setEditParamForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Variable Code (e.g. NEUT)"
                size="small"
                value={editParamForm.code}
                onChange={(e) => setEditParamForm((prev) => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^a-zA-Z0-9_]/g, "") }))}
                helperText="Alphanumeric code for math formulas"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Unit"
                size="small"
                value={editParamForm.unit}
                onChange={(e) => setEditParamForm((prev) => ({ ...prev, unit: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Reference Values & Ranges
          </Typography>

          <Grid container spacing={3}>
            {/* Male Ranges */}
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", display: "block", mb: 1 }}>Male References</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Min Value" value={editParamForm.minValMale} onChange={(e) => setEditParamForm((prev) => ({ ...prev, minValMale: e.target.value }))} />
                <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Max Value" value={editParamForm.maxValMale} onChange={(e) => setEditParamForm((prev) => ({ ...prev, maxValMale: e.target.value }))} />
                <TextField fullWidth size="small" label="Range Text" value={editParamForm.normalRangeMale} onChange={(e) => setEditParamForm((prev) => ({ ...prev, normalRangeMale: e.target.value }))} />
              </Box>
            </Grid>

            {/* Female Ranges */}
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "secondary.main", display: "block", mb: 1 }}>Female References</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Min Value" value={editParamForm.minValFemale} onChange={(e) => setEditParamForm((prev) => ({ ...prev, minValFemale: e.target.value }))} />
                <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Max Value" value={editParamForm.maxValFemale} onChange={(e) => setEditParamForm((prev) => ({ ...prev, maxValFemale: e.target.value }))} />
                <TextField fullWidth size="small" label="Range Text" value={editParamForm.normalRangeFemale} onChange={(e) => setEditParamForm((prev) => ({ ...prev, normalRangeFemale: e.target.value }))} />
              </Box>
            </Grid>

            {/* Baby Ranges */}
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main", display: "block", mb: 1 }}>Baby References</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Min Value" value={editParamForm.minValBaby} onChange={(e) => setEditParamForm((prev) => ({ ...prev, minValBaby: e.target.value }))} />
                <TextField fullWidth size="small" type="number" inputProps={{ step: "any" }} label="Max Value" value={editParamForm.maxValBaby} onChange={(e) => setEditParamForm((prev) => ({ ...prev, maxValBaby: e.target.value }))} />
                <TextField fullWidth size="small" label="Range Text" value={editParamForm.normalRangeBaby} onChange={(e) => setEditParamForm((prev) => ({ ...prev, normalRangeBaby: e.target.value }))} />
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Default Fallback Range Text" value={editParamForm.normalRangeDefault} onChange={(e) => setEditParamForm((prev) => ({ ...prev, normalRangeDefault: e.target.value }))} />
            </Grid>
          </Grid>
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
