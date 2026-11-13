import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { fail, readJson } from "@/lib/api";
import { COOKIE_NAME, SESSION_SECONDS, createSessionToken } from "@/lib/session";

export async function POST(request: Request) {
  const body = await readJson(request);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) return fail("Email dan kata sandi wajib diisi.");

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Pesan sengaja sama agar tidak membocorkan email mana yang terdaftar.
    const valid =
      user && user.isActive && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !valid) return fail("Email atau kata sandi salah.", 401);

    const token = await createSessionToken(user.id);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("POST /api/auth/login", error);
    const message =
      error instanceof Error && error.message.includes("JWT_SECRET")
        ? error.message
        : "Login gagal. Coba lagi.";
    return fail(message, 500);
  }
}
