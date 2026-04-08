import { db } from "./db";
import type { SyncQueueItem, Shift } from "@/types";

const MAX_RETRIES = 3;
const SHIFT_RETENTION_DAYS = 90;

export async function addToSyncQueue(
  item: Omit<SyncQueueItem, "id" | "created_at" | "retries">
) {
  await db.sync_queue.add({
    ...item,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    retries: 0,
  });
}

export async function getPendingCount(): Promise<number> {
  return db.sync_queue.count();
}

export async function flushSyncQueue(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const pending = await db.sync_queue
    .orderBy("created_at")
    .filter((item) => item.retries < MAX_RETRIES)
    .toArray();

  for (const item of pending) {
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      await db.sync_queue.delete(item.id);
      if (item.table === "shifts") {
        await db.shifts.update((item.payload as Shift).id, { synced: true });
      }
    } catch {
      await db.sync_queue.update(item.id, { retries: item.retries + 1 });
    }
  }
}

// Auto-flush when connection is restored
if (typeof window !== "undefined") {
  window.addEventListener("online", () => flushSyncQueue());
}

export async function cleanupOldData(): Promise<{
  deletedShifts: number;
  deletedQueueItems: number;
}> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - SHIFT_RETENTION_DAYS);
  const cutoffDate = cutoff.toISOString().slice(0, 10); // "yyyy-MM-dd"

  // Delete synced shifts older than SHIFT_RETENTION_DAYS
  const oldShiftKeys = await db.shifts
    .filter((s) => s.synced && s.date < cutoffDate)
    .primaryKeys();
  await db.shifts.bulkDelete(oldShiftKeys);

  // Delete dead sync_queue items that have permanently failed
  const deadItemKeys = await db.sync_queue
    .filter((item) => item.retries >= MAX_RETRIES)
    .primaryKeys();
  await db.sync_queue.bulkDelete(deadItemKeys);

  return {
    deletedShifts: oldShiftKeys.length,
    deletedQueueItems: deadItemKeys.length,
  };
}
