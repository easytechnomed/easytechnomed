import React from "react";

export function Badge({ className = "", variant = "default", children, ...props }) {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider transition-colors uppercase border";

  const variants = {
    default: "bg-blue-50 border-blue-200 text-blue-700",
    secondary: "bg-slate-100 border-slate-200 text-slate-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    danger: "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
