import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, ADMIN_ROLES } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Soft delete: proyek dinonaktifkan (isActive = false), tugas tetap tersimpan. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;

  try {
    const existing = await prisma.project.findFirst({
      where: { id, isActive: true },
      select: { id: true },
    });
    if (!existing) return fail("Proyek tidak ditemukan.", 404);

    await prisma.project.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id]", error);
    return fail("Proyek gagal dihapus.", 500);
  }
}
