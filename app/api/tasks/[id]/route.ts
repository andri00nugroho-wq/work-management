import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authorize, fail, readJson, parseDate, taskScope, oneOf,
  ADMIN_ROLES, MANAGE_ROLES, PRIORITIES, STATUSES, TASK_INCLUDE,
} from "@/lib/api";
import { removeTaskEvidence } from "@/lib/task-evidence";
import type { Prisma } from "@/app/generated/prisma";

type Ctx = { params: Promise<{ id: string }> };

const STATUS_TEXT = {
  TODO: "Belum Mulai",
  IN_PROGRESS: "Berjalan",
  REVIEW: "Menunggu Review",
  DONE: "Selesai",
} as const;

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
      assigneeId: true,
      creatorId: true,
      assignments: { select: { userId: true } },
    },
  });
  if (!existing) return fail("Tugas tidak ditemukan.", 404);

  const isManager = MANAGE_ROLES.includes(user.role);
  const isOwner =
    existing.assigneeId === user.id ||
    existing.creatorId === user.id ||
    existing.assignments.some((a) => a.userId === user.id);
  if (!isManager && !isOwner) return fail("Anda tidak berhak mengubah tugas ini.", 403);

  const body = await readJson(request);
  const data: Prisma.TaskUncheckedUpdateInput = {};

  if (body.status !== undefined) {
    if (!oneOf(STATUSES, body.status)) return fail("Status tidak valid.");
    data.status = body.status;
  }

  // Field lain hanya untuk role manajemen.
  if (isManager) {
    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title || title.length > 180) return fail("Nama tugas tidak valid.");
      data.title = title;
    }
    if (body.description !== undefined) {
      data.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null;
    }
    if (body.priority !== undefined) {
      if (!oneOf(PRIORITIES, body.priority)) return fail("Prioritas tidak valid.");
      data.priority = body.priority;
    }
    if (body.dueDate !== undefined) {
      const due = parseDate(body.dueDate);
      if (due === "invalid") return fail("Tanggal tenggat tidak valid.");
      data.dueDate = due;
    }
    if (body.projectId !== undefined) {
      data.projectId =
        typeof body.projectId === "string" && body.projectId ? body.projectId : null;
    }
  }

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

  if (Object.keys(data).length === 0 && taskLinks === undefined) {
    return fail("Tidak ada perubahan yang dikirim.");
  }
  if (taskLinks !== undefined && Object.keys(data).length === 0) {
    data.updatedAt = new Date();
  }

  const statusChanged = data.status !== undefined && data.status !== existing.status;
  const newStatus = data.status as keyof typeof STATUS_TEXT | undefined;

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

      if (statusChanged && newStatus) {
        const userIds = [existing.assigneeId, user.id].filter(
          (value): value is string => Boolean(value)
        );
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

      return transaction.task.update({ where: { id }, data, include: TASK_INCLUDE });
    });
    return NextResponse.json({ task });
  } catch (error) {
    console.error("PATCH /api/tasks/[id]", error);
    return fail("Status tugas gagal diperbarui.", 500);
  }
}

/** Hapus permanen, termasuk lampiran bukti isu. Hanya Super Admin dan Administrator. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorize(ADMIN_ROLES);
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
    await prisma.task.delete({ where: { id } });

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
