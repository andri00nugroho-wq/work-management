import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, MANAGE_ROLES } from "@/lib/api";
import { fileResponse } from "@/lib/file-response";
import { loadTaskForUser } from "@/lib/task-access";
import { readTaskFile, removeTaskFile } from "@/lib/task-files";

type Ctx = { params: Promise<{ id: string; attachmentId: string }> };

async function access(id: string, attachmentId: string) {
  const auth = await authorize();
  if ("response" in auth) return { response: auth.response };
  const task = await loadTaskForUser(id, auth.user);
  if (!task) return { response: fail("Tugas tidak ditemukan.", 404) };
  const attachment = await prisma.taskAttachment.findFirst({
    where: { id: attachmentId, taskId: id },
    select: { id: true, key: true, name: true, mimeType: true, uploadedById: true },
  });
  if (!attachment) return { response: fail("Lampiran tidak ditemukan.", 404) };
  return { user: auth.user, attachment };
}

export async function GET(request: Request, { params }: Ctx) {
  const { id, attachmentId } = await params;
  const ctx = await access(id, attachmentId);
  if ("response" in ctx) return ctx.response;
  try {
    const bytes = await readTaskFile(ctx.attachment.key);
    const download = new URL(request.url).searchParams.has("download");
    return fileResponse(bytes, ctx.attachment.name, ctx.attachment.mimeType, download);
  } catch (error) {
    console.error("GET /api/tasks/[id]/attachments/[attachmentId]", error);
    return fail("Berkas tidak dapat dibaca.", 404);
  }
}

/** Pengunggah atau peran manajemen boleh menghapus. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id, attachmentId } = await params;
  const ctx = await access(id, attachmentId);
  if ("response" in ctx) return ctx.response;
  if (ctx.attachment.uploadedById !== ctx.user.id && !MANAGE_ROLES.includes(ctx.user.role)) {
    return fail("Anda tidak berhak menghapus lampiran ini.", 403);
  }
  await prisma.taskAttachment.delete({ where: { id: attachmentId } });
  await removeTaskFile(ctx.attachment.key);
  return NextResponse.json({ ok: true });
}
