"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import db from "@/app/indexedDB/db";

const TrackingContext = createContext(null);

const generateSessionId = () => {
  return "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
};

export function TrackingProvider({ children, type }) {
  const currentSliceRef = useRef(null);
  const isIdleRef = useRef(false);
  const lastInteractionTimeRef = useRef(Date.now());
  const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes inactivity threshold

  useEffect(() => {
    if (typeof window === "undefined") return;

    const table = type === "superAdmin" ? db.superAdminTracking : db.adminTracking;
    const endpoint = type === "superAdmin"
      ? "/adminstration/api/tracking/superadmin"
      : "/api/tracking/admin";

    // Synchronize dirty records from IndexedDB to server database (at least 1 min)
    const syncDirtyRecords = async () => {
      if (!navigator.onLine) return;
      try {
        const allDirty = await table.filter((r) => r.isDirty === true).toArray();
        for (const record of allDirty) {
          // Skip and clean up any sub-minute records (< 1 min)
          if (!record.durationInMin || record.durationInMin < 1) {
            await table.update(record.id, { isDirty: false });
            continue;
          }

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionId: record.sessionId,
              startUTC: record.startUTC,
              ENDUTC: record.ENDUTC,
              mode: record.mode,
              durationInMin: record.durationInMin,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              await table.update(record.id, { isDirty: false });
            }
          }
        }
      } catch (err) {
        console.error("Failed to sync tracking records:", err);
      }
    };

    // Start a new discrete active slice
    const startActiveSlice = async () => {
      if (currentSliceRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

      const now = new Date();
      const startUTC = now.toISOString();
      const sessionId = `slice_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const mode = navigator.onLine ? "online" : "offline";

      const record = {
        sessionId,
        startUTC,
        ENDUTC: startUTC,
        mode,
        durationInMin: 0,
        isDirty: false, // Only dirty when duration >= 1 min
      };

      try {
        const id = await table.insert(record);
        currentSliceRef.current = {
          id,
          sessionId,
          startUTC,
          startTimeMs: now.getTime(),
        };
        isIdleRef.current = false;
        lastInteractionTimeRef.current = Date.now();
      } catch (err) {
        console.error("Failed to initialize active tracking slice:", err);
      }
    };

    // Update ongoing active slice
    const updateActiveSlice = async (isFinal = false, useKeepalive = false) => {
      if (!currentSliceRef.current) return;
      const { id, sessionId, startUTC, startTimeMs } = currentSliceRef.current;
      const nowMs = Date.now();
      const elapsedMin = (nowMs - startTimeMs) / 60000;
      const durationInMin = parseFloat(elapsedMin.toFixed(2));
      const endUTC = new Date(nowMs).toISOString();
      const mode = navigator.onLine ? "online" : "offline";
      const isEligible = durationInMin >= 1; // At least 1 minute threshold

      try {
        await table.update(id, {
          ENDUTC: endUTC,
          durationInMin,
          mode,
          isDirty: isEligible,
        });

        if (isEligible) {
          if (useKeepalive && typeof fetch !== "undefined") {
            fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId,
                startUTC,
                ENDUTC: endUTC,
                mode,
                durationInMin,
              }),
              keepalive: true,
            }).then(async (res) => {
              if (res.ok) {
                await table.update(id, { isDirty: false }).catch(() => { });
              }
            }).catch(() => { });
          } else {
            await syncDirtyRecords();
          }
        }
      } catch (err) {
        console.error("Failed to update active tracking slice:", err);
      }

      if (isFinal) {
        if (!isEligible) {
          await table.update(id, { isDirty: false }).catch(() => { });
        }
        currentSliceRef.current = null;
      }
    };

    // End active slice
    const endActiveSlice = (useKeepalive = false) => {
      if (currentSliceRef.current) {
        updateActiveSlice(true, useKeepalive);
      }
    };

    // Initialize initial slice if tab is already active
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      startActiveSlice();
    }

    // User activity listeners
    let activityThrottle = false;
    const onUserActivity = () => {
      lastInteractionTimeRef.current = Date.now();
      if (isIdleRef.current) {
        isIdleRef.current = false;
        if (document.visibilityState === "visible") {
          startActiveSlice();
        }
      } else if (!currentSliceRef.current && document.visibilityState === "visible") {
        startActiveSlice();
      }

      if (activityThrottle) return;
      activityThrottle = true;
      setTimeout(() => { activityThrottle = false; }, 4000);
    };

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, onUserActivity, { passive: true });
    });

    // Check idle state periodically
    const idleCheckInterval = setInterval(() => {
      if (currentSliceRef.current && Date.now() - lastInteractionTimeRef.current > IDLE_TIMEOUT_MS) {
        isIdleRef.current = true;
        endActiveSlice(false);
      }
    }, 30 * 1000);

    // Tab visibility changes (minimize, tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        endActiveSlice(false);
      } else if (!isIdleRef.current) {
        startActiveSlice();
      }
    };

    // Window blur & focus
    const handleBlur = () => {
      endActiveSlice(false);
    };

    const handleFocus = () => {
      if (document.visibilityState === "visible" && !isIdleRef.current) {
        startActiveSlice();
      }
    };

    // Unload / Close Tab
    const handleBeforeUnload = () => {
      endActiveSlice(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);
    window.addEventListener("online", syncDirtyRecords);

    // Periodic slice updater & sync (every 20 seconds while active)
    const syncInterval = setInterval(async () => {
      if (currentSliceRef.current) {
        await updateActiveSlice(false, false);
      } else {
        await syncDirtyRecords();
      }
    }, 20 * 1000);

    return () => {
      clearInterval(idleCheckInterval);
      clearInterval(syncInterval);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, onUserActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      window.removeEventListener("online", syncDirtyRecords);
      endActiveSlice(true);
    };
  }, [type]);

  return (
    <TrackingContext.Provider value={{}}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  return useContext(TrackingContext);
}
