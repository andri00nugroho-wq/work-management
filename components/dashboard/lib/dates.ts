/**
 * Utilitas tanggal berbasis string "YYYY-MM-DD" dalam UTC.
 * Tanggal tugas disimpan sebagai tengah malam UTC, jadi semua hitungan di sini
 * memakai UTC agar tidak bergeser sehari karena zona waktu (WIB = UTC+7).
 */
export type Day = string;

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDay(date: Date): Day {
  return date.toISOString().slice(0, 10);
}

/** Hari ini menurut kalender lokal pengguna, sebagai Day. */
export function today(): Day {
  const now = new Date();
  return toDay(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function parseDay(day: Day): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export function taskDay(value?: string | null): Day | null {
  return value ? value.slice(0, 10) : null;
}

export function addDays(day: Day, amount: number): Day {
  return toDay(new Date(parseDay(day).getTime() + amount * DAY_MS));
}

export function diffDays(from: Day, to: Day): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / DAY_MS);
}

export function addMonths(day: Day, amount: number): Day {
  const date = parseDay(day);
  return toDay(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)));
}

export function startOfMonth(day: Day): Day {
  return `${day.slice(0, 7)}-01`;
}

/** Senin pada minggu yang memuat `day`. */
export function startOfWeek(day: Day): Day {
  const weekday = (parseDay(day).getUTCDay() + 6) % 7; // Senin = 0
  return addDays(day, -weekday);
}

/** 6 minggu x 7 hari untuk grid bulan (dimulai Senin). */
export function monthGrid(day: Day): Day[] {
  const first = startOfWeek(startOfMonth(day));
  return Array.from({ length: 42 }, (_, index) => addDays(first, index));
}

export function weekDays(day: Day): Day[] {
  const first = startOfWeek(day);
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}

const fmt = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", ...options });

export const monthLabel = (day: Day) => fmt({ month: "long", year: "numeric" }).format(parseDay(day));
export const shortLabel = (day: Day) => fmt({ day: "numeric", month: "short" }).format(parseDay(day));
export const weekdayShort = (day: Day) => fmt({ weekday: "short" }).format(parseDay(day));
export const dayNumber = (day: Day) => parseDay(day).getUTCDate();
export const isWeekend = (day: Day) => [0, 6].includes(parseDay(day).getUTCDay());
