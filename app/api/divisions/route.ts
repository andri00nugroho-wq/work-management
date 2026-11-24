import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, ADMIN_ROLES } from "@/lib/api";
import { DIVISION_SELECT } from "@/lib/divisions";

export async function GET() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;

  const divisions = await prisma.division.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: DIVISION_SELECT,
  });
  return NextResponse.json({ divisions });
}

export async function POST(request: Request) {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;

  const body = await readJson(request);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!name || name.length > 80) return fail("Nama divisi wajib diisi (maksimal 80 karakter).");
  if (description.length > 500) return fail("Deskripsi maksimal 500 karakter.");

  const exists = await prisma.division.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true, isActive: true },
  });
  if (exists?.isActive) return fail("Divisi dengan nama itu sudah ada.", 409);

  // Nama unik di database: aktifkan kembali divisi lama dengan nama sama.
  const division = exists
    ? await prisma.division.update({
        where: { id: exists.id },
        data: { name, description: description || null, isActive: true },
        select: DIVISION_SELECT,
      })
    : await prisma.division.create({
        data: { name, description: description || null },
        select: DIVISION_SELECT,
      });
  return NextResponse.json({ division }, { status: 201 });
}
