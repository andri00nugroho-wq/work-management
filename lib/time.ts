import { prisma } from "@/lib/prisma";

/** Durasi entri dalam menit (timer berjalan dihitung sampai sekarang). */
export function entryMinutes(entry: { minutes: number | null; startedAt: Date; endedAt: Date | null }) {
  if (entry.minutes !== null) return entry.minutes;
  const end = entry.endedAt ?? new Date();
  return Math.max(0, Math.round((end.getTime() - entry.startedAt.getTime()) / 60000));
}

/**
 * Hentikan timer yang sedang berjalan milik pengguna (di tugas mana pun).
 * Timer di bawah 1 menit dibuang agar tidak menjadi entri "0 menit".
 */
export async function stopRunningTimers(userId: string) {
  const running = await prisma.timeEntry.findMany({ where: { userId, endedAt: null } });
  const now = new Date();
  let saved = 0;
  for (const entry of running) {
    const minutes = entryMinutes({ ...entry, endedAt: now });
    if (minutes < 1) {
      await prisma.timeEntry.delete({ where: { id: entry.id } });
      continue;
    }
    await prisma.timeEntry.update({ where: { id: entry.id }, data: { endedAt: now, minutes } });
    saved++;
  }
  return saved;
}

export async function listTime(taskId: string) {
  const entries = await prisma.timeEntry.findMany({
    where: { taskId },
    orderBy: { startedAt: "desc" },
    take: 200,
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      minutes: true,
      note: true,
      user: { select: { id: true, name: true } },
    },
  });
  const totalMinutes = entries.reduce((sum, entry) => sum + entryMinutes(entry), 0);
  return { entries, totalMinutes };
}
