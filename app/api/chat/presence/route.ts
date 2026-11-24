import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, oneOf, readJson, STAFF_ROLES } from "@/lib/api";
import { publishChatEvent } from "@/lib/chat-events";
import { onlineChatUserIds } from "@/lib/chat-presence";
import { CHAT_STATUSES } from "@/lib/chat";

export async function GET() {
  const auth = await authorize(STAFF_ROLES);
  if ("response" in auth) return auth.response;

  try {
    const users = await prisma.user.findMany({
      where: { isActive: true, role: { not: "GUEST" } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        role: true,
        chatStatus: true,
        chatStatusNote: true,
        division: { select: { name: true } },
      },
    });
    const online = new Set(onlineChatUserIds());

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        role: user.role,
        division: user.division?.name ?? null,
        status: user.chatStatus,
        note: user.chatStatusNote,
        online: online.has(user.id),
      })),
    });
  } catch (error) {
    console.error("GET /api/chat/presence", error);
    return fail("Status tim gagal dimuat.", 500);
  }
}

export async function PATCH(request: Request) {
  const auth = await authorize(STAFF_ROLES);
  if ("response" in auth) return auth.response;

  const body = await readJson(request);
  if (!oneOf(CHAT_STATUSES, body.status)) return fail("Status tidak valid.");
  const note =
    typeof body.note === "string" ? body.note.trim().slice(0, 80) : "";

  try {
    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: { chatStatus: body.status, chatStatusNote: note || null },
      select: { id: true, chatStatus: true, chatStatusNote: true },
    });

    publishChatEvent({ type: "presence", onlineUserIds: onlineChatUserIds() });

    return NextResponse.json({
      user: {
        id: updated.id,
        status: updated.chatStatus,
        note: updated.chatStatusNote,
      },
    });
  } catch (error) {
    console.error("PATCH /api/chat/presence", error);
    return fail("Status gagal disimpan.", 500);
  }
}
