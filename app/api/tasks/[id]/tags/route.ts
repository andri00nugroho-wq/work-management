import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, taskScope, MANAGE_ROLES } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };
type ScopeUser = Parameters<typeof taskScope>[0];

const TAG_SELECT = {
  id: true,
  createdAt: true,
  user: { select: { id: true, name: true } },
  taggedBy: { select: { name: true } },
} as const;

async function loadTask(taskId: string, user: ScopeUser) {
  return prisma.task.findFirst({
    where: { AND: [{ id: taskId }, taskScope(user)] },
    select: {
      id: true,
      title: true,
      assigneeId: true,
      creatorId: true,
      assignments: { select: { userId: true } },
    },
  });
}

function canManageTask(
  task: NonNullable<Awaited<ReturnType<typeof loadTask>>>,
  user: ScopeUser
) {
  return (
    MANAGE_ROLES.includes(user.role) ||
    task.assigneeId === user.id ||
    task.creatorId === user.id ||
    task.assignments.some((assignment) => assignment.userId === user.id)
  );
}

function listTags(taskId: string) {
  return prisma.taskTag.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    select: TAG_SELECT,
  });
}

export async function POST(request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const body = await readJson(request);
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) return fail("Pilih anggota yang ingin ditandai.");
  if (userId === user.id) return fail("Anda tidak perlu menandai diri sendiri.");

  try {
    const task = await loadTask(id, user);
    if (!task) return fail("Tugas tidak ditemukan.", 404);
    if (!canManageTask(task, user)) {
      return fail("Anda tidak berhak menandai rekan pada tugas ini.", 403);
    }

    const target = await prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: { id: true, name: true },
    });
    if (!target) return fail("Anggota tidak ditemukan.", 404);

    const existing = await prisma.taskTag.findUnique({
      where: { taskId_userId: { taskId: id, userId } },
      select: { id: true },
    });

    if (!existing) {
      await prisma.$transaction([
        prisma.taskTag.create({
          data: { taskId: id, userId, taggedById: user.id },
        }),
        prisma.activity.create({
          data: {
            userId: user.id,
            taskId: id,
            message: `${user.name} menandai ${target.name} untuk melihat tugas "${task.title}"`,
          },
        }),
      ]);
    }

    return NextResponse.json({
      tags: await listTags(id),
      added: !existing,
    });
  } catch (error) {
    console.error("POST /api/tasks/[id]/tags", error);
    return fail("Rekan gagal ditandai.", 500);
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const userId = new URL(request.url).searchParams.get("userId") ?? "";
  if (!userId) return fail("Anggota yang ingin dilepas tidak valid.");

  try {
    const task = await loadTask(id, user);
    if (!task) return fail("Tugas tidak ditemukan.", 404);
    if (!canManageTask(task, user)) {
      return fail("Anda tidak berhak melepas tanda pada tugas ini.", 403);
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const removed = await prisma.taskTag.deleteMany({
      where: { taskId: id, userId },
    });

    if (removed.count && target) {
      await prisma.activity.create({
        data: {
          userId: user.id,
          taskId: id,
          message: `${user.name} melepas tanda ${target.name} dari tugas "${task.title}"`,
        },
      });
    }

    return NextResponse.json({
      tags: await listTags(id),
      removed: removed.count > 0,
    });
  } catch (error) {
    console.error("DELETE /api/tasks/[id]/tags", error);
    return fail("Tanda rekan gagal dilepas.", 500);
  }
}
