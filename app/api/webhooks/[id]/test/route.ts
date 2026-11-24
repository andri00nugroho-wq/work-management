import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, ADMIN_ROLES } from "@/lib/api";
import { deliver } from "@/lib/webhooks";

type Ctx = { params: Promise<{ id: string }> };

/** Kirim event uji "ping" untuk memeriksa sambungan. */
export async function POST(_request: Request, { params }: Ctx) {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const hook = await prisma.webhook.findUnique({ where: { id }, select: { id: true, url: true, format: true, secret: true } });
  if (!hook) return fail("Webhook tidak ditemukan.", 404);
  const status = await deliver(hook, "ping", { message: "Uji koneksi dari REI Work Management" }, "✅ Uji koneksi webhook REI Work Management berhasil.");
  return NextResponse.json({ status, ok: status >= 200 && status < 300 });
}
