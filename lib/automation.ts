import { prisma } from "@/lib/prisma";
import { notify, taskParticipants } from "@/lib/notify";
import { getSetting, setSetting } from "@/lib/settings";
import { unfinishedBlockers } from "@/lib/dependencies";
import { dispatchWebhooks } from "@/lib/webhooks";
import type { Recurrence, TaskStatus } from "@/app/generated/prisma/client";

/* ---------- Pengaturan aturan ---------- */

export type AutomationSettings = {
  /** Pindahkan ke "Menunggu Review" saat semua sub-tugas selesai. */
  autoReviewWhenSubtasksDone: boolean;
  /** Kirim pengingat N jam sebelum tenggat (0 = mati). */
  dueReminderHours: number;
  /** Beri tahu penanggung jawab saat tugas melewati tenggat. */
  overdueAlerts: boolean;
  /** Sertakan supervisor divisi pada peringatan terlambat. */
  notifySupervisorOnOverdue: boolean;
  /** Beri tahu pemilik tugas yang terblokir saat prasyaratnya selesai. */
  notifyDependents: boolean;
};

export const AUTOMATION_DEFAULTS: AutomationSettings = {
  autoReviewWhenSubtasksDone: true,
  dueReminderHours: 24,
  overdueAlerts: true,
  notifySupervisorOnOverdue: true,
  notifyDependents: true,
};

const KEY = "automation.rules";

export async function getAutomation(): Promise<AutomationSettings> {
  return { ...AUTOMATION_DEFAULTS, ...(await getSetting<Partial<AutomationSettings>>(KEY, {})) };
}

export async function saveAutomation(input: AutomationSettings) {
  await setSetting(KEY, input);
  return input;
}

const STATUS_TEXT: Record<TaskStatus, string> = {
  TODO: "Belum Mulai",
  IN_PROGRESS: "Berjalan",
  REVIEW: "Menunggu Review",
  DONE: "Selesai",
};

/* ---------- Tugas berulang ---------- */

function shift(date: Date | null, recurrence: Recurrence) {
  if (!date) return null;
  const next = new Date(date);
  if (recurrence === "DAILY") next.setUTCDate(next.getUTCDate() + 1);
  if (recurrence === "WEEKLY") next.setUTCDate(next.getUTCDate() + 7);
  if (recurrence === "MONTHLY") next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

/** Buat kejadian berikutnya dari tugas berulang yang baru diselesaikan. */
export async function createNextOccurrence(taskId: string, actor: { id: string; name: string }) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      title: true,
      description: true,
      priority: true,
      recurrence: true,
      startDate: true,
      dueDate: true,
      projectId: true,
      divisionId: true,
      assigneeId: true,
      creatorId: true,
      isMilestone: true,
      labels: { select: { labelId: true } },
      subtasks: { orderBy: { position: "asc" }, select: { title: true } },
      assignments: { select: { userId: true } },
    },
  });
  if (!task || task.recurrence === "NONE") return null;

  // Tanpa tanggal: jadwalkan dari hari ini.
  const base = task.dueDate ?? new Date(new Date().toISOString().slice(0, 10));
  const next = await prisma.task.create({
    data: {
      title: task.title,
      description: task.description,
      priority: task.priority,
      recurrence: task.recurrence,
      isMilestone: task.isMilestone,
      startDate: shift(task.startDate, task.recurrence),
      dueDate: shift(base, task.recurrence),
      projectId: task.projectId,
      divisionId: task.divisionId,
      assigneeId: task.assigneeId,
      creatorId: task.creatorId,
      labels: { create: task.labels.map(({ labelId }) => ({ labelId })) },
      subtasks: { create: task.subtasks.map(({ title }, position) => ({ title, position })) },
      assignments: { create: task.assignments.map(({ userId }) => ({ userId })) },
      activities: {
        create: {
          userId: actor.id,
          message: `Otomatis: kejadian berikutnya dari tugas berulang "${task.title}" dibuat`,
        },
      },
    },
    select: { id: true, dueDate: true },
  });
  await notify([task.assigneeId, ...task.assignments.map((a) => a.userId)], {
    type: "RECURRING",
    title: `Tugas rutin berikutnya: ${task.title}`,
    body: next.dueDate ? `Tenggat ${next.dueDate.toISOString().slice(0, 10)}` : null,
    taskId: next.id,
    actorId: null,
  });
  return next.id;
}

/* ---------- Setelah perubahan status ---------- */

