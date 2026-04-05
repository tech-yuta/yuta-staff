"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "yuta_activation_expires";
const DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày

function isActivated(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  return Date.now() < Number(raw);
}

function saveActivation() {
  localStorage.setItem(STORAGE_KEY, String(Date.now() + DURATION_MS));
}

interface ActivationGateProps {
  children: React.ReactNode;
}

export function ActivationGate({ children }: ActivationGateProps) {
  // "checking" → tránh flash khi rehydrate
  const [status, setStatus] = useState<"checking" | "locked" | "unlocked">("checking");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setStatus(isActivated() ? "unlocked" : "locked");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        saveActivation();
        setStatus("unlocked");
      } else {
        const data = await res.json();
        setError(data.error ?? "Code incorrect");
        setCode("");
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  if (status === "checking") return null;

  if (status === "unlocked") return <>{children}</>;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-xs text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Yuta Staff</h1>
        <p className="text-gray-400 text-sm mb-6">
          Entrez le code d&apos;activation pour accéder à l&apos;application
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code d'activation"
            autoFocus
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-widest focus:border-indigo-400 focus:outline-none"
          />
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={isLoading || !code}
            className="bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Vérification..." : "Activer"}
          </button>
        </form>
      </div>
    </main>
  );
}
