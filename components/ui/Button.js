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
    "inline-flex items-center justify-center font-bold rounded-lg transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] shadow-none";

  const variants = {
    default:
      "bg-[#0f766e] text-white hover:bg-[#115e59] focus:ring-2 focus:ring-[#0f766e]",
    secondary:
      "bg-[#F3F4F6] text-slate-900 hover:bg-[#E5E7EB]",
    destructive:
      "bg-red-600 text-white hover:bg-red-700",
    outline:
      "border-2 border-[#0f766e] bg-white text-[#0f766e] hover:bg-[#0f766e] hover:text-white",
    ghost:
      "text-slate-700 hover:bg-slate-100",
    link: "text-[#0f766e] hover:underline underline-offset-4 p-0",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3.5 text-base",
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