export async function afterStatusChange(
  task: { id: string; title: string },
  from: TaskStatus,
  to: TaskStatus,
  actor: { id: string; name: string }
) {
  if (from === to) return;
  const rules = await getAutomation();
  await notify(await taskParticipants(task.id), {
    type: "STATUS_CHANGED",
    title: `${task.title}: ${STATUS_TEXT[to]}`,
    body: `${actor.name} mengubah status dari ${STATUS_TEXT[from]} menjadi ${STATUS_TEXT[to]}.`,
    taskId: task.id,
    actorId: actor.id,
  });

  void dispatchWebhooks(
    to === "DONE" ? "task.completed" : "task.status_changed",
    { id: task.id, title: task.title, from, to, actor: { id: actor.id, name: actor.name } },
    to === "DONE"
      ? `✅ Selesai: *${task.title}* oleh ${actor.name}`
      : `🔄 *${task.title}*: ${STATUS_TEXT[from]} → ${STATUS_TEXT[to]} (${actor.name})`
  );
  if (to === "DONE") {
    // task.completed juga dikirim ke pelanggan task.status_changed.
    void dispatchWebhooks(
      "task.status_changed",
      { id: task.id, title: task.title, from, to, actor: { id: actor.id, name: actor.name } },
      `🔄 *${task.title}*: ${STATUS_TEXT[from]} → ${STATUS_TEXT[to]} (${actor.name})`
    );
  }

  if (to !== "DONE") return;

  // Tugas yang menunggu tugas ini: beri tahu bila kini semua prasyaratnya selesai.
  if (rules.notifyDependents) {
    const dependents = await prisma.task.findMany({
      where: { dependsOn: { some: { dependsOnId: task.id } }, status: { not: "DONE" } },
      select: { id: true, title: true, assigneeId: true, assignments: { select: { userId: true } } },
    });
    for (const dependent of dependents) {
      if ((await unfinishedBlockers(dependent.id)).length) continue;
      await notify([dependent.assigneeId, ...dependent.assignments.map((a) => a.userId)], {
        type: "DEPENDENCY_READY",
        title: `Siap dikerjakan: ${dependent.title}`,
        body: `Prasyarat "${task.title}" sudah selesai.`,
        taskId: dependent.id,
        actorId: actor.id,
      });
    }
  }

  await createNextOccurrence(task.id, actor);
}

/* ---------- Sub-tugas selesai semua ---------- */

/** Mengembalikan true bila status tugas dipindah otomatis ke REVIEW. */
export async function afterSubtasksChanged(taskId: string, actor: { id: string; name: string }) {
  const rules = await getAutomation();
  if (!rules.autoReviewWhenSubtasksDone) return false;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true, status: true, creatorId: true, subtasks: { select: { done: true } } },
  });
  if (!task || !task.subtasks.length || task.subtasks.some((subtask) => !subtask.done)) return false;
  if (task.status !== "TODO" && task.status !== "IN_PROGRESS") return false;
  if ((await unfinishedBlockers(taskId)).length) return false;

  await prisma.$transaction([
    prisma.task.update({ where: { id: taskId }, data: { status: "REVIEW" } }),
    prisma.taskAssignment.updateMany({ where: { taskId }, data: { status: "REVIEW" } }),
    prisma.activity.create({
      data: {
        userId: actor.id,
        taskId,
        message: `Otomatisasi: semua sub-tugas "${task.title}" selesai, status dipindah ke Menunggu Review`,
      },
    }),
  ]);
  await notify([task.creatorId], {
    type: "AUTOMATION",
    title: `Siap direview: ${task.title}`,
    body: "Semua sub-tugas selesai; status dipindah otomatis ke Menunggu Review.",
    taskId,
    actorId: actor.id,
  });
  return true;
}

/* ---------- Pemeriksaan terjadwal ---------- */

/** Pengingat tenggat & peringatan terlambat. Aman dijalankan berulang (idempoten). */
export async function runScheduledChecks(now = new Date()) {
  const rules = await getAutomation();
  let reminders = 0;
  let overdue = 0;

  if (rules.dueReminderHours > 0) {
    const horizon = new Date(now.getTime() + rules.dueReminderHours * 60 * 60 * 1000);
    const dueSoon = await prisma.task.findMany({
      where: { status: { not: "DONE" }, dueReminderSentAt: null, dueDate: { gte: now, lte: horizon } },
      select: { id: true, title: true, dueDate: true, assigneeId: true, assignments: { select: { userId: true } } },
      take: 500,
    });
    for (const task of dueSoon) {
      // Tandai dulu (klaim) agar dua proses tidak mengirim ganda.
      const claimed = await prisma.task.updateMany({
        where: { id: task.id, dueReminderSentAt: null },
        data: { dueReminderSentAt: now },
      });
      if (!claimed.count) continue;
      await notify([task.assigneeId, ...task.assignments.map((a) => a.userId)], {
        type: "DUE_SOON",
        title: `Tenggat segera: ${task.title}`,
        body: `Jatuh tempo ${task.dueDate!.toISOString().slice(0, 10)}.`,
        taskId: task.id,
      });
      reminders++;
    }
  }

  if (rules.overdueAlerts) {
    const todayUtc = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
    const late = await prisma.task.findMany({
      where: { status: { not: "DONE" }, overdueNotifiedAt: null, dueDate: { lt: todayUtc } },
      select: {
        id: true,
        title: true,
        dueDate: true,
        assigneeId: true,
        assignments: { select: { userId: true } },
        division: { select: { supervisorId: true } },
      },
      take: 500,
    });
    for (const task of late) {
      const claimed = await prisma.task.updateMany({
        where: { id: task.id, overdueNotifiedAt: null },
        data: { overdueNotifiedAt: now },
      });
      if (!claimed.count) continue;
      await notify(
        [
          task.assigneeId,
          ...task.assignments.map((a) => a.userId),
          rules.notifySupervisorOnOverdue ? task.division?.supervisorId : null,
        ],
        {
          type: "OVERDUE",
          title: `Terlambat: ${task.title}`,
          body: `Tenggat ${task.dueDate!.toISOString().slice(0, 10)} sudah lewat.`,
          taskId: task.id,
        }
      );
      overdue++;
    }
  }

  return { reminders, overdue };
}
