"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      const showUpdateToast = () => {
        // Prevent showing PWA update toast on customer-facing attraction pages
        const currentPath = window.location.pathname;
        const isAdminSide = 
          currentPath.startsWith("/admin") || 
          currentPath.startsWith("/adminstration") ||
          currentPath.startsWith("/dashboard") ||
          currentPath.startsWith("/registration") ||
          currentPath.startsWith("/test-report") ||
          currentPath.startsWith("/doctor-summary") ||
          currentPath.startsWith("/members") ||
          currentPath.startsWith("/settings") ||
          currentPath.startsWith("/userApprove");

        if (!isAdminSide) return;

        toast.custom((t) => (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "16px",
              backgroundColor: "#ffffff",
              color: "#0f172a",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
              fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
              maxWidth: "356px",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f766e" }}>
                Update Available
              </div>
              <div style={{ fontSize: "0.825rem", color: "#475569", lineHeight: "1.4" }}>
                A new version of the app is available! Click below to reload and apply the update.
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                onClick={() => toast.dismiss(t)}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: "transparent",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                Later
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t);
                  window.location.reload();
                }}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: "#0f766e",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#0d645d")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0f766e")}
              >
                Reload Now
              </button>
            </div>
          </div>
        ), {
          duration: Infinity
        });
      };

      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered successfully:", registration.scope);

            // Listen for service worker installation updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    showUpdateToast();
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
          });
      });

      // Listen for controllerchange when the new service worker takes over control
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          showUpdateToast();
        }
      });
    }
  }, []);

  return null;
}
