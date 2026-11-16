import { PRIORITY_LABEL, STATUSES, STATUS_LABEL } from "../constants";
import type { ChatMessage, Member, Project, Task, TaskPriority } from "../types";

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
      task.assignee?.name === member.name
  );
}

export function matchesQuery(task: Task, query: string) {
  if (!query) return true;
  return [
    task.title,
    task.description ?? "",
    task.project?.name ?? "",
    task.division?.name ?? "",
    task.assignee?.name ?? "",
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

export function buildReport(tasks: Task[]) {
  const overdueTasks = tasks.filter(isOverdue);
  return {
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
