import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, oneOf, ADMIN_ROLES, ROLES } from "@/lib/api";
import type { Prisma } from "@/app/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

const PUBLIC_USER = {
  id: true,
  name: true,
  email: true,
  role: true,
  division: { select: { id: true, name: true } },
  weeklyCapacityHours: true,
} as const;

/** Admin: ubah peran, divisi, reset kata sandi, atau nonaktifkan akun. */
export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const body = await readJson(request);

  try {
    const target = await prisma.user.findFirst({
      where: { id, isActive: true },
      select: { id: true, role: true },
    });
    if (!target) return fail("Pengguna tidak ditemukan.", 404);

    // Akun Super Admin hanya boleh disentuh oleh Super Admin.
    if (target.role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
      return fail("Hanya Super Admin yang dapat mengubah akun Super Admin.", 403);
    }

    const data: Prisma.UserUncheckedUpdateInput = {};

    if (body.role !== undefined) {
      if (!oneOf(ROLES, body.role)) return fail("Peran tidak valid.");
      if (id === user.id) return fail("Anda tidak dapat mengubah peran akun sendiri.", 403);
      if (body.role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
        return fail("Hanya Super Admin yang dapat mengubah peran Super Admin.", 403);
      }
      data.role = body.role;
    }

    if (body.divisionId !== undefined) {
      const divisionId =
        typeof body.divisionId === "string" && body.divisionId ? body.divisionId : null;
      if (divisionId) {
        const division = await prisma.division.findFirst({
          where: { id: divisionId, isActive: true },
          select: { id: true },
        });
        if (!division) return fail("Divisi tidak ditemukan.", 404);
      }
      data.divisionId = divisionId;
    }

    if (body.password !== undefined) {
      const password = typeof body.password === "string" ? body.password : "";
      if (password.length < 8) return fail("Kata sandi minimal 8 karakter.");
      data.passwordHash = await bcrypt.hash(password, 12);
      data.passwordChangedAt = new Date(); // memutus semua sesi lama pengguna ini
    }

    if (body.weeklyCapacityHours !== undefined) {
      const hours = body.weeklyCapacityHours;
      if (!Number.isInteger(hours) || (hours as number) < 1 || (hours as number) > 80) {
        return fail("Kapasitas mingguan harus 1-80 jam.");
      }
      data.weeklyCapacityHours = hours as number;
    }

    if (body.isActive === false) {
      if (id === user.id) return fail("Anda tidak dapat menonaktifkan akun sendiri.", 403);
      data.isActive = false;
      data.passwordChangedAt = new Date();
    }

    if (Object.keys(data).length === 0) return fail("Tidak ada perubahan yang dikirim.");

    const updated = await prisma.user.update({ where: { id }, data, select: PUBLIC_USER });
    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("PATCH /api/users/[id]", error);
    return fail("Data pengguna gagal diperbarui.", 500);
  }
}
