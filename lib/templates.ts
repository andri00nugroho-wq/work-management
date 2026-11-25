import type { TaskPriority } from "@/app/generated/prisma/client";

/** Satu tugas dalam templat. Tanggal relatif terhadap tanggal mulai proyek (hari). */
export type TemplateItem = {
  title: string;
  description?: string;
  priority: TaskPriority;
  startOffset: number;
  duration: number;
  isMilestone?: boolean;
  subtasks?: string[];
  /** Indeks tugas lain dalam templat yang harus selesai lebih dulu. */
  dependsOn?: number[];
};

export type TemplateSummary = {
  id: string;
  name: string;
  description: string | null;
  builtIn: boolean;
  items: TemplateItem[];
};

export const BUILT_IN_TEMPLATES: TemplateSummary[] = [
  {
    id: "builtin-product-launch",
    name: "Peluncuran produk",
    description: "Dari riset pasar hingga evaluasi pasca-peluncuran.",
    builtIn: true,
    items: [
      { title: "Riset pasar & target pelanggan", priority: "HIGH", startOffset: 0, duration: 5, subtasks: ["Survei pelanggan", "Analisis kompetitor", "Rumuskan persona"] },
      { title: "Tetapkan harga & positioning", priority: "HIGH", startOffset: 5, duration: 3, dependsOn: [0] },
      { title: "Siapkan materi pemasaran", priority: "MEDIUM", startOffset: 8, duration: 7, dependsOn: [1], subtasks: ["Foto produk", "Copywriting", "Desain banner"] },
      { title: "Latih tim penjualan", priority: "MEDIUM", startOffset: 10, duration: 3, dependsOn: [1] },
      { title: "Hari peluncuran", priority: "URGENT", startOffset: 15, duration: 1, isMilestone: true, dependsOn: [2, 3] },
      { title: "Evaluasi 30 hari pasca-peluncuran", priority: "MEDIUM", startOffset: 45, duration: 3, dependsOn: [4] },
    ],
  },
  {
    id: "builtin-onboarding",
    name: "Onboarding karyawan",
    description: "Minggu pertama hingga evaluasi masa percobaan.",
    builtIn: true,
    items: [
      { title: "Siapkan akun, perangkat & akses", priority: "HIGH", startOffset: -3, duration: 3, subtasks: ["Email kantor", "Laptop", "Akses aplikasi"] },
      { title: "Orientasi perusahaan & tur kantor", priority: "MEDIUM", startOffset: 0, duration: 1, dependsOn: [0] },
      { title: "Pengenalan tim & buddy", priority: "MEDIUM", startOffset: 1, duration: 2, dependsOn: [1] },
      { title: "Pelatihan SOP divisi", priority: "HIGH", startOffset: 2, duration: 5, dependsOn: [1], subtasks: ["Baca SOP", "Shadowing", "Kuis SOP"] },
      { title: "Check-in 30 hari", priority: "MEDIUM", startOffset: 30, duration: 1, isMilestone: true },
      { title: "Evaluasi masa percobaan", priority: "HIGH", startOffset: 90, duration: 2, dependsOn: [4] },
    ],
  },
  {
    id: "builtin-campaign",
    name: "Kampanye pemasaran",
    description: "Perencanaan, produksi konten, tayang, dan laporan hasil.",
    builtIn: true,
    items: [
      { title: "Brief & tujuan kampanye", priority: "HIGH", startOffset: 0, duration: 2, subtasks: ["Target KPI", "Anggaran", "Kanal"] },
      { title: "Kalender konten", priority: "MEDIUM", startOffset: 2, duration: 3, dependsOn: [0] },
      { title: "Produksi konten", priority: "HIGH", startOffset: 5, duration: 7, dependsOn: [1], subtasks: ["Desain", "Video", "Caption"] },
      { title: "Review & persetujuan konten", priority: "HIGH", startOffset: 12, duration: 2, dependsOn: [2] },
      { title: "Kampanye tayang", priority: "URGENT", startOffset: 14, duration: 1, isMilestone: true, dependsOn: [3] },
      { title: "Laporan hasil kampanye", priority: "MEDIUM", startOffset: 30, duration: 3, dependsOn: [4] },
    ],
  },
];

const PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "URGENT"]);

/** Validasi isi templat kustom dari database. */
export function parseItems(value: unknown): TemplateItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      title: String(item.title ?? "").slice(0, 180),
      description: typeof item.description === "string" ? item.description.slice(0, 5000) : undefined,
      priority: (PRIORITIES.has(String(item.priority)) ? item.priority : "MEDIUM") as TaskPriority,
      startOffset: Number.isInteger(item.startOffset) ? (item.startOffset as number) : 0,
      duration: Number.isInteger(item.duration) && (item.duration as number) > 0 ? (item.duration as number) : 1,
      isMilestone: item.isMilestone === true,
      subtasks: Array.isArray(item.subtasks) ? item.subtasks.map(String).slice(0, 50) : [],
      dependsOn: Array.isArray(item.dependsOn) ? item.dependsOn.filter(Number.isInteger) : [],
    }))
    .filter((item) => item.title);
}
