"use client";

import { Toaster } from "sonner";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #374151",
        },
      }}
    />
  );
}
