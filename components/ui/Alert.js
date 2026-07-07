import React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export function Alert({ className = "", variant = "info", title, children, ...props }) {
  const icons = {
    info: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
    success: <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
    danger: <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />,
  };

  const variants = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    danger: "bg-red-50 border-red-200 text-red-900",
  };

  return (
    <div
      className={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${variants[variant]} ${className}`}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1">
        {title && <h5 className="font-bold mb-1 tracking-wide">{title}</h5>}
        <div className="text-sm opacity-95">{children}</div>
      </div>
    </div>
  );
}
