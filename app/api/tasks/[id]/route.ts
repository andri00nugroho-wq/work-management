import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authorize, fail, readJson, parseDate, parseIdList, checkDateRange, taskScope, oneOf,
  MANAGE_ROLES, PRIORITIES, STATUSES, TASK_INCLUDE,
} from "@/lib/api";
import { removeTaskEvidence } from "@/lib/task-evidence";
import { removeTaskFile } from "@/lib/task-files";
import { unfinishedBlockers } from "@/lib/dependencies";
import { afterStatusChange } from "@/lib/automation";
import { notify } from "@/lib/notify";
import type { Prisma } from "@/app/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

const STATUS_TEXT = {
  TODO: "Belum Mulai",
  IN_PROGRESS: "Berjalan",
  REVIEW: "Menunggu Review",
  DONE: "Selesai",
} as const;

const PRIORITY_TEXT = { LOW: "Rendah", MEDIUM: "Sedang", HIGH: "Tinggi", URGENT: "Mendesak" } as const;

function dateText(date: Date | null | undefined) {
  return date
    ? date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : "tanpa tanggal";
}

function sameDate(a: Date | null | undefined, b: Date | null | undefined) {
  return (a?.getTime() ?? null) === (b?.getTime() ?? null);
}

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { AND: [{ id }, taskScope(auth.user)] },
    include: TASK_INCLUDE,
  });
  if (!task) return fail("Tugas tidak ditemukan.", 404);
  return NextResponse.json({ task });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const existing = await prisma.task.findFirst({
    where: { AND: [{ id }, taskScope(user)] },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      startDate: true,
      dueDate: true,
      assigneeId: true,
      creatorId: true,
      assignee: { select: { name: true } },
      assignments: { select: { userId: true } },
      labels: { select: { labelId: true } },
    },
  });
  if (!existing) return fail("Tugas tidak ditemukan.", 404);

  if (user.role === "GUEST") {
    return fail("Tamu hanya dapat melihat, berkomentar, dan melampirkan berkas.", 403);
  }

  const isManager = MANAGE_ROLES.includes(user.role);
  const isOwner =
    existing.assigneeId === user.id ||
    existing.creatorId === user.id ||
    existing.assignments.some((a) => a.userId === user.id);
  if (!isManager && !isOwner) return fail("Anda tidak berhak mengubah tugas ini.", 403);

  const body = await readJson(request);
  const data: Prisma.TaskUncheckedUpdateInput = {};
  const notes: string[] = [];

  if (body.status !== undefined) {
    if (!oneOf(STATUSES, body.status)) return fail("Status tidak valid.");
    data.status = body.status;
  }

  let labelIds: string[] | undefined;
  let newAssignee: { id: string; name: string; divisionId: string | null } | undefined;

  // Field lain hanya untuk role manajemen.
  if (isManager) {
    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title || title.length > 180) return fail("Nama tugas tidak valid.");
      if (title !== existing.title) {
        data.title = title;
        notes.push(`mengganti nama tugas menjadi "${title}"`);
      }
    }
    if (body.description !== undefined) {
      const description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null;
      if (description && description.length > 5000) return fail("Deskripsi maksimal 5000 karakter.");
      data.description = description;
    }
    if (body.priority !== undefined) {
      if (!oneOf(PRIORITIES, body.priority)) return fail("Prioritas tidak valid.");
      if (body.priority !== existing.priority) {
        data.priority = body.priority;
        notes.push(`mengubah prioritas menjadi ${PRIORITY_TEXT[body.priority]}`);
      }
    }
    if (body.startDate !== undefined) {
      const start = parseDate(body.startDate);
      if (start === "invalid") return fail("Tanggal mulai tidak valid.");
      if (!sameDate(start, existing.startDate)) {
        data.startDate = start;
        notes.push(`mengubah tanggal mulai menjadi ${dateText(start)}`);
      }
    }
    if (body.dueDate !== undefined) {
      const due = parseDate(body.dueDate);
      if (due === "invalid") return fail("Tanggal tenggat tidak valid.");
      if (!sameDate(due, existing.dueDate)) {
        data.dueDate = due;
        // Tenggat baru: pengingat & peringatan terlambat boleh dikirim lagi.
        data.dueReminderSentAt = null;
        data.overdueNotifiedAt = null;
        notes.push(`menggeser tenggat menjadi ${dateText(due)}`);
      }
    }
    if (body.estimateMinutes !== undefined) {
      const value = body.estimateMinutes;
      if (value !== null && (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 100000)) {
        return fail("Estimasi waktu tidak valid.");
      }
      data.estimateMinutes = value as number | null;
    }
    if (body.recurrence !== undefined) {
      if (!oneOf(["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const, body.recurrence)) {
        return fail("Pengulangan tidak valid.");
      }
      data.recurrence = body.recurrence;
    }
    if (body.isMilestone !== undefined) {
      if (typeof body.isMilestone !== "boolean") return fail("Nilai milestone tidak valid.");
      data.isMilestone = body.isMilestone;
    }
    if (body.projectId !== undefined) {
      const projectId = typeof body.projectId === "string" && body.projectId ? body.projectId : null;
      if (projectId) {
        const project = await prisma.project.findFirst({
          where: { id: projectId, isActive: true },
          select: { id: true },
        });
        if (!project) return fail("Proyek tidak ditemukan.", 404);
      }
      data.projectId = projectId;
    }
    if (body.assigneeId !== undefined) {
      if (typeof body.assigneeId !== "string" || !body.assigneeId) {
        return fail("Penanggung jawab wajib dipilih.");
      }
      if (body.assigneeId !== existing.assigneeId) {
        const found = await prisma.user.findFirst({
          where: { id: body.assigneeId, isActive: true },
          select: { id: true, name: true, divisionId: true },
        });
        if (!found) return fail("Penanggung jawab tidak ditemukan.", 404);
        newAssignee = found;
        data.assigneeId = found.id;
        if (found.divisionId) data.divisionId = found.divisionId;
        notes.push(`mengalihkan tugas ke ${found.name}`);
      }
    }
    const parsedLabels = parseIdList(body.labelIds, 20);
    if (parsedLabels === "invalid") return fail("Daftar label tidak valid.");
    if (parsedLabels) {
      const found = await prisma.label.count({ where: { id: { in: parsedLabels } } });
      if (found !== parsedLabels.length) return fail("Sebagian label tidak ditemukan.", 404);
      labelIds = parsedLabels;
    }
  }

  const nextStart = data.startDate !== undefined ? (data.startDate as Date | null) : existing.startDate;
  const nextDue = data.dueDate !== undefined ? (data.dueDate as Date | null) : existing.dueDate;
  const rangeError = checkDateRange(nextStart, nextDue);
  if (rangeError) return fail(rangeError);

  let taskLinks: Array<{ label: string; url: string }> | undefined;
  if (body.links !== undefined) {
    if (!Array.isArray(body.links) || body.links.length > 20) {
      return fail("Maksimal 20 tautan dapat ditambahkan ke satu tugas.");
    }

    taskLinks = [];
    for (const item of body.links) {
      if (typeof item !== "object" || item === null) {
        return fail("Format tautan tidak valid.");
      }

      const link = item as Record<string, unknown>;
      const label = typeof link.label === "string" ? link.label.trim() : "";
      const url = typeof link.url === "string" ? link.url.trim() : "";
      if (!label || label.length > 80 || !url || url.length > 2048) {
        return fail("Nama tautan wajib diisi (maksimal 80 karakter) dan URL maksimal 2048 karakter.");
      }

      try {
        const parsedUrl = new URL(url);
        if (!["http:", "https:"].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
          return fail("Tautan harus menggunakan URL HTTP atau HTTPS yang valid.");
        }
      } catch {
        return fail("Tautan harus menggunakan URL HTTP atau HTTPS yang valid.");
      }

      taskLinks.push({ label, url });
    }
  }

  const labelsChanged =
    labelIds !== undefined &&
    (labelIds.length !== existing.labels.length ||
      labelIds.some((labelId) => !existing.labels.some((row) => row.labelId === labelId)));
  if (labelsChanged) notes.push("memperbarui label");

  const statusChanged = data.status !== undefined && data.status !== existing.status;
  const newStatus = data.status as keyof typeof STATUS_TEXT | undefined;

  // Dependensi: tugas belum boleh berjalan selama prasyaratnya belum selesai.
  if (statusChanged && newStatus && newStatus !== "TODO") {
    const blockers = await unfinishedBlockers(id);
    if (blockers.length) {
      return fail(
        `Tugas ini masih menunggu: ${blockers.map((blocker) => `"${blocker.title}"`).join(", ")}. Selesaikan prasyarat lebih dulu.`,
        409
      );
    }
  }
  if (statusChanged && newStatus) {
    data.completedAt = newStatus === "DONE" ? new Date() : null;
  }

  if (
    Object.keys(data).length === 0 &&
    taskLinks === undefined &&
    !labelsChanged
  ) {
    return fail("Tidak ada perubahan yang dikirim.");
  }
  // Pastikan updatedAt ikut bergeser bila hanya relasi yang berubah.
  data.updatedAt = new Date();

  try {
    const task = await prisma.$transaction(async (transaction) => {
      if (taskLinks !== undefined) {
        await transaction.taskLink.deleteMany({ where: { taskId: id } });
        if (taskLinks.length) {
          await transaction.taskLink.createMany({
            data: taskLinks.map((link) => ({ ...link, taskId: id })),
          });
        }
      }

      if (labelsChanged && labelIds) {
        await transaction.taskLabel.deleteMany({ where: { taskId: id } });
        if (labelIds.length) {
          await transaction.taskLabel.createMany({
            data: labelIds.map((labelId) => ({ taskId: id, labelId })),
          });
        }
      }

      if (newAssignee) {
        await transaction.taskAssignment.upsert({
          where: { taskId_userId: { taskId: id, userId: newAssignee.id } },
          create: { taskId: id, userId: newAssignee.id, status: newStatus ?? existing.status },
          update: {},
        });
      }

      if (statusChanged && newStatus) {
        const assigneeId = newAssignee?.id ?? existing.assigneeId;
        const userIds = [assigneeId, user.id].filter((value): value is string => Boolean(value));
        await transaction.taskAssignment.updateMany({
          where: { taskId: id, userId: { in: userIds } },
          data: { status: newStatus, completedAt: newStatus === "DONE" ? new Date() : null },
        });
        await transaction.activity.create({
          data: {
            userId: user.id,
            taskId: id,
            message: `${user.name} mengubah status "${existing.title}" menjadi ${STATUS_TEXT[newStatus]}`,
          },
        });
      }

      if (notes.length) {
        await transaction.activity.create({
          data: {
            userId: user.id,
            taskId: id,
            message: `${user.name} ${notes.join(", ")} pada "${existing.title}"`,
          },
        });
      }

      return transaction.task.update({ where: { id }, data, include: TASK_INCLUDE });
    });

    if (newAssignee) {
      await notify([newAssignee.id], {
        type: "ASSIGNED",
        title: `Tugas dialihkan ke Anda: ${task.title}`,
        body: `Dialihkan oleh ${user.name}.`,
        taskId: id,
        actorId: user.id,
      });
    }
    if (statusChanged && newStatus) {
      await afterStatusChange({ id, title: task.title }, existing.status, newStatus, user);
    }
    return NextResponse.json({ task });
  } catch (error) {
    console.error("PATCH /api/tasks/[id]", error);
    return fail("Tugas gagal diperbarui.", 500);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const existing = await prisma.task.findFirst({
    where: { AND: [{ id }, taskScope(auth.user)] },
    select: { id: true },
  });
  if (!existing) return fail("Tugas tidak ditemukan.", 404);

  try {
    const evidenceRecords = await prisma.taskIssueReport.findMany({
      where: { taskId: id, evidenceKey: { not: null } },
      select: { evidenceKey: true },
    });
    const attachmentRecords = await prisma.taskAttachment.findMany({
      where: { taskId: id },
      select: { key: true },
    });
    await prisma.task.delete({ where: { id } });
    await Promise.all(attachmentRecords.map((record) => removeTaskFile(record.key)));

    const evidenceKeys = evidenceRecords
      .map((record) => record.evidenceKey)
      .filter((key): key is string => key !== null);
    const cleanupResults = await Promise.allSettled(
      evidenceKeys.map((key) => removeTaskEvidence(key))
    );
    cleanupResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error("DELETE /api/tasks/[id] evidence cleanup", result.reason);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tasks/[id]", error);
    return fail("Tugas gagal dihapus.", 500);
  }
}
