"use client";

import { useEffect, useState } from "react";
import { getPendingCount } from "@/lib/syncQueue";

export function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    async function check() {
      const count = await getPendingCount();
      setPendingCount(count);
    }
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isOnline && pendingCount === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Online
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        Offline
        {pendingCount > 0 && (
          <span className="ml-1 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
            {pendingCount} en attente
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-amber-600">
      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      Synchronisation...
    </div>
  );
}
