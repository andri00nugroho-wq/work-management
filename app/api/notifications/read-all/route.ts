import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/api";

export async function POST() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const result = await prisma.notification.updateMany({
    where: { userId: auth.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ updated: result.count });
}
