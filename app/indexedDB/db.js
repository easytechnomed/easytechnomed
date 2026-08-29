import Dexie from "dexie";

class TrackingDatabase extends Dexie {
  constructor() {
    super("PathlabTrackingDB");
    this.version(1).stores({
      adminTracking: "++id, sessionId, startUTC, ENDUTC, mode, durationInMin, isDirty",
      superAdminTracking: "++id, sessionId, startUTC, ENDUTC, mode, durationInMin, isDirty"
    });

    // Provide insert and cleanup helpers
    this.adminTracking.insert = (data) => this.adminTracking.add(data);
    this.superAdminTracking.insert = (data) => this.superAdminTracking.add(data);

    // Purge helper: removes synced records and any orphan/stale records except currentActiveId
    this.purgeTrackingTable = async (tableName, currentActiveId = null) => {
      try {
        const table = this[tableName];
        if (!table) return;
        const allRecords = await table.toArray();
        const idsToDelete = [];
        for (const record of allRecords) {
          if (currentActiveId && record.id === currentActiveId) continue;
          // Delete if not dirty (already synced) or sub-threshold
          if (!record.isDirty || !record.durationInMin || record.durationInMin < 0.33) {
            idsToDelete.push(record.id);
          }
        }
        if (idsToDelete.length > 0) {
          await table.bulkDelete(idsToDelete);
        }
      } catch (err) {
        console.warn(`[IndexedDB] Cleanup error for ${tableName}:`, err);
      }
    };
  }
}

export const db = new TrackingDatabase();
export default db;
