import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const removed = await prisma.savedView.deleteMany({ where: { id, userId: auth.user.id } });
  if (!removed.count) return fail("Tampilan tidak ditemukan.", 404);
  return NextResponse.json({ ok: true });
}
