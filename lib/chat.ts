import type { Prisma } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import type { ChatMessagePayload } from "@/lib/chat-events";

export const CHAT_STATUSES = [
  "AVAILABLE",
  "MEETING",
  "LEAVE",
  "SLOW_RESPONSE",
] as const;

export type ChatStatusValue = (typeof CHAT_STATUSES)[number];

export const CHAT_MESSAGE_INCLUDE = {
  sender: { select: { id: true, name: true } },
  attachments: {
    orderBy: { createdAt: "asc" as const },
    select: { id: true, name: true, mimeType: true, size: true },
  },
} satisfies Prisma.MessageInclude;

type MessageRecord = Prisma.MessageGetPayload<{ include: typeof CHAT_MESSAGE_INCLUDE }>;

export type ChatConversationSummary = {
  id: string;
  kind: "DIRECT" | "GROUP";
  name: string | null;
  title: string;
  updatedAt: string;
  members: Array<{ id: string; name: string; role: string }>;
  lastMessage: {
    id: string;
    preview: string;
    createdAt: string;
    senderName: string;
    attachmentCount: number;
  } | null;
  unreadCount: number;
};

export function serializeChatMessage(message: MessageRecord): ChatMessagePayload {
  return {
    id: message.id,
    conversationId: message.conversationId,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    sender: { id: message.sender.id, name: message.sender.name },
    attachments: message.attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url: `/api/chat/attachments/${attachment.id}`,
    })),
  };
}

function messagePreview(message: MessageRecord) {
  const text = message.body?.replace(/\s+/g, " ").trim();
  if (text) return text.length > 120 ? `${text.slice(0, 117)}...` : text;
  if (message.attachments.length) {
    return message.attachments.length === 1
      ? message.attachments[0].name
      : `${message.attachments.length} berkas`;
  }
  return "";
}

function conversationTitle(
  conversation: {
    kind: "DIRECT" | "GROUP";
    name: string | null;
    members: Array<{ userId: string; user: { name: string } }>;
  },
  viewerId: string
) {
  if (conversation.kind === "DIRECT") {
    const other = conversation.members.find((member) => member.userId !== viewerId);
    return other?.user.name ?? "Percakapan langsung";
  }
  if (conversation.name?.trim()) return conversation.name.trim();
  return (
    conversation.members
      .filter((member) => member.userId !== viewerId)
      .slice(0, 3)
      .map((member) => member.user.name.split(" ")[0])
      .join(", ") || "Grup"
  );
}

export async function loadConversationSummaries(
  viewerId: string
): Promise<ChatConversationSummary[]> {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId: viewerId },
    select: { conversationId: true, lastReadAt: true },
  });
  if (memberships.length === 0) return [];

  const conversationIds = memberships.map((membership) => membership.conversationId);
  const readSince = memberships.map((membership) => ({
    conversationId: membership.conversationId,
    createdAt: { gt: membership.lastReadAt },
  }));

  const [conversations, unreadGroups] = await Promise.all([
    prisma.conversation.findMany({
      where: { id: { in: conversationIds } },
      orderBy: { updatedAt: "desc" },
      include: {
        members: {
          orderBy: { joinedAt: "asc" },
          select: {
            userId: true,
            user: { select: { id: true, name: true, role: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: CHAT_MESSAGE_INCLUDE,
        },
      },
    }),
    prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: viewerId },
        OR: readSince,
      },
      _count: { _all: true },
    }),
  ]);

  const unreadByConversation = new Map(
    unreadGroups.map((group) => [group.conversationId, group._count._all])
  );

  return conversations.map((conversation) => {
    const lastMessage = conversation.messages[0] ?? null;
    return {
      id: conversation.id,
      kind: conversation.kind,
      name: conversation.name,
      title: conversationTitle(conversation, viewerId),
      updatedAt: conversation.updatedAt.toISOString(),
      members: conversation.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        role: member.user.role,
      })),
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            preview: messagePreview(lastMessage),
            createdAt: lastMessage.createdAt.toISOString(),
            senderName: lastMessage.sender.name,
            attachmentCount: lastMessage.attachments.length,
          }
        : null,
      unreadCount: unreadByConversation.get(conversation.id) ?? 0,
    };
  });
}
