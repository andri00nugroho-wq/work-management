import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson } from "@/lib/api";
import { loadConversationSummaries } from "@/lib/chat";
import { publishChatEvent } from "@/lib/chat-events";

export async function GET() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;

  try {
    const conversations = await loadConversationSummaries(auth.user.id);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("GET /api/chat/conversations", error);
    return fail("Gagal mengambil daftar percakapan.", 500);
  }
}

export async function POST(request: Request) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const body = await readJson(request);
  const rawMemberIds = Array.isArray(body.memberIds)
    ? body.memberIds.filter((value): value is string => typeof value === "string")
    : [];
  const requestedName =
    typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";

  const memberIds = Array.from(new Set(rawMemberIds)).filter(
    (id) => id !== user.id
  );

  try {
    if (memberIds.length === 0) {
      return fail("Pilih minimal satu anggota untuk memulai percakapan.");
    }
    if (memberIds.length > 50) {
      return fail("Maksimal 50 anggota per percakapan.", 400);
    }

    const members = await prisma.user.findMany({
      where: { id: { in: memberIds }, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    if (members.length !== memberIds.length) {
      return fail("Sebagian anggota tidak ditemukan atau tidak aktif.", 400);
    }

    const isDirect = memberIds.length === 1 && !requestedName;

    if (isDirect) {
      const otherId = memberIds[0];
      const existing = await prisma.conversation.findFirst({
        where: {
          kind: "DIRECT",
          AND: [
            { members: { some: { userId: user.id } } },
            { members: { some: { userId: otherId } } },
            { members: { every: { userId: { in: [user.id, otherId] } } } },
          ],
        },
        select: { id: true },
      });

      if (existing) {
        const summary = (await loadConversationSummaries(user.id)).find(
          (conversation) => conversation.id === existing.id
        );
        if (summary) {
          return NextResponse.json({ conversation: summary, created: false });
        }
      }
    }

    const fallbackName = `Grup ${members
      .slice(0, 3)
      .map((member) => member.name.split(" ")[0])
      .join(", ")}`;

    const created = await prisma.conversation.create({
      data: {
        kind: isDirect ? "DIRECT" : "GROUP",
        name: isDirect ? null : requestedName || fallbackName,
        createdById: user.id,
        members: {
          create: [user.id, ...memberIds].map((userId) => ({
            userId,
            lastReadAt: new Date(),
          })),
        },
      },
      select: { id: true },
    });

    const summary = (await loadConversationSummaries(user.id)).find(
      (conversation) => conversation.id === created.id
    );
    if (!summary) {
      return fail("Percakapan dibuat tetapi gagal dimuat.", 500);
    }

    publishChatEvent({
      type: "conversation",
      memberIds: [user.id, ...memberIds],
      conversationId: created.id,
    });

    return NextResponse.json({ conversation: summary, created: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/chat/conversations", error);
    return fail("Percakapan gagal dibuat.", 500);
  }
}
