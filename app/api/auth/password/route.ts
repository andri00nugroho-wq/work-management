import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson } from "@/lib/api";
import { COOKIE_NAME, SESSION_SECONDS, createSessionToken } from "@/lib/session";

/** Ganti kata sandi sendiri. Sesi lain terputus; sesi ini diterbitkan ulang. */
export async function PATCH(request: Request) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const body = await readJson(request);
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) return fail("Kata sandi lama dan baru wajib diisi.");
  if (newPassword.length < 8) return fail("Kata sandi baru minimal 8 karakter.");
  if (newPassword === currentPassword) return fail("Kata sandi baru harus berbeda dari yang lama.");

  try {
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!record || !(await bcrypt.compare(currentPassword, record.passwordHash))) {
      return fail("Kata sandi lama salah.", 401);
    }

    // Detik dibulatkan ke bawah agar token baru (iat detik ini) tetap sah.
    const changedAt = new Date(Math.floor(Date.now() / 1000) * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12), passwordChangedAt: changedAt },
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, await createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("PATCH /api/auth/password", error);
    return fail("Kata sandi gagal diganti.", 500);
  }
}
