import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Tandai dibaca / belum dibaca (hanya milik sendiri). */
export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const body = await readJson(request);
  const read = body.read !== false;

  const updated = await prisma.notification.updateMany({
    where: { id, userId: auth.user.id },
    data: { readAt: read ? new Date() : null },
  });
  if (!updated.count) return fail("Pemberitahuan tidak ditemukan.", 404);
  return NextResponse.json({ ok: true });
}
