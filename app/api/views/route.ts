import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson } from "@/lib/api";

const MAX_VIEWS = 20;
const FILTER_KEYS = ["search", "status", "priority", "assigneeId", "labelId", "dueFrom", "dueTo"];

/** Simpan hanya kunci filter yang dikenal, nilai string pendek. */
function cleanFilters(value: unknown) {
  if (typeof value !== "object" || value === null) return null;
  const filters: Record<string, string> = {};
  for (const key of FILTER_KEYS) {
    const raw = (value as Record<string, unknown>)[key];
    if (typeof raw === "string" && raw && raw.length <= 200) filters[key] = raw;
  }
  return filters;
}

export async function GET() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;

  const views = await prisma.savedView.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, filters: true },
  });
  return NextResponse.json({ views });
}

export async function POST(request: Request) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;

  const body = await readJson(request);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const filters = cleanFilters(body.filters);
  if (!name || name.length > 60) return fail("Nama tampilan wajib diisi (maksimal 60 karakter).");
  if (!filters || Object.keys(filters).length === 0) return fail("Pilih minimal satu filter untuk disimpan.");

  const count = await prisma.savedView.count({ where: { userId: auth.user.id } });
  if (count >= MAX_VIEWS) return fail(`Maksimal ${MAX_VIEWS} tampilan tersimpan.`);

  const view = await prisma.savedView.create({
    data: { name, filters, userId: auth.user.id },
    select: { id: true, name: true, filters: true },
  });
  return NextResponse.json({ view }, { status: 201 });
}
