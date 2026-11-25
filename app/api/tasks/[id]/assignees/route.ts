import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson } from "@/lib/api";
import { canManageTask, loadTaskForUser } from "@/lib/task-access";
import { notify } from "@/lib/notify";

type Ctx = { params: Promise<{ id: string }> };

function listAssignments(taskId: string) {
  return prisma.taskAssignment.findMany({
    where: { taskId },
    orderBy: { assignedAt: "asc" },
    select: { status: true, user: { select: { id: true, name: true } } },
  });
}

/** Tambah anggota pelaksana (selain penanggung jawab utama). */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const task = await loadTaskForUser(id, user);
  if (!task) return fail("Tugas tidak ditemukan.", 404);
  if (!canManageTask(task, user)) return fail("Anda tidak berhak mengubah anggota tugas ini.", 403);

  const body = await readJson(request);
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) return fail("Pilih anggota yang ingin ditambahkan.");

  const member = await prisma.user.findFirst({ where: { id: userId, isActive: true }, select: { id: true, name: true } });
  if (!member) return fail("Anggota tidak ditemukan.", 404);
  if (task.assignments.some((assignment) => assignment.userId === userId)) {
    return fail(`${member.name} sudah menjadi anggota pelaksana.`, 409);
  }
  if ((await prisma.taskAssignment.count({ where: { taskId: id } })) >= 20) {
    return fail("Maksimal 20 anggota pelaksana per tugas.");
  }

  await prisma.$transaction([
    prisma.taskAssignment.create({ data: { taskId: id, userId, status: task.status } }),
    prisma.task.update({ where: { id }, data: { updatedAt: new Date() } }),
    prisma.activity.create({
      data: { userId: user.id, taskId: id, message: `${user.name} menambahkan ${member.name} sebagai anggota pelaksana "${task.title}"` },
    }),
  ]);
  await notify([userId], {
    type: "ASSIGNED",
    title: `Anda menjadi pelaksana: ${task.title}`,
    body: `Ditambahkan oleh ${user.name}.`,
    taskId: id,
    actorId: user.id,
  });
  return NextResponse.json({ assignments: await listAssignments(id) }, { status: 201 });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const task = await loadTaskForUser(id, user);
  if (!task) return fail("Tugas tidak ditemukan.", 404);
  if (!canManageTask(task, user)) return fail("Anda tidak berhak mengubah anggota tugas ini.", 403);

  const userId = new URL(request.url).searchParams.get("userId") ?? "";
  if (userId === task.assigneeId) {
    return fail("Penanggung jawab utama tidak bisa dilepas. Alihkan tugas lebih dulu.", 409);
  }
  const removed = await prisma.taskAssignment.deleteMany({ where: { taskId: id, userId } });
  if (!removed.count) return fail("Anggota tersebut bukan pelaksana tugas ini.", 404);

  const name = (await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name ?? "Anggota";
  await prisma.$transaction([
    prisma.task.update({ where: { id }, data: { updatedAt: new Date() } }),
    prisma.activity.create({
      data: { userId: user.id, taskId: id, message: `${user.name} melepas ${name} dari anggota pelaksana "${task.title}"` },
    }),
  ]);
  return NextResponse.json({ assignments: await listAssignments(id) });
}
