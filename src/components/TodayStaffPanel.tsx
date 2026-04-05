"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { getShiftsByDate } from "@/lib/clockService";
import type { Shift } from "@/types";

interface TodayStaffPanelProps {
  /** Tăng refreshKey để panel tự reload */
  refreshKey?: number;
}

function formatElapsed(startTime: string): string {
  const minutes = Math.round(
    (Date.now() - new Date(startTime).getTime()) / 60000
  );
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function TodayStaffPanel({ refreshKey }: TodayStaffPanelProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tick, setTick] = useState(0);

  const loadShifts = useCallback(async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const data = await getShiftsByDate(today);
    setShifts(data.sort((a, b) => a.start_time.localeCompare(b.start_time)));
  }, []);

  // Reload khi refreshKey thay đổi (sau clock in/out)
  useEffect(() => {
    loadShifts();
  }, [loadShifts, refreshKey]);

  // Tick mỗi phút để cập nhật elapsed time
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeShifts = shifts.filter((s) => s.end_time === null);
  const doneShifts = shifts.filter((s) => s.end_time !== null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Aujourd'hui</h2>
        <span className="text-xs text-gray-400">
          {format(new Date(), "dd/MM/yyyy")}
        </span>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2 mb-4">
        <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {activeShifts.length} en service
        </span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
          {doneShifts.length} terminé
        </span>
      </div>

      {/* Staff list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {shifts.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">
            Aucun employé en service aujourd'hui
          </p>
        )}

        {/* Active shifts */}
        {activeShifts.map((shift) => (
          <div
            key={shift.id}
            className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {shift.staff_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {shift.staff_name}
              </p>
              <p className="text-xs text-gray-500">
                Entrée {format(new Date(shift.start_time), "HH:mm")}
                {" · "}
                <span className="text-emerald-600 font-medium">
                  {formatElapsed(shift.start_time)}
                </span>
              </p>
            </div>
          </div>
        ))}

        {/* Divider if both sections have items */}
        {activeShifts.length > 0 && doneShifts.length > 0 && (
          <div className="border-t border-gray-100 my-2" />
        )}

        {/* Done shifts */}
        {doneShifts.map((shift) => (
          <div
            key={shift.id}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2.5 opacity-70"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0">
              {shift.staff_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {shift.staff_name}
              </p>
              <p className="text-xs text-gray-400">
                {format(new Date(shift.start_time), "HH:mm")} →{" "}
                {format(new Date(shift.end_time!), "HH:mm")}
                {shift.duration_minutes !== null && (
                  <span className="ml-1">
                    · {formatDuration(shift.duration_minutes)}
                  </span>
                )}
              </p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
              ✓
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
