import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, parseDate } from "@/lib/api";
import { loadTaskForUser } from "@/lib/task-access";
import { listTime, stopRunningTimers } from "@/lib/time";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (!(await loadTaskForUser(id, auth.user))) return fail("Tugas tidak ditemukan.", 404);
  return NextResponse.json(await listTime(id));
}

/**
 * { action: "start" } mulai timer (timer lain milik pengguna dihentikan),
 * { action: "stop" } hentikan timer di tugas ini,
 * { minutes, date?, note? } catat waktu manual.
 */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;
  if (user.role === "GUEST") return fail("Tamu tidak dapat mencatat waktu kerja.", 403);

  const task = await loadTaskForUser(id, user);
  if (!task) return fail("Tugas tidak ditemukan.", 404);
  const body = await readJson(request);

  if (body.action === "start") {
    await stopRunningTimers(user.id);
    await prisma.timeEntry.create({ data: { taskId: id, userId: user.id, startedAt: new Date() } });
  } else if (body.action === "stop") {
    const running = await prisma.timeEntry.count({ where: { userId: user.id, taskId: id, endedAt: null } });
    if (!running) return fail("Tidak ada timer yang berjalan di tugas ini.", 409);
    await stopRunningTimers(user.id);
  } else {
    const minutes = body.minutes;
    if (!Number.isInteger(minutes) || (minutes as number) < 1 || (minutes as number) > 24 * 60) {
      return fail("Durasi harus 1-1440 menit.");
    }
    const date = parseDate(body.date);
    if (date === "invalid") return fail("Tanggal tidak valid.");
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";
    const startedAt = date ?? new Date();
    await prisma.timeEntry.create({
      data: { taskId: id, userId: user.id, startedAt, endedAt: startedAt, minutes: minutes as number, note: note || null },
    });
  }
  return NextResponse.json(await listTime(id), { status: 201 });
}
