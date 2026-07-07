import React, { forwardRef } from "react";

export const Input = forwardRef(({ className = "", error, ...props }, ref) => {
  return (
    <div className="w-full">
      <input
        ref={ref}
        className={`w-full rounded-lg border px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-100 disabled:pointer-events-none bg-white text-slate-900
          ${
            error
              ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
              : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-500"
          } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
});

Input.displayName = "Input";
