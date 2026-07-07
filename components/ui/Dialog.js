import React, { useEffect } from "react";
import { X } from "lucide-react";

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = "",
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative z-10 w-full max-w-md transform rounded-xl border border-slate-200 bg-white p-6 shadow-xl transition-all duration-300 ${className}`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {title && (
          <h3 className="text-lg font-bold leading-6 text-slate-900 mb-1">
            {title}
          </h3>
        )}

        {description && (
          <p className="text-sm text-slate-500 mb-4">
            {description}
          </p>
        )}

        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}
