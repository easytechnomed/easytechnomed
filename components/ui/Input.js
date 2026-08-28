import React, { forwardRef } from "react";

export const Input = forwardRef(({ className = "", error, ...props }, ref) => {
  return (
    <div className="w-full">
      <input
        ref={ref}
        className={`w-full rounded-lg border-2 px-4 py-2.5 text-base md:text-sm transition-all focus:outline-none disabled:opacity-50 disabled:bg-slate-100 disabled:pointer-events-none bg-white text-slate-900 shadow-none
          ${
            error
              ? "border-red-500 focus:border-red-600"
              : "border-slate-300 focus:border-[#0f766e]"
          } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600 font-bold">{error}</p>}
    </div>
  );
});

Input.displayName = "Input";
