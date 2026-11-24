import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson } from "@/lib/api";
import { listDependencies, wouldCreateCycle } from "@/lib/dependencies";
import { canManageTask, loadTaskForUser } from "@/lib/task-access";

type Ctx = { params: Promise<{ id: string }> };

/** Tandai bahwa tugas ini baru bisa dimulai setelah tugas lain selesai. */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const task = await loadTaskForUser(id, user);
  if (!task) return fail("Tugas tidak ditemukan.", 404);
  if (!canManageTask(task, user)) return fail("Anda tidak berhak mengubah dependensi tugas ini.", 403);

  const body = await readJson(request);
  const dependsOnId = typeof body.dependsOnId === "string" ? body.dependsOnId : "";
  if (!dependsOnId) return fail("Pilih tugas prasyarat.");
  if (dependsOnId === id) return fail("Tugas tidak bisa bergantung pada dirinya sendiri.");

  const blocker = await loadTaskForUser(dependsOnId, user);
  if (!blocker) return fail("Tugas prasyarat tidak ditemukan.", 404);

  const exists = await prisma.taskDependency.findUnique({
    where: { taskId_dependsOnId: { taskId: id, dependsOnId } },
    select: { id: true },
  });
  if (exists) return fail("Dependensi ini sudah ada.", 409);
  if (await wouldCreateCycle(id, dependsOnId)) {
    return fail(`"${blocker.title}" sudah (tidak langsung) menunggu tugas ini. Dependensi melingkar ditolak.`, 409);
  }

  await prisma.$transaction([
    prisma.taskDependency.create({ data: { taskId: id, dependsOnId } }),
    prisma.task.update({ where: { id }, data: { updatedAt: new Date() } }),
    prisma.activity.create({
      data: { userId: user.id, taskId: id, message: `${user.name} menetapkan "${task.title}" menunggu "${blocker.title}"` },
    }),
  ]);
  return NextResponse.json({ dependsOn: await listDependencies(id) }, { status: 201 });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const task = await loadTaskForUser(id, user);
  if (!task) return fail("Tugas tidak ditemukan.", 404);
  if (!canManageTask(task, user)) return fail("Anda tidak berhak mengubah dependensi tugas ini.", 403);

  const dependsOnId = new URL(request.url).searchParams.get("dependsOnId") ?? "";
  const removed = await prisma.taskDependency.deleteMany({ where: { taskId: id, dependsOnId } });
  if (!removed.count) return fail("Dependensi tidak ditemukan.", 404);
  await prisma.task.update({ where: { id }, data: { updatedAt: new Date() } });
  return NextResponse.json({ dependsOn: await listDependencies(id) });
}
