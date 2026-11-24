import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, MANAGE_ROLES } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (id.startsWith("builtin-")) return fail("Templat bawaan tidak bisa dihapus.", 403);
  const removed = await prisma.projectTemplate.deleteMany({ where: { id } });
  if (!removed.count) return fail("Templat tidak ditemukan.", 404);
  return NextResponse.json({ ok: true });
}
