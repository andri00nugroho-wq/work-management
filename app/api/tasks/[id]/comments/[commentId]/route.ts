import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, MANAGE_ROLES } from "@/lib/api";
import { COMMENT_SELECT, MAX_COMMENT_LENGTH } from "@/lib/comments";
import { loadTaskForUser } from "@/lib/task-access";

type Ctx = { params: Promise<{ id: string; commentId: string }> };

async function access(id: string, commentId: string) {
  const auth = await authorize();
  if ("response" in auth) return { response: auth.response };
  const task = await loadTaskForUser(id, auth.user);
  if (!task) return { response: fail("Tugas tidak ditemukan.", 404) };
  const comment = await prisma.taskComment.findFirst({
    where: { id: commentId, taskId: id },
    select: { id: true, authorId: true },
  });
  if (!comment) return { response: fail("Komentar tidak ditemukan.", 404) };
  return { user: auth.user, comment };
}

/** Hanya penulis yang bisa menyunting komentarnya. */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id, commentId } = await params;
  const ctx = await access(id, commentId);
  if ("response" in ctx) return ctx.response;
  if (ctx.comment.authorId !== ctx.user.id) return fail("Hanya penulis yang bisa menyunting komentar.", 403);

  const body = await readJson(request);
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return fail("Komentar tidak boleh kosong.");
  if (text.length > MAX_COMMENT_LENGTH) return fail(`Komentar maksimal ${MAX_COMMENT_LENGTH} karakter.`);

  const comment = await prisma.taskComment.update({
    where: { id: commentId },
    data: { body: text, editedAt: new Date() },
    select: COMMENT_SELECT,
  });
  return NextResponse.json({ comment });
}

/** Penulis atau peran manajemen boleh menghapus. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id, commentId } = await params;
  const ctx = await access(id, commentId);
  if ("response" in ctx) return ctx.response;
  if (ctx.comment.authorId !== ctx.user.id && !MANAGE_ROLES.includes(ctx.user.role)) {
    return fail("Anda tidak berhak menghapus komentar ini.", 403);
  }
  await prisma.taskComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
