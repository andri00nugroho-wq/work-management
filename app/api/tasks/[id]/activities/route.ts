import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, taskScope } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Riwayat aktivitas satu tugas, terbaru dulu. */
export async function GET(_request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { AND: [{ id }, taskScope(auth.user)] },
    select: { id: true },
  });
  if (!task) return fail("Tugas tidak ditemukan.", 404);

  const activities = await prisma.activity.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, message: true, createdAt: true, user: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ activities });
}
