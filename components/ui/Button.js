import React from "react";
import { Loader } from "./Loader";

export function Button({
  className = "",
  variant = "default",
  size = "md",
  isLoading = false,
  disabled = false,
  children,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const variants = {
    default:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus:ring-blue-500 focus:ring-offset-white",
    secondary:
      "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500 focus:ring-offset-white",
    destructive:
      "bg-red-600 text-white hover:bg-red-700 shadow-sm focus:ring-red-500 focus:ring-offset-white",
    outline:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-blue-500 focus:ring-offset-white",
    ghost:
      "text-slate-700 hover:bg-slate-100 focus:ring-blue-500 focus:ring-offset-white",
    link: "text-blue-600 hover:underline underline-offset-4 focus:ring-blue-500 p-0",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && <Loader className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
}
