export interface Staff {
  id: string;
  name: string;
  pin: string;
  role: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  staff_id: string;
  staff_name: string;
  date: string;               // "2026-04-05"
  start_time: string;         // ISO string
  end_time: string | null;
  duration_minutes: number | null;
  notes: string;
  synced: boolean;
  updated_at: string;
}

export interface SyncQueueItem {
  id: string;
  action: "CREATE" | "UPDATE";
  table: "shifts" | "staff";
  payload: Shift | Staff;
  created_at: string;
  retries: number;
}

export type ClockAction = "in" | "out";
