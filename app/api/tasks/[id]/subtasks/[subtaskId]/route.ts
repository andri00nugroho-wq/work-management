import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson } from "@/lib/api";
import { listSubtasks } from "@/lib/subtasks";
import { canManageTask, loadTaskForUser } from "@/lib/task-access";
import { afterSubtasksChanged } from "@/lib/automation";
import type { Prisma } from "@/app/generated/prisma/client";

type Ctx = { params: Promise<{ id: string; subtaskId: string }> };

async function access(id: string, subtaskId: string) {
  const auth = await authorize();
  if ("response" in auth) return { response: auth.response };
  const { user } = auth;
  const task = await loadTaskForUser(id, user);
  if (!task) return { response: fail("Tugas tidak ditemukan.", 404) };
  if (!canManageTask(task, user)) return { response: fail("Anda tidak berhak mengubah sub-tugas ini.", 403) };
  const subtask = await prisma.subtask.findFirst({
    where: { id: subtaskId, taskId: id },
    select: { id: true, title: true, done: true },
  });
  if (!subtask) return { response: fail("Sub-tugas tidak ditemukan.", 404) };
  return { user, task, subtask };
}

/** Ubah judul, tandai selesai, atau pindah urutan (position). */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id, subtaskId } = await params;
  const ctx = await access(id, subtaskId);
  if ("response" in ctx) return ctx.response;
  const { user, task, subtask } = ctx;

  const body = await readJson(request);
  const data: Prisma.SubtaskUpdateInput = {};

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 200) return fail("Judul sub-tugas wajib diisi (maksimal 200 karakter).");
    data.title = title;
  }
  if (body.done !== undefined) {
    if (typeof body.done !== "boolean") return fail("Nilai selesai tidak valid.");
    data.done = body.done;
    data.completedAt = body.done ? new Date() : null;
  }
  let reorderedIds: string[] | undefined;
  if (body.position !== undefined) {
    if (!Number.isInteger(body.position) || (body.position as number) < 0) return fail("Urutan tidak valid.");
    // Pindahkan ke indeks tujuan lalu nomori ulang semua (posisi bisa berlubang setelah hapus).
    const ordered = (await listSubtasks(id)).map((item) => item.id).filter((itemId) => itemId !== subtaskId);
    const target = Math.min(body.position as number, ordered.length);
    ordered.splice(target, 0, subtaskId);
    reorderedIds = ordered;
  }
  if (Object.keys(data).length === 0 && !reorderedIds) return fail("Tidak ada perubahan yang dikirim.");

  const toggled = data.done !== undefined && data.done !== subtask.done;
  await prisma.$transaction([
    ...(Object.keys(data).length ? [prisma.subtask.update({ where: { id: subtaskId }, data })] : []),
    ...(reorderedIds ?? []).map((itemId, position) =>
      prisma.subtask.update({ where: { id: itemId }, data: { position } })
    ),
    prisma.task.update({ where: { id }, data: { updatedAt: new Date() } }),
    ...(toggled
      ? [
          prisma.activity.create({
            data: {
              userId: user.id,
              taskId: id,
              message: `${user.name} ${data.done ? "menyelesaikan" : "membuka kembali"} sub-tugas "${subtask.title}" pada "${task.title}"`,
            },
          }),
        ]
      : []),
  ]);
  // Otomatisasi: semua sub-tugas selesai -> Menunggu Review.
  const autoReview = toggled && data.done === true ? await afterSubtasksChanged(id, user) : false;
  return NextResponse.json({ subtasks: await listSubtasks(id), autoReview });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id, subtaskId } = await params;
  const ctx = await access(id, subtaskId);
  if ("response" in ctx) return ctx.response;

  await prisma.$transaction([
    prisma.subtask.delete({ where: { id: subtaskId } }),
    prisma.task.update({ where: { id }, data: { updatedAt: new Date() } }),
  ]);
  return NextResponse.json({ subtasks: await listSubtasks(id) });
}
