import Dexie, { type EntityTable } from "dexie";
import type { Staff, Shift, SyncQueueItem } from "@/types";

class LunaDB extends Dexie {
  staff!: EntityTable<Staff, "id">;
  shifts!: EntityTable<Shift, "id">;
  sync_queue!: EntityTable<SyncQueueItem, "id">;

  constructor() {
    super("LunaStaffDB");
    this.version(1).stores({
      staff: "id, pin, updated_at",
      shifts: "id, staff_id, date, [staff_id+date], synced",
      sync_queue: "id, created_at, retries",
    });
  }
}

export const db = new LunaDB();
