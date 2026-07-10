import Dexie from "dexie";

class TrackingDatabase extends Dexie {
  constructor() {
    super("PathlabTrackingDB");
    this.version(1).stores({
      adminTracking: "++id, sessionId, startUTC, ENDUTC, mode, durationInMin, isDirty",
      superAdminTracking: "++id, sessionId, startUTC, ENDUTC, mode, durationInMin, isDirty"
    });

    // Provide an insert helper to alias Dexie's add method
    this.adminTracking.insert = (data) => this.adminTracking.add(data);
    this.superAdminTracking.insert = (data) => this.superAdminTracking.add(data);
  }
}

export const db = new TrackingDatabase();
export default db;
