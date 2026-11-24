import { runScheduledChecks } from "@/lib/automation";

const INTERVAL_MS = 5 * 60 * 1000;
const store = globalThis as typeof globalThis & { __reiScheduler?: NodeJS.Timeout };

/** Satu interval per proses (aman terhadap hot reload saat development). */
export function startScheduler() {
  if (store.__reiScheduler) return;
  const tick = () =>
    runScheduledChecks()
      .then((result) => {
        if (result.reminders || result.overdue) console.log("[scheduler]", result);
      })
      .catch((error) => console.error("[scheduler]", error));
  store.__reiScheduler = setInterval(tick, INTERVAL_MS);
  store.__reiScheduler.unref?.();
  // Jalankan sekali tak lama setelah server siap.
  setTimeout(tick, 15_000).unref?.();
}
