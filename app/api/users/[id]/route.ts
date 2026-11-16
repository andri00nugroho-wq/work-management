import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, oneOf, ADMIN_ROLES, ROLES } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Soft delete: akun dinonaktifkan agar riwayat tugas dan chat tetap utuh. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  if (id === user.id) return fail("Anda tidak dapat menghapus akun sendiri.", 403);

  try {
    const target = await prisma.user.findFirst({
      where: { id, isActive: true },
      select: { id: true, role: true },
    });
    if (!target) return fail("Anggota tidak ditemukan.", 404);

    if (target.role === "SUPER_ADMIN") {
      if (user.role !== "SUPER_ADMIN") {
        return fail("Hanya Super Admin yang dapat menghapus Super Admin.", 403);
      }
      const remainingSuperAdmins = await prisma.user.count({
        where: { role: "SUPER_ADMIN", isActive: true, id: { not: id } },
      });
      if (remainingSuperAdmins === 0) {
        return fail("Super Admin terakhir tidak dapat dihapus.", 409);
      }
    }

    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/users/[id]", error);
    return fail("Anggota gagal dihapus.", 500);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const body = await readJson(request);
  const role = body.role;

  if (!oneOf(ROLES, role)) return fail("Peran tidak valid.");
  if (id === user.id) return fail("Anda tidak dapat mengubah peran akun sendiri.", 403);

  try {
    const target = await prisma.user.findFirst({
      where: { id, isActive: true },
      select: { id: true, role: true },
    });
    if (!target) return fail("Pengguna tidak ditemukan.", 404);

    const touchesSuper = role === "SUPER_ADMIN" || target.role === "SUPER_ADMIN";
    if (touchesSuper && user.role !== "SUPER_ADMIN") {
      return fail("Hanya Super Admin yang dapat mengubah peran Super Admin.", 403);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true, division: { select: { name: true } } },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("PATCH /api/users/[id]", error);
    return fail("Peran gagal diperbarui.", 500);
  }
}
