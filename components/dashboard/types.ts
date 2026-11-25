export type UserRole = "SUPER_ADMIN" | "ADMIN" | "SPV" | "MANAGER" | "MEMBER" | "GUEST";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type MenuName =
  | "Dashboard"
  | "Proyek"
  | "Tugas Saya"
  | "Board Kanban"
  | "Tim"
  | "Laporan"
  | "Kalender"
  | "Timeline"
  | "Chat"
  | "Pengaturan";

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

export type Label = { id: string; name: string; color: string; _count?: { tasks?: number } };

export type Activity = {
  id: string;
  message: string;
  createdAt: string;
  user: { id: string; name: string };
  task?: { id: string; title: string } | null;
};

export type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  taskId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type AutomationSettings = {
  autoReviewWhenSubtasksDone: boolean;
  dueReminderHours: number;
  overdueAlerts: boolean;
  notifySupervisorOnOverdue: boolean;
  notifyDependents: boolean;
};

export type TaskRef = { id: string; title: string; status: TaskStatus };

export type WipLimits = Partial<Record<TaskStatus, number>>;

export type Subtask = { id: string; title: string; done: boolean; position: number };

export type TaskAssignment = { status: TaskStatus; user: { id: string; name: string } };

export type TaskComment = {
  id: string;
  body: string;
  mentionIds: string[];
  createdAt: string;
  editedAt: string | null;
  author: { id: string; name: string };
};

export type TaskAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  version: number;
  note: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string };
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
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  labels?: Array<{ label: Label }>;
  assignments?: TaskAssignment[];
  subtasks?: Subtask[];
  isMilestone?: boolean;
  recurrence?: Recurrence;
  estimateMinutes?: number | null;
  timeEntries?: Array<{ minutes: number | null; startedAt: string; endedAt: string | null }>;
  requesterName?: string | null;
  requesterEmail?: string | null;
  dependsOn?: Array<{ dependsOn: TaskRef }>;
  blocking?: Array<{ task: TaskRef }>;
  _count?: { comments?: number; attachments?: number };
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
  division?: { id?: string; name: string } | null;
  weeklyCapacityHours?: number;
};

export type TimeEntry = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  minutes: number | null;
  note: string | null;
  user: { id: string; name: string };
};

export type TemplateItem = {
  title: string;
  priority: TaskPriority;
  startOffset: number;
  duration: number;
  isMilestone?: boolean;
  subtasks?: string[];
  dependsOn?: number[];
};

export type ProjectTemplate = {
  id: string;
  name: string;
  description: string | null;
  builtIn: boolean;
  items: TemplateItem[];
};

export type IntakeForm = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  projectId: string | null;
  assigneeId: string | null;
  defaultPriority: TaskPriority;
  isPublic: boolean;
  isActive: boolean;
  _count: { tasks: number };
};

export type WebhookItem = {
  id: string;
  name: string;
  url: string;
  format: string;
  events: string[];
  isActive: boolean;
  lastStatus: number | null;
  lastError: string | null;
  lastDeliveredAt: string | null;
};

export type ApiKeyItem = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type Division = {
  id: string;
  name: string;
  description: string | null;
  supervisor: { id: string; name: string } | null;
  _count: { users: number; tasks: number };
};

/** Filter daftar tugas; semua opsional kecuali yang berstring kosong = tidak aktif. */
export type TaskFilters = {
  search: string;
  status: string;
  priority: string;
  assigneeId: string;
  labelId: string;
  dueFrom: string;
  dueTo: string;
};

export type SavedView = { id: string; name: string; filters: Partial<TaskFilters> };

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
  recentActivities?: Activity[];
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
