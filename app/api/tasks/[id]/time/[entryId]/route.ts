import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, MANAGE_ROLES } from "@/lib/api";
import { loadTaskForUser } from "@/lib/task-access";
import { listTime } from "@/lib/time";

type Ctx = { params: Promise<{ id: string; entryId: string }> };

/** Hapus catatan waktu milik sendiri (atau oleh manajemen). */
export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id, entryId } = await params;
  if (!(await loadTaskForUser(id, auth.user))) return fail("Tugas tidak ditemukan.", 404);
  const entry = await prisma.timeEntry.findFirst({ where: { id: entryId, taskId: id }, select: { userId: true } });
  if (!entry) return fail("Catatan waktu tidak ditemukan.", 404);
  if (entry.userId !== auth.user.id && !MANAGE_ROLES.includes(auth.user.role)) {
    return fail("Anda tidak berhak menghapus catatan ini.", 403);
  }
  await prisma.timeEntry.delete({ where: { id: entryId } });
  return NextResponse.json(await listTime(id));
}
