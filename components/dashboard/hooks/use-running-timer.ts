"use client";

import { useCallback, useEffect, useState } from "react";
import { request } from "../lib/http";

export type RunningTimer = { id: string; startedAt: string; task: { id: string; title: string } } | null;

/** Timer aktif pengguna; disegarkan saat ada event "rei:timer" dan tiap menit. */
export function useRunningTimer() {
  const [timer, setTimer] = useState<RunningTimer>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const result = await request<{ entry: RunningTimer }>("/api/time/running");
      setTimer(result.entry);
    } catch {
      // Dicoba lagi berikutnya.
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
    const poll = window.setInterval(() => void load(), 60_000);
    const onChange = () => void load();
    window.addEventListener("rei:timer", onChange);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("rei:timer", onChange);
    };
  }, [load]);

  // Detik berjalan hanya saat ada timer.
  useEffect(() => {
    if (!timer) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [timer]);

  const elapsed = timer ? Math.max(0, Math.floor((now - new Date(timer.startedAt).getTime()) / 1000)) : 0;
  return { timer, elapsed, reload: load };
}

export function formatClock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
