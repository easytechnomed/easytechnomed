"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MenuItem, Select, FormControl, InputLabel } from "@mui/material";

export default function DashboardRangeSelector({ initialRange }) {
  const router = useRouter();

  const handleChange = (e) => {
    const val = e.target.value;
    router.push(`/admin/dashboard?range=${val}`);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel id="range-select-label">Date Period</InputLabel>
      <Select
        labelId="range-select-label"
        value={initialRange || "7days"}
        label="Date Period"
        onChange={handleChange}
        sx={{ bgcolor: "background.paper" }}
      >
        <MenuItem value="7days">Last 7 Days</MenuItem>
        <MenuItem value="30days">Last 30 Days</MenuItem>
        <MenuItem value="thismonth">This Month</MenuItem>
        <MenuItem value="prevmonth">Previous Month</MenuItem>
        <MenuItem value="3months">Last 3 Months</MenuItem>
        <MenuItem value="6months">Last 6 Months</MenuItem>
        <MenuItem value="year">Last Year</MenuItem>
      </Select>
    </FormControl>
  );
}
