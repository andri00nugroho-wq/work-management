import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, STAFF_ROLES } from "@/lib/api";
import { generateApiKey } from "@/lib/api-keys";

const SELECT = { id: true, name: true, prefix: true, lastUsedAt: true, revokedAt: true, createdAt: true } as const;

export async function GET() {
  const auth = await authorize(STAFF_ROLES);
  if ("response" in auth) return auth.response;
  const keys = await prisma.apiKey.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    select: SELECT,
  });
  return NextResponse.json({ keys });
}

/** Buat kunci API pribadi. Kunci utuh hanya ditampilkan sekali di respons ini. */
export async function POST(request: Request) {
  const auth = await authorize(STAFF_ROLES);
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) return fail("Nama kunci wajib diisi (maksimal 60 karakter).");
  const active = await prisma.apiKey.count({ where: { userId: auth.user.id, revokedAt: null } });
  if (active >= 10) return fail("Maksimal 10 kunci API aktif per pengguna.");

  const { key, prefix, keyHash } = generateApiKey();
  const record = await prisma.apiKey.create({
    data: { name, prefix, keyHash, userId: auth.user.id },
    select: SELECT,
  });
  return NextResponse.json({ key, apiKey: record }, { status: 201 });
}
