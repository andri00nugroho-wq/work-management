import { prisma } from "@/lib/prisma";

export const COMMENT_SELECT = {
  id: true,
  body: true,
  mentionIds: true,
  createdAt: true,
  editedAt: true,
  author: { select: { id: true, name: true } },
} as const;

export function listComments(taskId: string) {
  return prisma.taskComment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    take: 500,
    select: COMMENT_SELECT,
  });
}

export const MAX_COMMENT_LENGTH = 5000;
