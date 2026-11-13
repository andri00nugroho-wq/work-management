import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { UserRole } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";

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
  if (!token) return null;

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
        supervisedDivision: { select: { id: true } },
      },
    });
    if (!user) return null;

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
