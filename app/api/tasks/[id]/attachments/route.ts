import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail } from "@/lib/api";
import { loadTaskForUser } from "@/lib/task-access";
import { ATTACHMENT_SELECT, TaskFileError, removeTaskFile, saveTaskFile } from "@/lib/task-files";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const task = await loadTaskForUser(id, auth.user);
  if (!task) return fail("Tugas tidak ditemukan.", 404);

  const attachments = await prisma.taskAttachment.findMany({
    where: { taskId: id },
    orderBy: [{ name: "asc" }, { version: "desc" }],
    select: ATTACHMENT_SELECT,
  });
  return NextResponse.json({ attachments });
}

/** Unggah lampiran. Nama berkas yang sama menjadi versi revisi berikutnya. */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const task = await loadTaskForUser(id, user);
  if (!task) return fail("Tugas tidak ditemukan.", 404);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Format unggahan tidak valid.");
  }
  const file = form.get("file");
  const note = typeof form.get("note") === "string" ? String(form.get("note")).trim() : "";
  if (!(file instanceof File)) return fail("Pilih berkas yang akan diunggah.");
  if (note.length > 500) return fail("Catatan revisi maksimal 500 karakter.");

  if ((await prisma.taskAttachment.count({ where: { taskId: id } })) >= 100) {
    return fail("Maksimal 100 lampiran per tugas.");
  }

  let stored: Awaited<ReturnType<typeof saveTaskFile>>;
  try {
    stored = await saveTaskFile(file);
  } catch (error) {
    if (error instanceof TaskFileError) return fail(error.message);
    console.error("POST /api/tasks/[id]/attachments save", error);
    return fail("Berkas gagal disimpan.", 500);
  }

  try {
    const latest = await prisma.taskAttachment.findFirst({
      where: { taskId: id, name: stored.name },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const version = (latest?.version ?? 0) + 1;
    const attachment = await prisma.$transaction(async (tx) => {
      await tx.task.update({ where: { id }, data: { updatedAt: new Date() } });
      await tx.activity.create({
        data: {
          userId: user.id,
          taskId: id,
          message:
            version > 1
              ? `${user.name} mengunggah revisi v${version} "${stored.name}" pada "${task.title}"`
              : `${user.name} melampirkan "${stored.name}" pada "${task.title}"`,
        },
      });
      return tx.taskAttachment.create({
        data: { ...stored, version, note: note || null, taskId: id, uploadedById: user.id },
        select: ATTACHMENT_SELECT,
      });
    });
    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    await removeTaskFile(stored.key);
    console.error("POST /api/tasks/[id]/attachments", error);
    return fail("Lampiran gagal disimpan.", 500);
  }
}
