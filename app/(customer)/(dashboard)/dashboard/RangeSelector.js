"use client";

import React from "react";
import { useRouter } from "next/navigation";

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

  const handleChange = (e) => {
    const val = e.target.value;
    router.push(`?range=${val}`);
  };

  return (
    <div className="relative w-full sm:w-auto min-w-[150px]">
      {/* Calendar Icon */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-[#0f766e]">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
        </svg>
      </div>

      {/* Native Select with Tailwind CSS */}
      <select
        value={currentRange}
        onChange={handleChange}
        className="w-full appearance-none rounded-lg border-[1.5px] border-slate-200 bg-white py-2 pl-8 pr-8 text-xs sm:text-sm font-bold text-slate-800 shadow-none transition-colors hover:border-[#0f766e] hover:bg-slate-50 focus:border-[#0f766e] focus:outline-none cursor-pointer"
      >
        {quickRanges.map((r) => (
          <option key={r.value} value={r.value} className="text-slate-800 font-semibold py-1">
            {r.label}
          </option>
        ))}
      </select>

      {/* Custom Chevron Icon */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}
