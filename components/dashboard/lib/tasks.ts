import { PRIORITY_LABEL, STATUSES, STATUS_LABEL } from "../constants";
import type { ChatMessage, Member, Project, Task, TaskFilters, TaskPriority } from "../types";

export function isOverdue(task: Task) {
  if (!task.dueDate || task.status === "DONE") return false;
  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export function countDone(tasks: Task[]) {
  return tasks.filter((task) => task.status === "DONE").length;
}

/** Tugas milik proyek: pakai data dari API proyek, atau cocokkan dari daftar tugas. */
export function tasksOfProject(project: Project, allTasks: Task[]): Task[] {
  if (project.tasks?.length) return project.tasks;
  return allTasks.filter(
    (task) =>
      (task.project?.id && task.project.id === project.id) ||
      task.project?.name === project.name
  );
}

export function tasksOfMember(member: Member, allTasks: Task[]): Task[] {
  return allTasks.filter(
    (task) =>
      (task.assignee?.id && task.assignee.id === member.id) ||
      task.assignee?.name === member.name ||
      Boolean(task.assignments?.some((assignment) => assignment.user.id === member.id))
  );
}

export const OVERLOAD_OPEN_TASKS = 10;

/** Beban kerja anggota: tugas terbuka, sisa jam estimasi vs kapasitas mingguan. */
export function workloadOf(member: Member, allTasks: Task[]) {
  const open = tasksOfMember(member, allTasks).filter((task) => task.status !== "DONE");
  const remainingMinutes = open.reduce(
    (sum, task) => sum + Math.max(0, (task.estimateMinutes ?? 0) - loggedMinutes(task)),
    0
  );
  const capacityMinutes = (member.weeklyCapacityHours ?? 40) * 60;
  const load = capacityMinutes ? Math.round((remainingMinutes / capacityMinutes) * 100) : 0;
  return {
    open: open.length,
    overdue: open.filter(isOverdue).length,
    remainingMinutes,
    capacityMinutes,
    load,
    overloaded: remainingMinutes > capacityMinutes || open.length >= OVERLOAD_OPEN_TASKS,
  };
}

export function matchesQuery(task: Task, query: string) {
  if (!query) return true;
  return [
    task.title,
    task.description ?? "",
    task.project?.name ?? "",
    task.division?.name ?? "",
    task.assignee?.name ?? "",
    ...(task.labels ?? []).map(({ label }) => label.name),
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function groupProgress(tasks: Task[], keyOf: (task: Task) => string) {
  const map = new Map<string, { total: number; done: number }>();
  for (const task of tasks) {
    const key = keyOf(task);
    const entry = map.get(key) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (task.status === "DONE") entry.done += 1;
    map.set(key, entry);
  }
  return Array.from(map, ([label, value]) => ({ label, ...value }));
}

/** Menit tercatat (timer berjalan dihitung sampai sekarang). */
export function loggedMinutes(task: Task) {
  return (task.timeEntries ?? []).reduce((sum, entry) => {
    if (entry.minutes !== null) return sum + entry.minutes;
    const end = entry.endedAt ? new Date(entry.endedAt) : new Date();
    return sum + Math.max(0, Math.round((end.getTime() - new Date(entry.startedAt).getTime()) / 60000));
  }, 0);
}

export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} mnt`;
  return rest ? `${hours} j ${rest} mnt` : `${hours} j`;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Senin 00:00 (waktu lokal) dari minggu yang memuat tanggal ini. */
function weekStart(date: Date) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day;
}

/** Tugas dibuat vs diselesaikan per minggu, `weeks` minggu terakhir. */
export function weeklyTrend(tasks: Task[], weeks = 8) {
  const current = weekStart(new Date());
  const buckets = Array.from({ length: weeks }, (_, index) => {
    const start = new Date(current.getTime() - (weeks - 1 - index) * WEEK_MS);
    return { start, label: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(start), created: 0, completed: 0 };
  });
  const first = buckets[0].start.getTime();
  const slot = (value?: string | null) => {
    if (!value) return -1;
    const time = new Date(value).getTime();
    if (Number.isNaN(time) || time < first) return -1;
    return Math.min(weeks - 1, Math.floor((weekStart(new Date(value)).getTime() - first) / WEEK_MS));
  };
  for (const task of tasks) {
    const created = slot(task.createdAt);
    if (created >= 0) buckets[created].created += 1;
    const completed = task.status === "DONE" ? slot(task.completedAt) : -1;
    if (completed >= 0) buckets[completed].completed += 1;
  }
  return buckets;
}

export type ProjectHealth = "on-track" | "at-risk" | "off-track" | "done";

/** Kesehatan proyek dari progres, keterlambatan, dan sisa waktu milestone. */
export function projectHealth(tasks: Task[]) {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.project?.name) continue;
    map.set(task.project.name, [...(map.get(task.project.name) ?? []), task]);
  }
  return Array.from(map, ([name, list]) => {
    const done = countDone(list);
    const overdue = list.filter(isOverdue).length;
    const open = list.length - done;
    const health: ProjectHealth =
      open === 0 ? "done" : overdue === 0 ? "on-track" : overdue / open > 0.25 ? "off-track" : "at-risk";
    return { name, total: list.length, done, overdue, health };
  }).sort((a, b) => b.overdue - a.overdue || a.name.localeCompare(b.name));
}

export function buildReport(tasks: Task[]) {
  const overdueTasks = tasks.filter(isOverdue);
  const estimated = tasks.filter((task) => task.estimateMinutes);
  const open = tasks.filter((task) => task.status !== "DONE").length;
  return {
    trend: weeklyTrend(tasks),
    health: projectHealth(tasks),
    overdueRatio: open ? Math.round((overdueTasks.length / open) * 100) : 0,
    time: estimated
      .map((task) => ({ task, estimate: task.estimateMinutes ?? 0, actual: loggedMinutes(task) }))
      .sort((a, b) => b.actual / b.estimate - a.actual / a.estimate),
    loggedTotal: tasks.reduce((sum, task) => sum + loggedMinutes(task), 0),
    total: tasks.length,
    done: countDone(tasks),
    inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
    overdue: overdueTasks.length,
    overdueTasks,
    byStatus: STATUSES.map((status) => ({
      label: STATUS_LABEL[status],
      value: tasks.filter((task) => task.status === status).length,
    })),
    byPriority: (Object.keys(PRIORITY_LABEL) as TaskPriority[]).map((priority) => ({
      label: PRIORITY_LABEL[priority],
      value: tasks.filter((task) => task.priority === priority).length,
    })),
    byAssignee: groupProgress(tasks, (task) => task.assignee?.name ?? "Belum ditetapkan"),
    byProject: groupProgress(tasks, (task) => task.project?.name ?? "Tanpa proyek"),
  };
}

export type TaskReport = ReturnType<typeof buildReport>;

export function isImageMime(mimeType: string) {
  return ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(
    mimeType
  );
}

export function chatPreviewFromMessage(message: ChatMessage) {
  const text = message.body?.replace(/\s+/g, " ").trim();
  if (text) return text.length > 120 ? `${text.slice(0, 117)}...` : text;
  if (message.attachments.length === 1) return message.attachments[0].name;
  if (message.attachments.length > 1) return `${message.attachments.length} berkas`;
  return "";
}

export const EMPTY_FILTERS: TaskFilters = {
  search: "",
  status: "ALL",
  priority: "ALL",
  assigneeId: "",
  labelId: "",
  dueFrom: "",
  dueTo: "",
};

/** Jumlah filter aktif selain pencarian teks. */
export function activeFilterCount(filters: TaskFilters) {
  return (
    Number(filters.status !== "ALL") +
    Number(filters.priority !== "ALL") +
    Number(Boolean(filters.assigneeId)) +
    Number(Boolean(filters.labelId)) +
    Number(Boolean(filters.dueFrom || filters.dueTo))
  );
}

export function matchesFilters(task: Task, filters: TaskFilters) {
  if (!matchesQuery(task, filters.search.trim().toLowerCase())) return false;
  if (filters.status !== "ALL" && task.status !== filters.status) return false;
  if (filters.priority !== "ALL" && task.priority !== filters.priority) return false;
  if (filters.assigneeId && task.assignee?.id !== filters.assigneeId) return false;
  if (filters.labelId && !task.labels?.some(({ label }) => label.id === filters.labelId)) return false;
  if (filters.dueFrom || filters.dueTo) {
    const due = task.dueDate?.slice(0, 10);
    if (!due) return false;
    if (filters.dueFrom && due < filters.dueFrom) return false;
    if (filters.dueTo && due > filters.dueTo) return false;
  }
  return true;
}
