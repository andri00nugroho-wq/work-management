import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, MANAGE_ROLES } from "@/lib/api";
import { INTAKE_FORM_SELECT } from "@/lib/intake";

type Ctx = { params: Promise<{ id: string }> };

/** Aktif/nonaktif dan publik/internal. */
export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const body = await readJson(request);
  const data: { isActive?: boolean; isPublic?: boolean } = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;
  if (!Object.keys(data).length) return fail("Tidak ada perubahan yang dikirim.");
  const exists = await prisma.intakeForm.count({ where: { id } });
  if (!exists) return fail("Formulir tidak ditemukan.", 404);
  const form = await prisma.intakeForm.update({ where: { id }, data, select: INTAKE_FORM_SELECT });
  return NextResponse.json({ form });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const removed = await prisma.intakeForm.deleteMany({ where: { id } });
  if (!removed.count) return fail("Formulir tidak ditemukan.", 404);
  return NextResponse.json({ ok: true });
}
