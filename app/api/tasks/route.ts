import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authorize, fail, readJson, parseDate, parseIdList, checkDateRange, taskScope, oneOf,
  MANAGE_ROLES, PRIORITIES, TASK_INCLUDE,
} from "@/lib/api";
import { notify } from "@/lib/notify";
import { dispatchWebhooks } from "@/lib/webhooks";

const MAX_PAGE_SIZE = 200;

/**
 * Tanpa parameter: semua tugas dalam cakupan (dipakai dashboard).
 * Dengan ?limit=N[&cursor=id]: halaman berurutan terbaru dulu, plus nextCursor.
 */
export async function GET(request: Request) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;

  const params = new URL(request.url).searchParams;
  const rawLimit = params.get("limit");
  const cursor = params.get("cursor");
  const limit = rawLimit ? Number(rawLimit) : null;
  if (limit !== null && (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE)) {
    return fail(`Parameter limit harus bilangan 1-${MAX_PAGE_SIZE}.`);
  }

  try {
    const tasks = await prisma.task.findMany({
      where: taskScope(auth.user),
      include: TASK_INCLUDE,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(limit
        ? { take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) }
        : {}),
    });
    if (!limit) return NextResponse.json({ tasks });

    const hasMore = tasks.length > limit;
    const page = hasMore ? tasks.slice(0, limit) : tasks;
    return NextResponse.json({ tasks: page, nextCursor: hasMore ? page[page.length - 1].id : null });
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
  const startDate = parseDate(body.startDate);
  const labelIds = parseIdList(body.labelIds, 20);
  const isMilestone = body.isMilestone === true;
  const recurrence = body.recurrence ?? "NONE";
  const estimateMinutes =
    body.estimateMinutes === undefined || body.estimateMinutes === null ? null : body.estimateMinutes;
  if (estimateMinutes !== null && (!Number.isInteger(estimateMinutes) || (estimateMinutes as number) < 1 || (estimateMinutes as number) > 100000)) {
    return fail("Estimasi waktu tidak valid.");
  }
  if (!oneOf(["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const, recurrence)) return fail("Pengulangan tidak valid.");
  const projectId = typeof body.projectId === "string" && body.projectId ? body.projectId : null;
  const assigneeId =
    typeof body.assigneeId === "string" && body.assigneeId ? body.assigneeId : user.id;

  if (!title) return fail("Nama tugas wajib diisi.");
  if (title.length > 180) return fail("Nama tugas maksimal 180 karakter.");
  if (description.length > 5000) return fail("Deskripsi maksimal 5000 karakter.");
  if (!oneOf(PRIORITIES, priority)) return fail("Prioritas tidak valid.");
  if (dueDate === "invalid") return fail("Tanggal tenggat tidak valid.");
  if (startDate === "invalid") return fail("Tanggal mulai tidak valid.");
  const rangeError = checkDateRange(startDate, dueDate);
  if (rangeError) return fail(rangeError);
  if (labelIds === "invalid") return fail("Daftar label tidak valid.");

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

    if (labelIds?.length) {
      const found = await prisma.label.count({ where: { id: { in: labelIds } } });
      if (found !== labelIds.length) return fail("Sebagian label tidak ditemukan.", 404);
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority,
        startDate,
        dueDate,
        isMilestone,
        recurrence,
        estimateMinutes: estimateMinutes as number | null,
        projectId,
        assigneeId: assignee.id,
        divisionId: assignee.divisionId ?? user.divisionId,
        creatorId: user.id,
        assignments: { create: { userId: assignee.id } },
        labels: labelIds?.length
          ? { create: labelIds.map((labelId) => ({ labelId })) }
          : undefined,
        activities: {
          create: { userId: user.id, message: `${user.name} membuat tugas "${title}"` },
        },
      },
      include: TASK_INCLUDE,
    });

    await notify([assignee.id], {
      type: "ASSIGNED",
      title: `Tugas baru untuk Anda: ${title}`,
      body: `Ditugaskan oleh ${user.name}.`,
      taskId: task.id,
      actorId: user.id,
    });

    void dispatchWebhooks(
      "task.created",
      { id: task.id, title, priority, dueDate, assignee: task.assignee, creator: { id: user.id, name: user.name } },
      `🆕 Tugas baru: *${title}* (ditugaskan ke ${task.assignee?.name ?? "-"}) oleh ${user.name}`
    );

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