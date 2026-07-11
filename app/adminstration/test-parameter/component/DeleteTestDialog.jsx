"use client";

import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { toast } from "sonner";

export default function DeleteTestDialog({ open, onClose, test, onDeleteSuccess }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!test) return;
    setDeleting(true);
    try {
      const res = await fetch(`/adminstration/api/tests/${test.id}`, {
        method: "DELETE"
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message || "Test deleted successfully.");
        onDeleteSuccess(test);
        onClose();
      } else {
        toast.error(res.error || "Failed to delete test.");
      }
    } catch (error) {
      console.error("Error deleting test:", error);
      toast.error("An error occurred while deleting the test.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !deleting && onClose()}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <DialogTitle id="delete-dialog-title" sx={{ fontWeight: 800 }}>
        Delete Default Test?
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          Are you sure you want to delete the test <strong>{test?.name}</strong>?
          This action will soft delete the default test and all its associated reference parameters.
          Workspaces created after this deletion will not receive this test.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          disabled={deleting}
          variant="text"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirmDelete}
          color="error"
          autoFocus
          disabled={deleting}
          variant="contained"
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
        >
          {deleting ? "Deleting..." : "Soft Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
