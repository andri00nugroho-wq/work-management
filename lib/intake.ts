import { randomBytes } from "node:crypto";

export function newSlug() {
  return randomBytes(6).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "x");
}

/** Pembatas laju sederhana per kunci (mis. IP) dalam memori proses. */
const store = globalThis as typeof globalThis & { __reiIntakeHits?: Map<string, number[]> };
export function rateLimited(key: string, limit = 5, windowMs = 10 * 60 * 1000) {
  const hits = (store.__reiIntakeHits ??= new Map<string, number[]>());
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "lokal"
  );
}

export const INTAKE_FORM_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  projectId: true,
  assigneeId: true,
  defaultPriority: true,
  isPublic: true,
  isActive: true,
  createdAt: true,
  _count: { select: { tasks: true } },
} as const;
