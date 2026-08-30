"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FormControl, Select, MenuItem, Box } from "@mui/material";
import { CalendarMonth as CalendarIcon } from "@mui/icons-material";

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

  const handleChange = (event) => {
    const val = event.target.value;
    router.push(`?range=${val}`);
  };

  return (
    <FormControl size="small" fullWidth sx={{ minWidth: { xs: "auto", sm: 160 } }}>
      <Select
        value={currentRange}
        onChange={handleChange}
        displayEmpty
        startAdornment={
          <CalendarIcon sx={{ fontSize: 18, color: "#0f766e", mr: 1, ml: -0.25 }} />
        }
        MenuProps={{
          disableScrollLock: true,
          PaperProps: {
            sx: {
              mt: 0.5,
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
            },
          },
        }}
        sx={{
          bgcolor: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          borderRadius: "8px",
          color: "#0F172A",
          fontSize: { xs: "0.75rem", sm: "0.8rem" },
          fontWeight: 700,
          "& fieldset": { border: "none" },
          "& .MuiSelect-select": {
            py: 0.8,
            px: 1.2,
            display: "flex",
            alignItems: "center",
          },
          "&:hover": {
            borderColor: "#0f766e",
            bgcolor: "#F8FAFC",
          },
        }}
      >
        {quickRanges.map((r) => (
          <MenuItem
            key={r.value}
            value={r.value}
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
      </Select>
    </FormControl>
  );
}
