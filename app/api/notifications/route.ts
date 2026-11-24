import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/api";

/** Kotak masuk: ?unread=1 untuk yang belum dibaca saja, ?type=MENTIONED untuk satu jenis. */
export async function GET(request: Request) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const params = new URL(request.url).searchParams;
  const unreadOnly = params.get("unread") === "1";
  const type = params.get("type");

  const where = {
    userId: auth.user.id,
    ...(unreadOnly ? { readAt: null } : {}),
    ...(type ? { type: type as never } : {}),
  };
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, type: true, title: true, body: true, taskId: true, readAt: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId: auth.user.id, readAt: null } }),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}
