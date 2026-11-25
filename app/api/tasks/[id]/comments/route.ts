import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, parseIdList } from "@/lib/api";
import { COMMENT_SELECT, MAX_COMMENT_LENGTH, listComments } from "@/lib/comments";
import { canManageTask, loadTaskForUser, usersWhoCanSeeTask } from "@/lib/task-access";
import { notify, taskParticipants } from "@/lib/notify";
import { dispatchWebhooks } from "@/lib/webhooks";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const task = await loadTaskForUser(id, auth.user);
  if (!task) return fail("Tugas tidak ditemukan.", 404);
  return NextResponse.json({ comments: await listComments(id) });
}

/**
 * Kirim komentar. Mention ke orang yang belum bisa melihat tugas hanya boleh oleh
 * pengelola tugas; orang tersebut otomatis di-tag agar bisa melihatnya.
 */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const task = await loadTaskForUser(id, user);
  if (!task) return fail("Tugas tidak ditemukan.", 404);

  const body = await readJson(request);
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return fail("Komentar tidak boleh kosong.");
  if (text.length > MAX_COMMENT_LENGTH) return fail(`Komentar maksimal ${MAX_COMMENT_LENGTH} karakter.`);

  const parsed = parseIdList(body.mentionIds, 20);
  if (parsed === "invalid") return fail("Daftar mention tidak valid.");
  const mentionIds = (parsed ?? []).filter((mentionId) => mentionId !== user.id);

  const active = await prisma.user.findMany({
    where: { id: { in: mentionIds }, isActive: true },
    select: { id: true, name: true },
  });
  if (active.length !== mentionIds.length) return fail("Sebagian orang yang di-mention tidak ditemukan.", 404);

  const canSee = await usersWhoCanSeeTask(id, mentionIds);
  const outsiders = active.filter((person) => !canSee.includes(person.id));
  if (outsiders.length && !canManageTask(task, user)) {
    return fail(
      `${outsiders.map((person) => person.name).join(", ")} belum bisa melihat tugas ini. Minta pengelola tugas untuk menandai mereka.`,
      403
    );
  }

  const comment = await prisma.$transaction(async (tx) => {
    if (outsiders.length) {
      await tx.taskTag.createMany({
        data: outsiders.map((person) => ({ taskId: id, userId: person.id, taggedById: user.id })),
        skipDuplicates: true,
      });
    }
    await tx.task.update({ where: { id }, data: { updatedAt: new Date() } });
    await tx.activity.create({
      data: { userId: user.id, taskId: id, message: `${user.name} mengomentari "${task.title}"` },
    });
    return tx.taskComment.create({
      data: { taskId: id, authorId: user.id, body: text, mentionIds },
      select: COMMENT_SELECT,
    });
  });

  const preview = text.length > 140 ? `${text.slice(0, 137)}...` : text;
  await notify(mentionIds, {
    type: "MENTIONED",
    title: `${user.name} menyebut Anda di: ${task.title}`,
    body: preview,
    taskId: id,
    actorId: user.id,
  });
  const others = (await taskParticipants(id)).filter((participant) => !mentionIds.includes(participant));
  await notify(others, {
    type: "COMMENTED",
    title: `Komentar baru di: ${task.title}`,
    body: `${user.name}: ${preview}`,
    taskId: id,
    actorId: user.id,
  });

  void dispatchWebhooks(
    "comment.created",
    { taskId: id, taskTitle: task.title, commentId: comment.id, author: { id: user.id, name: user.name }, body: text },
    `💬 ${user.name} di *${task.title}*: ${preview}`
  );

  return NextResponse.json({ comment, taggedIds: outsiders.map((person) => person.id) }, { status: 201 });
}
