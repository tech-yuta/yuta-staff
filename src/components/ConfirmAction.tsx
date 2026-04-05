"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Staff, Shift } from "@/types";

interface ConfirmActionProps {
  staff: Staff;
  action: "in" | "out";
  openShift: Shift | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmAction({
  staff,
  action,
  openShift,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmActionProps) {
  const now = new Date();
  const isClockIn = action === "in";

  let durationText = "";
  if (!isClockIn && openShift) {
    const minutes = Math.round(
      (now.getTime() - new Date(openShift.start_time).getTime()) / 60000
    );
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    durationText = h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4">
      {/* Avatar */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg ${
          isClockIn ? "bg-emerald-500" : "bg-orange-500"
        }`}
      >
        {staff.name.charAt(0)}
      </div>

      {/* Staff info */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{staff.name}</h2>
        <p className="text-gray-500 text-sm">{staff.role}</p>
      </div>

      {/* Action card */}
      <div
        className={`w-full rounded-2xl p-5 text-center border-2 ${
          isClockIn
            ? "bg-emerald-50 border-emerald-200"
            : "bg-orange-50 border-orange-200"
        }`}
      >
        <p
          className={`text-base font-semibold ${
            isClockIn ? "text-emerald-700" : "text-orange-700"
          }`}
        >
          {isClockIn ? "▶  Début de service" : "■  Fin de service"}
        </p>
        <p className="text-4xl font-bold text-gray-900 mt-2">
          {format(now, "HH:mm")}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          {format(now, "EEEE, dd/MM/yyyy", { locale: fr })}
        </p>

        {!isClockIn && openShift && (
          <div className="mt-3 pt-3 border-t border-orange-200">
            <p className="text-sm text-gray-500">
              Prise de service à{" "}
              <span className="font-semibold">
                {format(new Date(openShift.start_time), "HH:mm")}
              </span>
            </p>
            <p className="text-orange-700 font-bold text-lg mt-0.5">
              Total : {durationText}
            </p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 w-full">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-lg active:bg-gray-200 active:scale-95 transition-all disabled:opacity-40 select-none"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 py-4 rounded-2xl font-semibold text-lg text-white transition-all active:scale-95 disabled:opacity-40 select-none shadow-md ${
            isClockIn
              ? "bg-emerald-500 active:bg-emerald-600"
              : "bg-orange-500 active:bg-orange-600"
          }`}
        >
          {isLoading ? "Traitement..." : "Confirmer ✓"}
        </button>
      </div>
    </div>
  );
}
