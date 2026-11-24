import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const WEBHOOK_EVENTS = [
  "task.created",
  "task.status_changed",
  "task.completed",
  "comment.created",
  "request.submitted",
] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const WEBHOOK_FORMATS = ["json", "slack", "teams"] as const;

const TIMEOUT_MS = 5000;

export function signPayload(secret: string, body: string) {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

/** Kirim ke satu webhook dan catat hasilnya. */
export async function deliver(
  hook: { id: string; url: string; format: string; secret: string },
  event: string,
  data: Record<string, unknown>,
  text: string
) {
  const body =
    hook.format === "json"
      ? JSON.stringify({ event, occurredAt: new Date().toISOString(), data })
      : JSON.stringify({ text });
  const headers: Record<string, string> = { "Content-Type": "application/json", "User-Agent": "REI-Work-Management-Webhook" };
  if (hook.format === "json") {
    headers["X-REI-Event"] = event;
    headers["X-REI-Signature"] = signPayload(hook.secret, body);
  }
  try {
    const response = await fetch(hook.url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "manual",
    });
    await prisma.webhook.update({
      where: { id: hook.id },
      data: { lastStatus: response.status, lastError: response.ok ? null : `HTTP ${response.status}`, lastDeliveredAt: new Date() },
    });
    return response.status;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 200) : "Gagal terhubung";
    await prisma.webhook.update({ where: { id: hook.id }, data: { lastStatus: 0, lastError: message, lastDeliveredAt: new Date() } });
    return 0;
  }
}

/** Kirim event ke semua webhook aktif yang berlangganan. Tidak pernah melempar galat. */
export async function dispatchWebhooks(event: WebhookEvent, data: Record<string, unknown>, text: string) {
  try {
    const hooks = await prisma.webhook.findMany({
      where: { isActive: true, events: { has: event } },
      select: { id: true, url: true, format: true, secret: true },
    });
    await Promise.allSettled(hooks.map((hook) => deliver(hook, event, data, text)));
  } catch (error) {
    console.error("dispatchWebhooks", error);
  }
}
