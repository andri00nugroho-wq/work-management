import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, ADMIN_ROLES } from "@/lib/api";
import { DIVISION_SELECT } from "@/lib/divisions";
import type { Prisma } from "@/app/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const division = await prisma.division.findFirst({ where: { id, isActive: true }, select: { id: true } });
  if (!division) return fail("Divisi tidak ditemukan.", 404);

  const body = await readJson(request);
  const data: Prisma.DivisionUncheckedUpdateInput = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 80) return fail("Nama divisi wajib diisi (maksimal 80 karakter).");
    const clash = await prisma.division.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, id: { not: id } },
      select: { id: true },
    });
    if (clash) return fail("Divisi dengan nama itu sudah ada.", 409);
    data.name = name;
  }
  if (body.description !== undefined) {
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (description.length > 500) return fail("Deskripsi maksimal 500 karakter.");
    data.description = description || null;
  }
  if (body.supervisorId !== undefined) {
    const supervisorId =
      typeof body.supervisorId === "string" && body.supervisorId ? body.supervisorId : null;
    if (supervisorId) {
      const supervisor = await prisma.user.findFirst({
        where: { id: supervisorId, isActive: true },
        select: { id: true, supervisedDivision: { select: { id: true, name: true } } },
      });
      if (!supervisor) return fail("Supervisor tidak ditemukan.", 404);
      if (supervisor.supervisedDivision && supervisor.supervisedDivision.id !== id) {
        return fail(`Orang ini sudah menjadi supervisor divisi ${supervisor.supervisedDivision.name}.`, 409);
      }
    }
    data.supervisorId = supervisorId;
  }

  if (Object.keys(data).length === 0) return fail("Tidak ada perubahan yang dikirim.");

  const updated = await prisma.division.update({ where: { id }, data, select: DIVISION_SELECT });
  return NextResponse.json({ division: updated });
}

/** Nonaktifkan divisi; anggota & tugasnya dilepas dari divisi ini. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const division = await prisma.division.findFirst({ where: { id, isActive: true }, select: { id: true } });
  if (!division) return fail("Divisi tidak ditemukan.", 404);

  await prisma.$transaction([
    prisma.user.updateMany({ where: { divisionId: id }, data: { divisionId: null } }),
    prisma.division.update({ where: { id }, data: { isActive: false, supervisorId: null } }),
  ]);
  return NextResponse.json({ ok: true });
}
