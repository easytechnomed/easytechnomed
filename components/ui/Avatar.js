import React from "react";

export function Avatar({ src, alt = "User", name = "", className = "" }) {
  const getInitials = (fullName) => {
    if (!fullName) return "?";
    const parts = fullName.split(" ");
    return parts.map((p) => p[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center h-10 w-10 shrink-0 overflow-hidden rounded-full bg-blue-100 border border-blue-200 ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="aspect-square h-full w-full object-cover" />
      ) : (
        <span className="font-semibold text-sm text-blue-700">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
