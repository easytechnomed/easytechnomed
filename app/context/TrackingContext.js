"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import db from "@/app/indexedDB/db";

const TrackingContext = createContext(null);

export function TrackingProvider({ children, type = "admin" }) {
  const currentSliceRef = useRef(null);
  const isIdleRef = useRef(false);
  const lastInteractionTimeRef = useRef(Date.now());
  const tabIdRef = useRef(
    typeof window !== "undefined"
      ? `tab_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      : "tab_init"
  );

  // 2 minutes inactivity threshold to cap sessions cleanly
  const IDLE_TIMEOUT_MS = 2 * 60 * 1000;
  // Maximum continuous slice duration before rolling into a new slice (15 minutes)
  const MAX_SLICE_MINUTES = 15;
  const tableName = type === "superAdmin" ? "superAdminTracking" : "adminTracking";
  const activeTabKey = `pathlab_active_tracking_tab_${type}`;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const table = db[tableName];
    const endpoint =
      type === "superAdmin"
        ? "/adminstration/api/tracking/superadmin"
        : "/api/tracking/admin";

    let broadcastChannel = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        broadcastChannel = new BroadcastChannel(`pathlab_tracking_sync_${type}`);
      }
    } catch {
      broadcastChannel = null;
    }

    // Helper: Check if this tab is the active tracker
    const isThisTabActive = () => {
      if (typeof document === "undefined") return false;
      if (document.visibilityState !== "visible") return false;
      try {
        const currentActive = localStorage.getItem(activeTabKey);
        return !currentActive || currentActive === tabIdRef.current;
      } catch {
        return true;
      }
    };

    // Helper: Claim active tracker role
    const claimActiveTracker = () => {
      try {
        localStorage.setItem(activeTabKey, tabIdRef.current);
        if (broadcastChannel) {
          broadcastChannel.postMessage({ type: "CLAIM_ACTIVE", tabId: tabIdRef.current });
        }
      } catch {
        // localStorage not available
      }
    };

    // Listen for tab coordination messages
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === "CLAIM_ACTIVE" && event.data?.tabId !== tabIdRef.current) {
          // Another tab became active -> finalize our current slice immediately
          if (currentSliceRef.current) {
            endActiveSlice(false);
          }
        }
      };
    }

    // Purge IndexedDB synced and orphan records to ensure DB stays 100% clean
    const cleanupIndexedDB = async () => {
      try {
        if (db.purgeTrackingTable) {
          await db.purgeTrackingTable(tableName, currentSliceRef.current?.id || null);
        }
      } catch (err) {
        console.warn("[TrackingContext] IndexedDB cleanup warning:", err);
      }
    };

    // Synchronize dirty records from IndexedDB to server database & DELETE upon success
    const syncDirtyRecords = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      try {
        const allDirty = await table.filter((r) => r.isDirty === true).toArray();
        for (const record of allDirty) {
          // Skip and permanently delete sub-20-second records (< 0.33 min)
          if (!record.durationInMin || record.durationInMin < 0.33) {
            await table.delete(record.id);
            continue;
          }

          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
              // Successfully saved on server -> DELETE from IndexedDB immediately!
              await table.delete(record.id);
            }
          }
        }
        // Run general purge pass
        await cleanupIndexedDB();
      } catch (err) {
        console.error("Failed to sync tracking records:", err);
      }
    };

    // Start a new discrete active slice
    const startActiveSlice = async () => {
      if (currentSliceRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

      claimActiveTracker();

      const now = new Date();
      const startUTC = now.toISOString();
      const sessionId = `slice_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const mode = typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline";

      const record = {
        sessionId,
        startUTC,
        ENDUTC: startUTC,
        mode,
        durationInMin: 0,
        isDirty: false, // Only dirty when duration >= 20 sec (0.33 min)
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

    // Update ongoing active slice with strict idle and sleep/wake capping
    const updateActiveSlice = async (isFinal = false, useKeepalive = false) => {
      if (!currentSliceRef.current) return;
      const { id, sessionId, startUTC, startTimeMs } = currentSliceRef.current;
      const nowMs = Date.now();

      // Guard: Check if the user went idle or PC resumed from sleep
      const timeSinceLastInteraction = nowMs - lastInteractionTimeRef.current;
      let effectiveEndMs = nowMs;

      // If user was inactive beyond IDLE_TIMEOUT_MS or laptop was asleep:
      // Cap the end time at the last interaction time (+ grace period of 15s max)
      if (timeSinceLastInteraction > IDLE_TIMEOUT_MS) {
        effectiveEndMs = Math.min(nowMs, lastInteractionTimeRef.current + 15000);
        isFinal = true;
        isIdleRef.current = true;
      }

      // Ensure effectiveEndMs is never before startTimeMs
      effectiveEndMs = Math.max(effectiveEndMs, startTimeMs);

      const elapsedMin = (effectiveEndMs - startTimeMs) / 60000;
      const durationInMin = parseFloat(elapsedMin.toFixed(2));
      const endUTC = new Date(effectiveEndMs).toISOString();
      const mode = typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline";
      const isEligible = durationInMin >= 0.33; // At least 20 seconds

      try {
        if (isEligible) {
          await table.update(id, {
            ENDUTC: endUTC,
            durationInMin,
            mode,
            isDirty: true,
          });

          const payload = {
            sessionId,
            startUTC,
            ENDUTC: endUTC,
            mode,
            durationInMin,
          };

          if (useKeepalive) {
            // Use sendBeacon or keepalive fetch for tab close / unload
            if (typeof navigator !== "undefined" && navigator.sendBeacon) {
              const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
              const beaconSent = navigator.sendBeacon(endpoint, blob);
              if (beaconSent) {
                await table.delete(id).catch(() => {});
              }
            } else if (typeof fetch !== "undefined") {
              fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                keepalive: true,
              }).then(async (res) => {
                if (res.ok) {
                  await table.delete(id).catch(() => {});
                }
              }).catch(() => {});
            }
          } else {
            await syncDirtyRecords();
          }
        } else if (isFinal) {
          // Sub-20s slice finalized -> delete immediately from IndexedDB
          await table.delete(id).catch(() => {});
        }
      } catch (err) {
        console.error("Failed to update active tracking slice:", err);
      }

      if (isFinal) {
        currentSliceRef.current = null;
        await cleanupIndexedDB();
      } else if (durationInMin >= MAX_SLICE_MINUTES) {
        // Roll into a new discrete slice after MAX_SLICE_MINUTES of continuous activity
        currentSliceRef.current = null;
        if (document.visibilityState === "visible" && !isIdleRef.current) {
          startActiveSlice();
        }
      }
    };

    // End active slice
    const endActiveSlice = (useKeepalive = false) => {
      if (currentSliceRef.current) {
        updateActiveSlice(true, useKeepalive);
      }
    };

    // Initial IndexedDB cleanup and start initial slice if tab is active
    cleanupIndexedDB().then(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        startActiveSlice();
      }
    });

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
      setTimeout(() => {
        activityThrottle = false;
      }, 3000);
    };

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, onUserActivity, { passive: true });
    });

    // Periodic idle check (every 15 seconds)
    const idleCheckInterval = setInterval(() => {
      if (currentSliceRef.current) {
        const timeSinceInteraction = Date.now() - lastInteractionTimeRef.current;
        if (timeSinceInteraction > IDLE_TIMEOUT_MS) {
          isIdleRef.current = true;
          endActiveSlice(false);
        }
      }
    }, 15 * 1000);

    // Tab visibility changes (minimize, tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        endActiveSlice(false);
      } else {
        claimActiveTracker();
        lastInteractionTimeRef.current = Date.now();
        isIdleRef.current = false;
        startActiveSlice();
      }
    };

    // Window blur & focus
    const handleBlur = () => {
      // If window lost focus, end active slice
      endActiveSlice(false);
    };

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        claimActiveTracker();
        lastInteractionTimeRef.current = Date.now();
        isIdleRef.current = false;
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
        if (isThisTabActive()) {
          await updateActiveSlice(false, false);
        } else {
          endActiveSlice(false);
        }
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
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      endActiveSlice(true);
    };
  }, [type, tableName, activeTabKey]);

  return (
    <TrackingContext.Provider value={{}}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  return useContext(TrackingContext);
}
