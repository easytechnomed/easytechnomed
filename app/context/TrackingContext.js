"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import db from "@/app/indexedDB/db";

const TrackingContext = createContext(null);

const generateSessionId = () => {
  return "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
};

export function TrackingProvider({ children, type }) {
  const sessionRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const startUTC = new Date().toISOString();
    const sessionId = generateSessionId();
    const table = type === "superAdmin" ? db.superAdminTracking : db.adminTracking;

    // Synchronize dirty records from IndexedDB to server database
    const syncDirtyRecords = async () => {
      if (!navigator.onLine) return;
      try {
        const allDirty = await table.filter((r) => r.isDirty === true).toArray();
        const endpoint = type === "superAdmin"
          ? "/adminstration/api/tracking/superadmin"
          : "/api/tracking/admin";

        for (const record of allDirty) {
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
              durationInMin: record.durationInMin
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

    const initSession = async () => {
      const mode = navigator.onLine ? "online" : "offline";
      const record = {
        sessionId,
        startUTC,
        ENDUTC: startUTC,
        mode,
        durationInMin: 0,
        isDirty: true
      };

      try {
        const id = await table.insert(record);
        sessionRef.current = { id, sessionId, startUTC, table };
        // Trigger initial sync
        await syncDirtyRecords();
      } catch (err) {
        console.error("Failed to initialize tracking session:", err);
      }
    };

    initSession();

    // Update interval (every 2 minutes)
    const interval = setInterval(async () => {
      if (!sessionRef.current) return;
      const { id, sessionId, startUTC, table } = sessionRef.current;
      const now = new Date();
      const start = new Date(startUTC);
      const diffMs = now - start;
      const durationInMin = parseFloat((diffMs / 1000 / 60).toFixed(2));
      const mode = navigator.onLine ? "online" : "offline";

      try {
        await table.update(id, {
          ENDUTC: now.toISOString(),
          durationInMin,
          mode,
          isDirty: true
        });
        await syncDirtyRecords();
      } catch (err) {
        console.error("Failed to update tracking session:", err);
      }
    }, 2 * 60 * 1000);

    // Save final stats on unload / visibility change
    const saveFinalStats = async () => {
      if (!sessionRef.current) return;
      const { id, sessionId, startUTC, table } = sessionRef.current;
      const now = new Date();
      const start = new Date(startUTC);
      const diffMs = now - start;
      const durationInMin = parseFloat((diffMs / 1000 / 60).toFixed(2));
      const mode = navigator.onLine ? "online" : "offline";

      try {
        await table.update(id, {
          ENDUTC: now.toISOString(),
          durationInMin,
          mode,
          isDirty: true
        });
        await syncDirtyRecords();
      } catch (err) {
        console.error("Failed to save final tracking stats:", err);
      }
    };

    window.addEventListener("beforeunload", saveFinalStats);
    window.addEventListener("online", syncDirtyRecords);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveFinalStats();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", saveFinalStats);
      window.removeEventListener("online", syncDirtyRecords);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      saveFinalStats();
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
