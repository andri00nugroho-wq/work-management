import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authorize, fail, readJson, parseDate, taskScope, oneOf,
  MANAGE_ROLES, PRIORITIES, TASK_INCLUDE,
} from "@/lib/api";

export async function GET() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;

  try {
    const tasks = await prisma.task.findMany({
      where: taskScope(auth.user),
      include: TASK_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("GET /api/tasks", error);
    return fail("Gagal mengambil data tugas.", 500);
  }
}

export async function POST(request: Request) {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const body = await readJson(request);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const priority = body.priority ?? "MEDIUM";
  const dueDate = parseDate(body.dueDate);
  const projectId = typeof body.projectId === "string" && body.projectId ? body.projectId : null;
  const assigneeId =
    typeof body.assigneeId === "string" && body.assigneeId ? body.assigneeId : user.id;

  if (!title) return fail("Nama tugas wajib diisi.");
  if (title.length > 180) return fail("Nama tugas maksimal 180 karakter.");
  if (description.length > 5000) return fail("Deskripsi maksimal 5000 karakter.");
  if (!oneOf(PRIORITIES, priority)) return fail("Prioritas tidak valid.");
  if (dueDate === "invalid") return fail("Tanggal tenggat tidak valid.");

  try {
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, isActive: true },
        select: { id: true },
      });
      if (!project) return fail("Proyek tidak ditemukan.", 404);
    }

    const assignee = await prisma.user.findFirst({
      where: { id: assigneeId, isActive: true },
      select: { id: true, divisionId: true },
    });
    if (!assignee) return fail("Penanggung jawab tidak ditemukan.", 404);

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority,
        dueDate,
        projectId,
        assigneeId: assignee.id,
        divisionId: assignee.divisionId ?? user.divisionId,
        creatorId: user.id,
        assignments: { create: { userId: assignee.id } },
        activities: {
          create: { userId: user.id, message: `${user.name} membuat tugas "${title}"` },
        },
      },
      include: TASK_INCLUDE,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks", error);
    const detail =
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? ` [${error.message.trim().slice(-350)}]`
        : "";
    return fail(`Tugas gagal disimpan.${detail}`, 500);
  }
}