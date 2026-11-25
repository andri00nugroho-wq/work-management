import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, ADMIN_ROLES } from "@/lib/api";
import { WEBHOOK_EVENTS, WEBHOOK_FORMATS } from "@/lib/webhooks";

const SELECT = {
  id: true,
  name: true,
  url: true,
  format: true,
  events: true,
  isActive: true,
  lastStatus: true,
  lastError: true,
  lastDeliveredAt: true,
  createdAt: true,
} as const;

export async function GET() {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;
  const webhooks = await prisma.webhook.findMany({ orderBy: { createdAt: "desc" }, select: SELECT });
  return NextResponse.json({ webhooks, events: WEBHOOK_EVENTS });
}

export async function POST(request: Request) {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const format = body.format ?? "json";
  const events = Array.isArray(body.events) ? body.events : [];

  if (!name || name.length > 80) return fail("Nama webhook wajib diisi (maksimal 80 karakter).");
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
  } catch {
    return fail("URL webhook harus HTTP atau HTTPS yang valid.");
  }
  if (!WEBHOOK_FORMATS.includes(format as never)) return fail("Format webhook tidak valid.");
  if (!events.length || events.some((event) => !WEBHOOK_EVENTS.includes(event as never))) {
    return fail("Pilih minimal satu event yang valid.");
  }

  const secret = randomBytes(24).toString("hex");
  const webhook = await prisma.webhook.create({
    data: { name, url, format: format as string, events: events as string[], secret, createdById: auth.user.id },
    select: SELECT,
  });
  // Rahasia penanda tangan hanya ditampilkan sekali.
  return NextResponse.json({ webhook, secret }, { status: 201 });
}
