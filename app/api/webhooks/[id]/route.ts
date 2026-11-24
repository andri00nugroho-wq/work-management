import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, ADMIN_ROLES } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const body = await readJson(request);
  if (typeof body.isActive !== "boolean") return fail("Kirim isActive true/false.");
  const updated = await prisma.webhook.updateMany({ where: { id }, data: { isActive: body.isActive } });
  if (!updated.count) return fail("Webhook tidak ditemukan.", 404);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const removed = await prisma.webhook.deleteMany({ where: { id } });
  if (!removed.count) return fail("Webhook tidak ditemukan.", 404);
  return NextResponse.json({ ok: true });
}
