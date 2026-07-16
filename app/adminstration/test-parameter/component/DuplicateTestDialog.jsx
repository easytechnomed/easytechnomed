"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from "@mui/material";
import { ContentCopy as CopyIcon } from "@mui/icons-material";
import { toast } from "sonner";

export default function DuplicateTestDialog({ open, onClose, test, onDuplicateSuccess }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (test) {
      setName(`${test.name} (Copy)`);
      setCode(test.code ? `${test.code}_COPY` : "");
    } else {
      setName("");
      setCode("");
    }
  }, [test, open]);

  const handleDuplicate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Test name is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/adminstration/api/tests/${test.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || null
        })
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message || "Test duplicated successfully.");
        onDuplicateSuccess(res.test);
        onClose();
      } else {
        toast.error(res.error || "Failed to duplicate test.");
      }
    } catch (error) {
      console.error("Error duplicating test:", error);
      toast.error("An error occurred while duplicating the test.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      maxWidth="xs"
      fullWidth
    >
      <form onSubmit={handleDuplicate}>
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <CopyIcon color="primary" />
          Duplicate Default Test
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            required
            fullWidth
            size="small"
            label="New Test Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            autoFocus
          />
          <TextField
            fullWidth
            size="small"
            label="New Test Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={saving}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={saving || !name.trim()}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CopyIcon />}
          >
            {saving ? "Duplicating..." : "Duplicate"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
