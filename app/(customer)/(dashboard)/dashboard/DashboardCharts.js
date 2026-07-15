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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Paper, Typography, Box } from "@mui/material";

const CustomTooltip = ({ active, payload, label, isCurrency, customUnit }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    let formattedValue = value;
    if (isCurrency) {
      formattedValue = `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    } else if (customUnit) {
      formattedValue = `${value} ${customUnit}`;
    } else {
      formattedValue = `${value} Registration${value !== 1 ? 's' : ''}`;
    }

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
        <Typography variant="body2" sx={{ fontWeight: 800, color: payload[0].fill || payload[0].color || "#0f766e" }}>
          {formattedValue}
        </Typography>
      </Paper>
    );
  }
  return null;
};

export function RegistrationChart({ data }) {
  return (
    <Box sx={{ width: "100%", height: 220, mt: 2, minWidth: 0 }}>
      <ResponsiveContainer width="99%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f766e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0f766e" stopOpacity={0.0} />
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
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#0f766e"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#regGrad)"
            animationDuration={800}
          />
        </AreaChart>
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
    <Box sx={{ width: "100%", height: 220, mt: 2, minWidth: 0 }}>
      <ResponsiveContainer width="99%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
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
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#16a34a"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#revGrad)"
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function DepartmentDistributionChart({ data }) {
  const COLORS = ["#0f766e", "#16a34a", "#2563eb", "#4f46e5", "#d97706", "#db2777", "#7c3aed"];

  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 220 }}>
        <Typography variant="body2" color="text.secondary">No department data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: 220, mt: 2, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <ResponsiveContainer width="99%" height="80%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip isCurrency={false} customUnit="tests" />} />
        </PieChart>
      </ResponsiveContainer>
      <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1, mt: 1 }}>
        {data.map((entry, index) => (
          <Box key={entry.name} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: COLORS[index % COLORS.length] }} />
            <Typography variant="caption" sx={{ fontSize: 9, color: "text.secondary", fontWeight: 600 }}>
              {entry.name} ({entry.value})
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function ReferralChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 220 }}>
        <Typography variant="body2" color="text.secondary">No referral data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: 220, mt: 2, minWidth: 0 }}>
      <ResponsiveContainer width="99%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#64748b" }} />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 9, fill: "#64748b", fontWeight: 600 }}
            width={75}
          />
          <Tooltip content={<CustomTooltip isCurrency={false} customUnit="patients" />} />
          <Bar
            dataKey="value"
            fill="#4f46e5"
            radius={[0, 4, 4, 0]}
            barSize={12}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
