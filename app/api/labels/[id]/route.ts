import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, MANAGE_ROLES } from "@/lib/api";
import { parseLabelInput } from "@/lib/labels";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const input = parseLabelInput(await readJson(request));
  if ("error" in input) return fail(input.error);

  const clash = await prisma.label.findFirst({
    where: { name: { equals: input.name, mode: "insensitive" }, id: { not: id } },
    select: { id: true },
  });
  if (clash) return fail("Label dengan nama itu sudah ada.", 409);

  const updated = await prisma.label.updateMany({ where: { id }, data: input });
  if (!updated.count) return fail("Label tidak ditemukan.", 404);
  return NextResponse.json({ label: { id, ...input } });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const removed = await prisma.label.deleteMany({ where: { id } });
  if (!removed.count) return fail("Label tidak ditemukan.", 404);
  return NextResponse.json({ ok: true });
}
