import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson } from "@/lib/api";
import { listSubtasks } from "@/lib/subtasks";
import { canManageTask, loadTaskForUser } from "@/lib/task-access";

type Ctx = { params: Promise<{ id: string }> };

const MAX_SUBTASKS = 100;

export async function POST(request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const task = await loadTaskForUser(id, user);
  if (!task) return fail("Tugas tidak ditemukan.", 404);
  if (!canManageTask(task, user)) return fail("Anda tidak berhak mengubah sub-tugas ini.", 403);

  const body = await readJson(request);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title || title.length > 200) return fail("Judul sub-tugas wajib diisi (maksimal 200 karakter).");

  const count = await prisma.subtask.count({ where: { taskId: id } });
  if (count >= MAX_SUBTASKS) return fail(`Maksimal ${MAX_SUBTASKS} sub-tugas per tugas.`);

  // Taruh di akhir: posisi terbesar + 1 (posisi bisa berlubang setelah ada yang dihapus).
  const last = await prisma.subtask.aggregate({ where: { taskId: id }, _max: { position: true } });
  const position = (last._max.position ?? -1) + 1;

  await prisma.$transaction([
    prisma.subtask.create({ data: { taskId: id, title, position } }),
    prisma.task.update({ where: { id }, data: { updatedAt: new Date() } }),
  ]);
  return NextResponse.json({ subtasks: await listSubtasks(id) }, { status: 201 });
}
