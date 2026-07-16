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

        toast.info("A new version of the app is available!", {
          description: "Click below to reload and apply the update.",
          action: {
            label: "Reload Now",
            onClick: () => {
              window.location.reload();
            }
          },
          duration: Infinity // Keep it visible until the user interacts
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
