import { cookies, headers } from "next/headers";
import { jwtVerify } from "jose";
import type { UserRole } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { API_KEY_PREFIX, hashApiKey } from "@/lib/api-keys";

const API_KEY_TOUCH_MS = 5 * 60 * 1000;

/** Autentikasi integrasi: Authorization: Bearer rei_... */
async function userFromApiKey(): Promise<SessionUser | null> {
  const header = (await headers()).get("authorization") ?? "";
  if (!header.startsWith(`Bearer ${API_KEY_PREFIX}`)) return null;
  const key = header.slice(7).trim();
  const record = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(key) },
    select: {
      id: true,
      revokedAt: true,
      lastUsedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          divisionId: true,
          supervisedDivision: { select: { id: true } },
        },
      },
    },
  });
  if (!record || record.revokedAt || !record.user.isActive) return null;
  if (!record.lastUsedAt || Date.now() - record.lastUsedAt.getTime() > API_KEY_TOUCH_MS) {
    await prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } });
  }
  const { user } = record;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    divisionId: user.divisionId,
    supervisedDivisionId: user.supervisedDivision?.id ?? null,
  };
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  divisionId: string | null;
  supervisedDivisionId: string | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get("token")?.value;
  if (!token) return userFromApiKey();

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;

    const user = await prisma.user.findFirst({
      where: { id: payload.sub, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        divisionId: true,
        passwordChangedAt: true,
        supervisedDivision: { select: { id: true } },
      },
    });
    if (!user) return null;

    // Token yang terbit sebelum kata sandi diganti tidak berlaku lagi.
    if (
      user.passwordChangedAt &&
      typeof payload.iat === "number" &&
      payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      divisionId: user.divisionId,
      supervisedDivisionId: user.supervisedDivision?.id ?? null,
    };
  } catch {
    return null;
  }
}
