"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Disable automatic browser scroll restoration if possible
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const resetScroll = () => {
      // If there is an active hash in the URL, scroll to that element instead of top 0
      if (typeof window !== "undefined" && window.location.hash) {
        const targetId = window.location.hash.replace("#", "");
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }

      // Blur any lingering focused elements from previous page/drawer
      if (typeof document !== "undefined" && document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }

      // 1. Reset standard window and document scroll
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }

      // 2. Reset any main container or overflow scrollable containers
      const mainContainers = document.querySelectorAll("main, [role='main'], .overflow-y-auto, .overflow-auto, .overflow-y-scroll");
      mainContainers.forEach((el) => {
        if (el && el.scrollTop > 0) {
          el.scrollTop = 0;
        }
      });
    };

    // Execute immediately
    resetScroll();

    // Re-verify on the next frame & microtask to override any late browser/Next.js scroll restoration
    const rafId = requestAnimationFrame(resetScroll);
    const timer = setTimeout(resetScroll, 20);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  return null;
}
