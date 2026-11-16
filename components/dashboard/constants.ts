import type {
  ChatStatus,
  MenuName,
  TaskPriority,
  TaskStatus,
  UserRole,
} from "./types";

export const MENU: Array<{ name: MenuName; icon: string }> = [
  { name: "Dashboard", icon: "▦" },
  { name: "Proyek", icon: "▤" },
  { name: "Tugas Saya", icon: "✓" },
  { name: "Board Kanban", icon: "▥" },
  { name: "Tim", icon: "♙" },
  { name: "Laporan", icon: "▤" },
  { name: "Chat", icon: "✉" },
];

/** Menu yang menampilkan panel daftar tugas / kanban. */
export const TASK_MENUS: MenuName[] = ["Dashboard", "Tugas Saya", "Board Kanban"];

export const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "Belum Mulai",
  IN_PROGRESS: "Berjalan",
  REVIEW: "Menunggu Review",
  DONE: "Selesai",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  URGENT: "Mendesak",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  SPV: "Supervisor",
  MANAGER: "Manager",
  MEMBER: "Karyawan",
};

export const ROLES = Object.keys(ROLE_LABEL) as UserRole[];

export const MANAGE_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "SPV", "MANAGER"];
export const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

export const CHAT_STATUS_META: Record<
  ChatStatus,
  { label: string; short: string; icon: string; tone: string }
> = {
  AVAILABLE: { label: "Tersedia", short: "Tersedia", icon: "●", tone: "available" },
  MEETING: { label: "Sedang rapat", short: "Rapat", icon: "◷", tone: "meeting" },
  LEAVE: { label: "Cuti / libur", short: "Cuti", icon: "⌂", tone: "leave" },
  SLOW_RESPONSE: { label: "Lambat merespons", short: "Lambat", icon: "…", tone: "slow" },
};

export const CHAT_STATUSES = Object.keys(CHAT_STATUS_META) as ChatStatus[];

export const CHAT_MAX_FILE_SIZE = 50 * 1024 * 1024;
export const CHAT_MAX_FILES = 10;

export const ISSUE_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ISSUE_EVIDENCE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const TASK_LINK_LIMIT = 20;
