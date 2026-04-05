"use client";

import { format } from "date-fns";
import type { Shift } from "@/types";

interface ShiftTableProps {
  shifts: Shift[];
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return "--";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function ShiftTable({ shifts }: ShiftTableProps) {
  const activeShifts = shifts.filter((s) => s.end_time === null);
  const completedShifts = shifts.filter((s) => s.end_time !== null);

  return (
    <div className="w-full">
      {/* Summary row */}
      <div className="flex gap-4 mb-4 text-sm">
        <span className="text-emerald-600 font-medium">
          ▶ En service : {activeShifts.length}
        </span>
        <span className="text-gray-500">✓ Terminé : {completedShifts.length}</span>
        <span className="text-gray-400">Total : {shifts.length}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Employé</th>
              <th className="text-left px-4 py-3 font-semibold">Poste</th>
              <th className="text-center px-4 py-3 font-semibold">Entrée</th>
              <th className="text-center px-4 py-3 font-semibold">Sortie</th>
              <th className="text-center px-4 py-3 font-semibold">Durée</th>
              <th className="text-center px-4 py-3 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shifts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  Aucune donnée pour ce jour
                </td>
              </tr>
            )}
            {shifts.map((shift) => (
              <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {shift.staff_name}
                </td>
                <td className="px-4 py-3 text-gray-500">{shift.staff_id}</td>
                <td className="px-4 py-3 text-center font-mono">
                  {format(new Date(shift.start_time), "HH:mm")}
                </td>
                <td className="px-4 py-3 text-center font-mono text-gray-500">
                  {shift.end_time
                    ? format(new Date(shift.end_time), "HH:mm")
                    : "--:--"}
                </td>
                <td className="px-4 py-3 text-center text-gray-700">
                  {formatDuration(shift.duration_minutes)}
                </td>
                <td className="px-4 py-3 text-center">
                  {shift.end_time ? (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-medium">
                      Terminé
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      En service
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
