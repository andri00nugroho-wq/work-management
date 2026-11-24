import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Cabut kunci API milik sendiri. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const revoked = await prisma.apiKey.updateMany({
    where: { id, userId: auth.user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (!revoked.count) return fail("Kunci tidak ditemukan atau sudah dicabut.", 404);
  return NextResponse.json({ ok: true });
}
