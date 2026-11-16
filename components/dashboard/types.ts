export type UserRole = "SUPER_ADMIN" | "ADMIN" | "SPV" | "MANAGER" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type MenuName =
  | "Dashboard"
  | "Proyek"
  | "Tugas Saya"
  | "Board Kanban"
  | "Tim"
  | "Laporan"
  | "Chat";

export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

/* ---------- Tugas ---------- */

export type TaskLink = { id: string; label: string; url: string; createdAt: string };
export type TaskLinkDraft = { label: string; url: string };

export type TaskIssueReport = {
  id: string;
  description: string;
  createdAt: string;
  user: { name: string };
  evidenceName: string | null;
  evidenceMimeType: string | null;
  evidenceSize: number | null;
};

export type TaskTag = {
  id: string;
  createdAt: string;
  user: { id: string; name: string };
  taggedBy: { name: string };
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  project?: { id?: string; name: string } | null;
  division?: { name: string } | null;
  assignee?: { id?: string; name: string } | null;
  creator?: { id?: string; name: string } | null;
  links?: TaskLink[];
  tags?: TaskTag[];
  issueReports?: TaskIssueReport[];
};

/** Terapkan perubahan sebagian pada satu tugas di semua daftar. */
export type TaskPatcher = (taskId: string, patch: Partial<Task>) => void;

/* ---------- Proyek, tim, dashboard ---------- */

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  tasks?: Task[];
  _count?: { tasks?: number };
};

export type Member = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  division?: { name: string } | null;
};

export type DashboardStats = {
  totalTasks?: number;
  todo?: number;
  inProgress?: number;
  review?: number;
  done?: number;
  overdue?: number;
  totalUsers?: number;
  totalDivisions?: number;
  totalProjects?: number;
};

export type DashboardData = {
  stats?: DashboardStats;
  recentTasks?: Task[];
  tasks?: Task[];
  projects?: Array<{ id: string; name: string; tasks?: Task[] }>;
};

/* ---------- Chat ---------- */

export type ChatAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  body: string | null;
  createdAt: string;
  sender: { id: string; name: string };
  attachments: ChatAttachment[];
};

export type ChatConversation = {
  id: string;
  kind: "DIRECT" | "GROUP";
  name: string | null;
  title: string;
  updatedAt: string;
  members: Array<{ id: string; name: string; role: UserRole }>;
  lastMessage: {
    id: string;
    preview: string;
    createdAt: string;
    senderName: string;
    attachmentCount: number;
  } | null;
  unreadCount: number;
};

export type ChatStatus = "AVAILABLE" | "MEETING" | "LEAVE" | "SLOW_RESPONSE";
export type ChatLiveState = "connecting" | "online" | "offline";

export type ChatPresenceUser = {
  id: string;
  name: string;
  role: UserRole;
  division: string | null;
  status: ChatStatus;
  note: string | null;
  online: boolean;
};
