import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson } from "@/lib/api";

const MIN_LENGTH = 8;
// bcrypt hanya memakai 72 byte pertama, jadi batasi agar tidak terpotong diam-diam.
const MAX_BYTES = 72;

/** Ganti kata sandi akun sendiri; kata sandi lama wajib diverifikasi. */
export async function PATCH(request: Request) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const body = await readJson(request);
  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return fail("Kata sandi saat ini dan kata sandi baru wajib diisi.");
  }
  if (newPassword.length < MIN_LENGTH) {
    return fail(`Kata sandi baru minimal ${MIN_LENGTH} karakter.`);
  }
  if (Buffer.byteLength(newPassword, "utf8") > MAX_BYTES) {
    return fail("Kata sandi baru terlalu panjang.");
  }
  if (newPassword === currentPassword) {
    return fail("Kata sandi baru harus berbeda dari kata sandi saat ini.");
  }

  try {
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!account) return fail("Akun tidak ditemukan.", 404);

    const valid = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!valid) return fail("Kata sandi saat ini salah.", 400);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/auth/password", error);
    return fail("Kata sandi gagal diubah.", 500);
  }
}
