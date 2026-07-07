import React from "react";

export function Label({ className = "", children, ...props }) {
  return (
    <label
      className={`text-sm font-semibold tracking-wide text-slate-700 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
