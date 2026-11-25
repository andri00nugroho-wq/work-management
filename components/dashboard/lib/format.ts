export function formatDate(value?: string | null) {
  if (!value) return "Tanpa tenggat";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tanpa tenggat";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Waktu tidak diketahui";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatFileSize(value: number) {
  return value < 1024 * 1024
    ? `${Math.max(1, Math.round(value / 1024))} KB`
    : `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

/** Jam saja untuk hari ini, selain itu "tgl bln · jam". */
export function formatChatStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  if (date.toDateString() === new Date().toDateString()) return time;
  const day = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date);
  return `${day} · ${time}`;
}

export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "R"
  );
}

export function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function errorText(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

/** Nilai <input type="date"> dari tanggal ISO (tanggal disimpan sebagai tengah malam UTC). */
export function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

/** "3 menit lalu", "2 jam lalu", atau tanggal untuk yang lebih lama. */
export function formatRelative(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return "";
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(value);
}
