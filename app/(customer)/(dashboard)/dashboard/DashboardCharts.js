"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Paper, Typography, Box } from "@mui/material";

const CustomTooltip = ({ active, payload, label, isCurrency }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const formattedValue = isCurrency 
      ? `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
      : `${value} Registration${value !== 1 ? 's' : ''}`;

    return (
      <Paper
        elevation={4}
        sx={{
          p: 1.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2.5,
          bgcolor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(4px)",
          boxShadow: "0 6px 20px 0 rgba(0,0,0,0.06)",
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, display: "block", color: "text.secondary", mb: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 800, color: payload[0].fill || payload[0].color }}>
          {formattedValue}
        </Typography>
      </Paper>
    );
  }
  return null;
};

export function RegistrationChart({ data }) {
  return (
    <Box sx={{ width: "100%", height: 200, mt: 2, minWidth: 0 }}>
      <ResponsiveContainer width="99%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity={1} />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
            dy={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip isCurrency={false} />}
            cursor={{ fill: "rgba(15, 118, 110, 0.04)", radius: 4 }}
          />
          <Bar
            dataKey="count"
            fill="url(#regGrad)"
            radius={[4, 4, 0, 0]}
            barSize={16}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function RevenueChart({ data }) {
  const formatYAxis = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  return (
    <Box sx={{ width: "100%", height: 200, mt: 2, minWidth: 0 }}>
      <ResponsiveContainer width="99%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={1} />
              <stop offset="100%" stopColor="#4ade80" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
            dy={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
            tickFormatter={formatYAxis}
          />
          <Tooltip
            content={<CustomTooltip isCurrency={true} />}
            cursor={{ fill: "rgba(22, 163, 74, 0.04)", radius: 4 }}
          />
          <Bar
            dataKey="revenue"
            fill="url(#revGrad)"
            radius={[4, 4, 0, 0]}
            barSize={16}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
