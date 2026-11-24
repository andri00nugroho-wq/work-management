import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, STAFF_ROLES } from "@/lib/api";
import {
  CHAT_MESSAGE_INCLUDE,
  serializeChatMessage,
} from "@/lib/chat";
import {
  ChatFileError,
  MAX_CHAT_FILES_PER_MESSAGE,
  removeChatFile,
  saveChatFile,
  type StoredChatFile,
} from "@/lib/chat-files";
import { publishChatEvent } from "@/lib/chat-events";

type Ctx = { params: Promise<{ id: string }> };

const MAX_MESSAGE_LENGTH = 8000;
const MAX_TOTAL_ATTACHMENT_BYTES = 200 * 1024 * 1024;

async function findConversation(conversationId: string, userId: string) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, members: { some: { userId } } },
    select: { id: true, members: { select: { userId: true } } },
  });
}

export async function GET(request: Request, { params }: Ctx) {
  const auth = await authorize(STAFF_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;

  try {
    const conversation = await findConversation(id, auth.user.id);
    if (!conversation) return fail("Percakapan tidak ditemukan.", 404);

    const url = new URL(request.url);
    const rawLimit = url.searchParams.get("limit");
    const requestedLimit = rawLimit === null ? 30 : Number(rawLimit);
    const limit = Math.min(
      Math.max(Number.isFinite(requestedLimit) ? Math.trunc(requestedLimit) : 30, 1),
      100
    );
    const before = url.searchParams.get("before");
    const beforeDate = before ? new Date(before) : null;
    const createdAt =
      beforeDate && !Number.isNaN(beforeDate.getTime())
        ? { lt: beforeDate }
        : undefined;

    const messages = await prisma.message.findMany({
      where: { conversationId: id, ...(createdAt ? { createdAt } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      include: CHAT_MESSAGE_INCLUDE,
    });

    const hasMore = messages.length > limit;
    const page = messages.slice(0, limit).reverse();

    return NextResponse.json({
      messages: page.map(serializeChatMessage),
      hasMore,
    });
  } catch (error) {
    console.error("GET /api/chat/conversations/[id]/messages", error);
    return fail("Gagal mengambil pesan.", 500);
  }
}

export async function POST(request: Request, { params }: Ctx) {
  const auth = await authorize(STAFF_ROLES);
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  let conversation: { id: string; members: Array<{ userId: string }> } | null;
  try {
    conversation = await findConversation(id, user.id);
  } catch (error) {
    console.error("POST /api/chat/conversations/[id]/messages access", error);
    return fail("Pesan gagal dikirim.", 500);
  }
  if (!conversation) return fail("Percakapan tidak ditemukan.", 404);

  const contentType = request.headers.get("content-type") ?? "";
  let body = "";
  let files: File[] = [];

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const rawBody = form.get("body");
      body = typeof rawBody === "string" ? rawBody : "";
      files = form
        .getAll("files")
        .filter((value): value is File => value instanceof File && value.size > 0);
    } else {
      const payload = await readJson(request);
      body = typeof payload.body === "string" ? payload.body : "";
    }
  } catch {
    return fail("Format pesan tidak valid.");
  }

  body = body.trim();
  if (!body && files.length === 0) {
    return fail("Tulis pesan atau lampirkan berkas.");
  }
  if (body.length > MAX_MESSAGE_LENGTH) {
    return fail("Pesan maksimal 8.000 karakter.");
  }
  if (files.length > MAX_CHAT_FILES_PER_MESSAGE) {
    return fail(`Maksimal ${MAX_CHAT_FILES_PER_MESSAGE} berkas per pesan.`);
  }
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
    return fail("Total ukuran berkas per pesan maksimal 200 MB.");
  }

  const stored: StoredChatFile[] = [];
  try {
    for (const file of files) {
      stored.push(await saveChatFile(file));
    }
  } catch (error) {
    await Promise.all(stored.map((file) => removeChatFile(file.key)));
    if (error instanceof ChatFileError) return fail(error.message, 400);
    console.error("POST /api/chat/conversations/[id]/messages files", error);
    return fail("Berkas gagal disimpan.", 500);
  }

  try {
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: user.id,
          body: body || null,
          attachments: {
            create: stored.map((file) => ({
              key: file.key,
              name: file.name,
              mimeType: file.mimeType,
              size: file.size,
            })),
          },
        },
        include: CHAT_MESSAGE_INCLUDE,
      }),
      prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
      prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId: id, userId: user.id } },
        data: { lastReadAt: new Date() },
      }),
    ]);

    const payload = serializeChatMessage(message);
    publishChatEvent({
      type: "message",
      memberIds: conversation.members.map((member) => member.userId),
      message: payload,
    });

    return NextResponse.json({ message: payload }, { status: 201 });
  } catch (error) {
    await Promise.all(stored.map((file) => removeChatFile(file.key)));
    console.error("POST /api/chat/conversations/[id]/messages", error);
    return fail("Pesan gagal dikirim.", 500);
  }
}
