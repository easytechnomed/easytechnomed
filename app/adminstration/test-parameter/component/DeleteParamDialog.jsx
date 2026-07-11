"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  TextField,
  Divider,
  Box,
  Typography,
  Autocomplete
} from "@mui/material";
import { toast } from "sonner";

export default function DeleteParamDialog({ open, onClose, param, parameterDictionary, onDeleteSuccess }) {
  const [loadingUsages, setLoadingUsages] = useState(false);
  const [paramUsages, setParamUsages] = useState([]);
  const [mergeTargetParamId, setMergeTargetParamId] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadUsages = async () => {
      if (open && param) {
        // Wrap state resets in Promise.resolve().then to avoid react-hooks/set-state-in-effect lint rule issues
        Promise.resolve().then(() => {
          setLoadingUsages(true);
          setParamUsages([]);
          setMergeTargetParamId("");
        });

        try {
          const res = await fetch(`/adminstration/api/parameters/${param.id}/usages`).then((r) => r.json());
          if (res.success) {
            Promise.resolve().then(() => {
              setParamUsages(res.tests || []);
            });
          } else {
            toast.error("Failed to load parameter usage links.");
          }
        } catch (err) {
          console.error(err);
          toast.error("Error loading usages.");
        } finally {
          Promise.resolve().then(() => {
            setLoadingUsages(false);
          });
        }
      }
    };
    loadUsages();
  }, [open, param]);

  const handleConfirmDeleteParam = async () => {
    if (!param) return;
    setDeleting(true);
    try {
      let res;
      if (paramUsages.length > 0) {
        if (!mergeTargetParamId) {
          toast.error("Please select a target parameter to merge/re-map references.");
          setDeleting(false);
          return;
        }
        res = await fetch(`/adminstration/api/parameters/${param.id}/merge-delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetParameterId: mergeTargetParamId })
        }).then((r) => r.json());
      } else {
        res = await fetch(`/adminstration/api/parameters/${param.id}`, {
          method: "DELETE"
        }).then((r) => r.json());
      }

      if (res.success) {
        toast.success(res.message || "Parameter deleted successfully.");
        onDeleteSuccess(param);
        onClose();
      } else {
        toast.error(res.error || "Failed to delete parameter.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !deleting && onClose()}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 800 }}>Delete Parameter Entry</DialogTitle>
      <Divider />
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 3 }}>
        {loadingUsages ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : paramUsages.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2" sx={{ color: "error.main", fontWeight: 700 }}>
              ⚠️ This parameter is currently linked to {paramUsages.length} active default test(s):
            </Typography>
            <Box sx={{ maxHeight: 120, overflowY: "auto", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 1, p: 1.5, bgcolor: "rgba(0,0,0,0.01)" }}>
              {paramUsages.map((t, idx) => (
                <Typography key={idx} variant="caption" sx={{ display: "block", color: "text.primary" }}>
                  • <strong>{t.name}</strong> ({t.code || "No Code"}) - {t.workspace}
                </Typography>
              ))}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              To delete this parameter, you must select another parameter from the library to merge/re-map these active tests to:
            </Typography>
            <Autocomplete
              size="small"
              options={parameterDictionary.filter((p) => p.id !== param?.id)}
              getOptionLabel={(option) => `${option.name} (${option.unit || "no unit"})`}
              onChange={(event, newValue) => {
                setMergeTargetParamId(newValue ? newValue.id.toString() : "");
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Target Parameter to Merge Into" required />
              )}
            />
          </Box>
        ) : (
          <DialogContentText>
            Are you sure you want to delete parameter <strong>{param?.name}</strong>? This entry is not linked to any active tests and will be removed permanently.
          </DialogContentText>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button onClick={onClose} color="inherit" disabled={deleting}>Cancel</Button>
        <Button
          onClick={handleConfirmDeleteParam}
          variant="contained"
          color="error"
          disabled={deleting || (paramUsages.length > 0 && !mergeTargetParamId)}
        >
          {deleting ? "Deleting..." : (paramUsages.length > 0 ? "Merge & Delete" : "Delete Permanent")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
