import {
  faCalendarDays,
  faChartColumn,
  faChartGantt,
  faCircle,
  faComments,
  faFolderOpen,
  faGear,
  faHourglassHalf,
  faListCheck,
  faPeopleGroup,
  faTableCellsLarge,
  faTableColumns,
  faUmbrellaBeach,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type {
  ChatStatus,
  MenuName,
  Recurrence,
  TaskPriority,
  TaskStatus,
  UserRole,
} from "./types";

/** `manage` = hanya peran manajemen; `staff` = disembunyikan dari Tamu/Klien. */
export const MENU: Array<{ name: MenuName; icon: IconDefinition; manage?: boolean; staff?: boolean }> = [
  { name: "Dashboard", icon: faTableCellsLarge },
  { name: "Proyek", icon: faFolderOpen },
  { name: "Tugas Saya", icon: faListCheck },
  { name: "Board Kanban", icon: faTableColumns },
  { name: "Kalender", icon: faCalendarDays },
  { name: "Timeline", icon: faChartGantt },
  { name: "Tim", icon: faUsers, staff: true },
  { name: "Laporan", icon: faChartColumn },
  { name: "Chat", icon: faComments, staff: true },
  { name: "Pengaturan", icon: faGear, manage: true },
];

/** Menu yang menampilkan panel daftar tugas / kanban. */
export const TASK_MENUS: MenuName[] = ["Dashboard", "Tugas Saya", "Board Kanban", "Kalender", "Timeline"];

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

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  NONE: "Tidak berulang",
  DAILY: "Setiap hari",
  WEEKLY: "Setiap minggu",
  MONTHLY: "Setiap bulan",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  SPV: "Supervisor",
  MANAGER: "Manager",
  MEMBER: "Karyawan",
  GUEST: "Tamu / Klien",
};

export const ROLES = Object.keys(ROLE_LABEL) as UserRole[];

export const MANAGE_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "SPV", "MANAGER"];
export const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

export const CHAT_STATUS_META: Record<
  ChatStatus,
  { label: string; short: string; icon: IconDefinition; tone: string }
> = {
  AVAILABLE: { label: "Tersedia", short: "Tersedia", icon: faCircle, tone: "available" },
  MEETING: { label: "Sedang rapat", short: "Rapat", icon: faPeopleGroup, tone: "meeting" },
  LEAVE: { label: "Cuti / libur", short: "Cuti", icon: faUmbrellaBeach, tone: "leave" },
  SLOW_RESPONSE: { label: "Lambat merespons", short: "Lambat", icon: faHourglassHalf, tone: "slow" },
};

export const CHAT_STATUSES = Object.keys(CHAT_STATUS_META) as ChatStatus[];

export const CHAT_MAX_FILE_SIZE = 50 * 1024 * 1024;
export const CHAT_MAX_FILES = 10;

export const ISSUE_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ISSUE_EVIDENCE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const TASK_LINK_LIMIT = 20;
