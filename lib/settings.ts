import { prisma } from "@/lib/prisma";

export type WipLimits = { TODO?: number; IN_PROGRESS?: number; REVIEW?: number; DONE?: number };

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return (row?.value as T | undefined) ?? fallback;
}

export function setSetting(key: string, value: object) {
  return prisma.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
}
