import { NextResponse } from "next/server";
import { authorize, fail, readJson, MANAGE_ROLES, STATUSES } from "@/lib/api";
import { getSetting, setSetting, type WipLimits } from "@/lib/settings";

const KEY = "board.wipLimits";

export async function GET() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  return NextResponse.json({ wipLimits: await getSetting<WipLimits>(KEY, {}) });
}

/** Batas jumlah kartu per kolom Kanban; kosong/0 = tanpa batas. */
export async function PUT(request: Request) {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;

  const body = await readJson(request);
  const limits: WipLimits = {};
  for (const status of STATUSES) {
    const value = body[status];
    if (value === undefined || value === null || value === "" || value === 0) continue;
    if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 999) {
      return fail("Batas WIP harus bilangan bulat 1-999.");
    }
    limits[status] = value as number;
  }
  await setSetting(KEY, limits);
  return NextResponse.json({ wipLimits: limits });
}
