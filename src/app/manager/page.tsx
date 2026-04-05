"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays, addDays } from "date-fns";
import { fr } from "date-fns/locale";

import { db } from "@/lib/db";
import { getShiftsByDate } from "@/lib/clockService";
import { ShiftTable } from "@/components/ShiftTable";
import { SyncIndicator } from "@/components/SyncIndicator";
import { flushSyncQueue } from "@/lib/syncQueue";
import { ActivationGate } from "@/components/ActivationGate";
import type { Shift, Staff } from "@/types";


// ─── Manager PIN gate ────────────────────────────────────────────────────────────────────────────────
function PinGate({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/manager-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error ?? "PIN manager incorrect.");
        setPin("");
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-xs">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Gestion</h1>
        <p className="text-gray-500 text-sm mb-6">Entrez le PIN manager pour continuer</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN manager"
            maxLength={8}
            autoFocus
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-xl tracking-widest focus:border-indigo-400 focus:outline-none"
          />
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={isLoading || !pin}
            className="bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Vérification..." : "Connexion"}
          </button>
        </form>
        <a
          href="/"
          className="block text-center text-sm text-gray-400 mt-4 underline"
        >
          ← Retour à l'accueil
        </a>
      </div>
    </main>
  );
}

// ─── Shifts tab ───────────────────────────────────────────────────────────────
function ShiftsTab() {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [shifts, setShifts] = useState<Shift[]>([]);

  const loadShifts = useCallback(async () => {
    const data = await getShiftsByDate(selectedDate);
    setShifts(data.sort((a, b) => a.start_time.localeCompare(b.start_time)));
  }, [selectedDate]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  function navigate(days: number) {
    const current = new Date(selectedDate + "T12:00:00");
    const next = days > 0 ? addDays(current, days) : subDays(current, -days);
    setSelectedDate(format(next, "yyyy-MM-dd"));
  }

  return (
    <div>
      {/* Date navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50 transition-colors"
        >
          ‹
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-gray-900">
            {format(new Date(selectedDate + "T12:00:00"), "EEEE, dd/MM/yyyy", {
              locale: fr,
            })}
          </p>
        </div>
        <button
          onClick={() => navigate(1)}
          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50 transition-colors"
        >
          ›
        </button>
      </div>

      <ShiftTable shifts={shifts} />
    </div>
  );
}

// ─── Staff tab ────────────────────────────────────────────────────────────────
function StaffTab() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadStaff = useCallback(async () => {
    const list = await db.staff.filter((s) => s.active).toArray();
    setStaffList(list);
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  async function handleSync() {
    setIsSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { staff }: { staff: Staff[] } = await res.json();

      await db.transaction("rw", db.staff, async () => {
        await db.staff.clear();
        await db.staff.bulkAdd(staff);
      });

      await loadStaff();
      setSyncMsg({ ok: true, text: `✓ ${staff.length} employé(s) synchronisé(s)` });
    } catch {
      setSyncMsg({ ok: false, text: "✕ Erreur de synchronisation. Veuillez réessayer." });
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-900">
          Employés ({staffList.length})
        </h2>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isSyncing ? "Synchronisation..." : "↓ Sync depuis Google Sheets"}
        </button>
      </div>

      {syncMsg && (
        <p
          className={`text-sm mb-4 px-3 py-2 rounded-xl ${
            syncMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {syncMsg.text}
        </p>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {staffList.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">
            Aucun employé — cliquez sur &quot;Sync&quot; pour charger depuis Google Sheets
          </p>
        )}
        {staffList.map((s, i) => (
          <div
            key={s.id}
            className={`flex items-center gap-3 px-4 py-3 ${
              i < staffList.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
              {s.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{s.name}</p>
              <p className="text-xs text-gray-500">{s.role}</p>
            </div>
            <span className="text-xs text-gray-400">PIN: ••••</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Manager Page ────────────────────────────────────────────────────────
export default function ManagerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"shifts" | "staff">("shifts");

  if (!isAuthenticated) {
    return (
      <ActivationGate>
        <PinGate onSuccess={() => setIsAuthenticated(true)} />
      </ActivationGate>
    );
  }

  return (
    <ActivationGate>
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <img width="50" height="50" src="/cropped-Logo-luna-180x180.png" alt="Logo de Luna Street Food Viet"></img>
        <h1 className="text-lg font-bold text-gray-900">Manager</h1>
        <div className="flex items-center gap-4">
          <SyncIndicator />
          <button
            onClick={() => flushSyncQueue()}
            className="text-xs text-indigo-600 underline hover:text-indigo-800"
          >
            Synchroniser
          </button>
          <a href="/" className="text-xs text-gray-400 underline hover:text-gray-600">
            ← Quitter
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["shifts", "staff"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab === "shifts" ? "Horaires" : "Employés"}
            </button>
          ))}
        </div>

        {activeTab === "shifts" && <ShiftsTab />}
        {activeTab === "staff" && <StaffTab />}
      </div>
    </main>
    </ActivationGate>
  );
}
