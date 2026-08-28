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
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Box, Typography } from "@mui/material";

const CustomTooltip = ({ active, payload, label, isCurrency, customUnit }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    let formattedValue = value;
    if (isCurrency) {
      formattedValue = `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    } else if (customUnit) {
      formattedValue = `${value} ${customUnit}`;
    } else {
      formattedValue = `${value} Patients`;
    }

    return (
      <Box
        sx={{
          p: 1.2,
          borderRadius: "8px",
          bgcolor: "#0F172A",
          color: "#FFFFFF",
          border: "1px solid #334155",
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, display: "block", color: "#94A3B8", fontSize: "0.68rem" }}>
          {label}
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f766e", fontSize: "0.85rem" }}>
          {formattedValue}
        </Typography>
      </Box>
    );
  }
  return null;
};

export function RegistrationChart({ data }) {
  return (
    <Box sx={{ width: "100%", height: 180, mt: 1.5, minWidth: 0 }}>
      <ResponsiveContainer width="99%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 5, left: -25, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip isCurrency={false} />} cursor={{ fill: "rgba(15, 118, 110, 0.08)" }} />
          <Bar
            dataKey="count"
            fill="#0f766e"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
            animationDuration={600}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function DepartmentDistributionChart({ data }) {
  const COLORS = ["#0f766e", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];
  const total = data?.reduce((sum, item) => sum + item.value, 0) || 0;

  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 180 }}>
        <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 600 }}>No test department data</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", mt: 1.5, display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", gap: 2 }}>
      {/* Donut */}
      <Box sx={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={60}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#FFFFFF" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip isCurrency={false} customUnit="tests" />} />
          </PieChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>
            {total}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase" }}>
            Tests
          </Typography>
        </Box>
      </Box>

      {/* Clean list with percentage */}
      <Box sx={{ flexGrow: 1, width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
        {data.slice(0, 4).map((entry, index) => {
          const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          const color = COLORS[index % COLORS.length];
          return (
            <Box key={entry.name}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: color }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#1E293B", fontSize: "0.75rem" }}>
                    {entry.name}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748B", fontSize: "0.75rem" }}>
                  {entry.value} ({pct}%)
                </Typography>
              </Box>
              <Box sx={{ width: "100%", height: 4, bgcolor: "#F1F5F9", borderRadius: 2, overflow: "hidden" }}>
                <Box sx={{ width: `${pct}%`, height: "100%", bgcolor: color, borderRadius: 2 }} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
