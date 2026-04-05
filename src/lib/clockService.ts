import { db } from "./db";
import { addToSyncQueue, flushSyncQueue } from "./syncQueue";
import { format } from "date-fns";
import type { Shift, Staff } from "@/types";

export async function getStaffByPin(pin: string): Promise<Staff | null> {
  const staff = await db.staff
    .where("pin")
    .equals(pin)
    .filter((s) => s.active)
    .first();
  return staff ?? null;
}

export async function getTodayOpenShift(staffId: string): Promise<Shift | null> {
  const today = format(new Date(), "yyyy-MM-dd");
  const shift = await db.shifts
    .where("[staff_id+date]")
    .equals([staffId, today])
    .filter((s) => s.end_time === null)
    .first();
  return shift ?? null;
}

export async function clockIn(staff: Staff): Promise<Shift> {
  const openShift = await getTodayOpenShift(staff.id);
  if (openShift) {
    throw new Error("Vous avez déjà une prise de service en cours. Veuillez pointer la sortie d'abord.");
  }

  const now = new Date().toISOString();
  const shift: Shift = {
    id: crypto.randomUUID(),
    staff_id: staff.id,
    staff_name: staff.name,
    date: format(new Date(), "yyyy-MM-dd"),
    start_time: now,
    end_time: null,
    duration_minutes: null,
    notes: "",
    synced: false,
    updated_at: now,
  };

  await db.shifts.add(shift);
  await addToSyncQueue({ action: "CREATE", table: "shifts", payload: shift });
  flushSyncQueue();

  return shift;
}

export async function clockOut(staff: Staff): Promise<Shift> {
  const openShift = await getTodayOpenShift(staff.id);
  if (!openShift) {
    throw new Error("Aucune prise de service trouvée pour aujourd'hui.");
  }

  const now = new Date().toISOString();
  const duration = Math.round(
    (new Date(now).getTime() - new Date(openShift.start_time).getTime()) / 60000
  );

  const updates: Partial<Shift> = {
    end_time: now,
    duration_minutes: duration,
    synced: false,
    updated_at: now,
  };

  await db.shifts.update(openShift.id, updates);
  const updatedShift: Shift = { ...openShift, ...updates };

  await addToSyncQueue({ action: "UPDATE", table: "shifts", payload: updatedShift });
  flushSyncQueue();

  return updatedShift;
}

export async function getShiftsByDate(date: string): Promise<Shift[]> {
  return db.shifts.where("date").equals(date).toArray();
}
