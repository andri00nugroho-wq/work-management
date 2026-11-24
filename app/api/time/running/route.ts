import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/api";

/** Timer yang sedang berjalan milik pengguna (untuk indikator di topbar). */
export async function GET() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const entry = await prisma.timeEntry.findFirst({
    where: { userId: auth.user.id, endedAt: null },
    select: { id: true, startedAt: true, task: { select: { id: true, title: true } } },
  });
  return NextResponse.json({ entry });
}
