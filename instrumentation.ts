/**
 * Dijalankan sekali saat server Next.js mulai. Di runtime Node.js, jalankan
 * pemeriksaan terjadwal (pengingat tenggat & peringatan terlambat) tiap 5 menit.
 * Untuk banyak instance, matikan dengan SCHEDULER_DISABLED=1 dan panggil
 * POST /api/automation/run dari satu cron eksternal.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.SCHEDULER_DISABLED === "1") return;
  const { startScheduler } = await import("./lib/scheduler");
  startScheduler();
}
