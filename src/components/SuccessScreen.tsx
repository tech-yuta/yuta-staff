"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { Staff, Shift } from "@/types";

interface SuccessScreenProps {
  staff: Staff;
  action: "in" | "out";
  shift: Shift;
  onReset: () => void;
  autoResetSeconds?: number;
}

export function SuccessScreen({
  staff,
  action,
  shift,
  onReset,
  autoResetSeconds = 4,
}: SuccessScreenProps) {
  const [countdown, setCountdown] = useState(autoResetSeconds);
  const isClockIn = action === "in";

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          onReset();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onReset]);

  let durationText = "";
  if (!isClockIn && shift.duration_minutes !== null) {
    const h = Math.floor(shift.duration_minutes / 60);
    const m = shift.duration_minutes % 60;
    durationText = h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center px-6">
      {/* Success icon */}
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl animate-bounce ${
          isClockIn ? "bg-emerald-100" : "bg-orange-100"
        }`}
      >
        ✓
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isClockIn ? "Service commencé !" : "Service terminé !"}
        </h2>
        <p className="text-gray-500 mt-1">{staff.name}</p>
      </div>

      <div
        className={`rounded-2xl px-8 py-4 ${
          isClockIn ? "bg-emerald-50" : "bg-orange-50"
        }`}
      >
        {isClockIn ? (
          <p className="text-emerald-700 font-semibold text-lg">
            Prise de service à {format(new Date(shift.start_time), "HH:mm")}
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-orange-700 font-semibold text-lg">
              Fin de service à {format(new Date(shift.end_time!), "HH:mm")}
            </p>
            <p className="text-gray-500 text-sm">
              Durée totale : <span className="font-semibold">{durationText}</span>
            </p>
          </div>
        )}
      </div>

      {/* Countdown */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="#6366f1"
              strokeWidth="3"
              strokeDasharray="100"
              strokeDashoffset={100 - (countdown / autoResetSeconds) * 100}
              className="transition-all duration-1000"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-indigo-600">
            {countdown}
          </span>
        </div>
        <p className="text-gray-400 text-sm">Retour automatique...</p>
      </div>

      <button
        onClick={onReset}
        className="text-indigo-600 font-medium text-sm underline"
      >
        Retour immédiat
      </button>
    </div>
  );
}
