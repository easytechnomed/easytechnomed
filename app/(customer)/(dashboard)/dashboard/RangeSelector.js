"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Menu, MenuItem } from "@mui/material";
import { CalendarMonth as CalendarIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";

const quickRanges = [
  { label: "Last 7 Days", value: "7days" },
  { label: "Last 30 Days", value: "30days" },
  { label: "This Month", value: "thismonth" },
  { label: "Previous Month", value: "prevmonth" },
  { label: "Last 3 Months", value: "3months" },
  { label: "Last 6 Months", value: "6months" },
  { label: "Last Year", value: "year" },
];

export default function DashboardRangeSelector({ initialRange }) {
  const router = useRouter();
  const currentRange = initialRange || "7days";
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleSelect = (val) => {
    router.push(`?range=${val}`);
    setAnchorEl(null);
  };

  const selectedLabel = quickRanges.find((r) => r.value === currentRange)?.label || "Last 7 Days";

  return (
    <Box sx={{ display: "flex", alignItems: "center", width: { xs: "100%", sm: "auto" } }}>
      <Button
        fullWidth
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        startIcon={<CalendarIcon sx={{ fontSize: 16, color: "#0f766e" }} />}
        endIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
        sx={{
          justifyContent: "space-between",
          bgcolor: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          color: "#0F172A",
          borderRadius: "8px",
          py: 0.8,
          px: 1.5,
          fontSize: { xs: "0.75rem", sm: "0.8rem" },
          fontWeight: 700,
          boxShadow: "none !important",
          minWidth: { xs: "auto", sm: 160 },
          whiteSpace: "nowrap",
          "&:hover": {
            borderColor: "#0f766e",
            bgcolor: "#F8FAFC",
          },
        }}
      >
        {selectedLabel}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: "10px",
            border: "1px solid #E2E8F0",
            minWidth: 160,
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
          },
        }}
      >
        {quickRanges.map((r) => (
          <MenuItem
            key={r.value}
            selected={currentRange === r.value}
            onClick={() => handleSelect(r.value)}
            sx={{
              fontSize: "0.8rem",
              fontWeight: currentRange === r.value ? 800 : 500,
              color: currentRange === r.value ? "#0f766e" : "#1E293B",
              py: 0.9,
              px: 2,
            }}
          >
            {r.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
