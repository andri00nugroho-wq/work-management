import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { authorize, fail, ADMIN_ROLES } from "@/lib/api";
import { runScheduledChecks } from "@/lib/automation";

/** Cron eksternal: Authorization: Bearer <CRON_SECRET>. */
function cronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || !header.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Jalankan pengingat tenggat & peringatan terlambat sekarang (admin atau cron). */
export async function POST(request: Request) {
  if (!cronAuthorized(request)) {
    const auth = await authorize(ADMIN_ROLES);
    if ("response" in auth) return auth.response;
  }
  try {
    return NextResponse.json(await runScheduledChecks());
  } catch (error) {
    console.error("POST /api/automation/run", error);
    return fail("Pemeriksaan otomatis gagal dijalankan.", 500);
  }
}
