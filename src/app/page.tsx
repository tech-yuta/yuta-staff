"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { PinPad } from "@/components/PinPad";
import { ConfirmAction } from "@/components/ConfirmAction";
import { SuccessScreen } from "@/components/SuccessScreen";
import { SyncIndicator } from "@/components/SyncIndicator";
import { TodayStaffPanel } from "@/components/TodayStaffPanel";
import { ActivationGate } from "@/components/ActivationGate";
import {
  getStaffByPin,
  getTodayOpenShift,
  clockIn,
  clockOut,
} from "@/lib/clockService";
import type { Staff, Shift, ClockAction } from "@/types";

type PageState =
  | { status: "idle" }
  | { status: "confirming"; staff: Staff; action: ClockAction; openShift: Shift | null }
  | { status: "processing" }
  | { status: "success"; staff: Staff; action: ClockAction; shift: Shift }
  | { status: "error"; message: string };

function HomePage() {
  const [state, setState] = useState<PageState>({ status: "idle" });
  const [pinError, setPinError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Live clock
  useEffect(() => {
    function tick() {
      setCurrentTime(format(new Date(), "HH:mm:ss  —  EEEE dd/MM/yyyy", { locale: fr }));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePinSubmit = useCallback(async (pin: string) => {
    setIsLoading(true);
    setPinError("");
    try {
      const staff = await getStaffByPin(pin);
      if (!staff) {
        setPinError("PIN incorrect. Veuillez réessayer.");
        setIsLoading(false);
        return;
      }
      const openShift = await getTodayOpenShift(staff.id);
      const action: ClockAction = openShift ? "out" : "in";
      setState({ status: "confirming", staff, action, openShift });
    } catch {
      setPinError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (state.status !== "confirming") return;
    const { staff, action } = state;
    setState({ status: "processing" });
    try {
      const shift = action === "in" ? await clockIn(staff) : await clockOut(staff);
      setState({ status: "success", staff, action, shift });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    }
  }, [state]);

  const handleReset = useCallback(() => {
    setState({ status: "idle" });
    setPinError("");
    setRefreshKey((k) => k + 1); // reload panel sau mỗi action
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      {/* ── Header ── */}
      <header className="w-full flex justify-between items-center px-5 py-4 bg-white border-b border-gray-100 shrink-0">
        <div className='inline-block'>
          <img width="50" height="50" src="/cropped-Logo-luna-180x180.png" alt="Logo de Luna Street Food Viet"></img>
          <span className="text-xs text-gray-400 mt-0.5 font-mono ml-2">{currentTime}</span>
        </div>
        <div className="flex items-center gap-3">
          <SyncIndicator />
          {/* Mobile toggle button */}
          <button
            className="lg:hidden flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium"
            onClick={() => setPanelOpen((v) => !v)}
          >
            <span>Employés</span>
            <span>{panelOpen ? "▲" : "▼"}</span>
          </button>
          <a href="/manager" className="text-xs text-gray-400 underline">
            Manager
          </a>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL — desktop always visible, mobile slide-down ── */}

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-white border-r border-gray-100 p-5 overflow-y-auto">
          <TodayStaffPanel refreshKey={refreshKey} />
        </aside>

        {/* Mobile drawer (above content) */}
        {panelOpen && (
          <div className="lg:hidden absolute inset-x-0 top-[4.5rem] z-30 bg-white border-b border-gray-200 shadow-lg px-5 py-4 max-h-[55vh] overflow-y-auto">
            <TodayStaffPanel refreshKey={refreshKey} />
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 flex flex-col items-center justify-between py-8 px-4 overflow-y-auto">
          <div className="w-full max-w-sm" /> {/* spacer top */}

          <div className="flex-1 flex items-center justify-center w-full">
            {state.status === "idle" && (
              <PinPad
                onSubmit={handlePinSubmit}
                error={pinError}
                isLoading={isLoading}
              />
            )}

            {state.status === "confirming" && (
              <ConfirmAction
                staff={state.staff}
                action={state.action}
                openShift={state.openShift}
                onConfirm={handleConfirm}
                onCancel={handleReset}
              />
            )}

            {state.status === "processing" && (
              <div className="text-center text-gray-400">
                <div className="text-5xl mb-4 animate-spin inline-block">⟳</div>
                <p className="text-sm">Traitement en cours...</p>
              </div>
            )}

            {state.status === "success" && (
              <SuccessScreen
                staff={state.staff}
                action={state.action}
                shift={state.shift}
                onReset={handleReset}
              />
            )}

            {state.status === "error" && (
              <div className="text-center px-6 max-w-xs">
                <div className="text-5xl mb-4">⚠️</div>
                <p className="text-red-500 font-medium mb-6">{state.message}</p>
                <button
                  onClick={handleReset}
                  className="px-8 py-3 bg-gray-800 text-white rounded-2xl font-medium w-full"
                >
                  Retour
                </button>
              </div>
            )}
          </div>

          <footer className="text-xs text-gray-300">Luna Staff Manager v1.0</footer>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ActivationGate>
      <HomePage />
    </ActivationGate>
  );
}
