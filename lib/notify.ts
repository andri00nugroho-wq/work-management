import { prisma } from "@/lib/prisma";
import { publishChatEvent } from "@/lib/chat-events";
import type { NotificationType } from "@/app/generated/prisma/client";

type NotifyInput = {
  type: NotificationType;
  title: string;
  body?: string | null;
  taskId?: string | null;
  actorId?: string | null;
};

/**
 * Kirim pemberitahuan ke beberapa pengguna (unik, tanpa pelaku) dan dorong
 * secara real-time lewat SSE. Kegagalan hanya dicatat: notifikasi tidak boleh
 * menggagalkan aksi utama pengguna.
 */
export async function notify(recipientIds: Array<string | null | undefined>, input: NotifyInput) {
  const ids = Array.from(new Set(recipientIds.filter((id): id is string => Boolean(id)))).filter(
    (id) => id !== input.actorId
  );
  if (!ids.length) return;
  try {
    const active = await prisma.user.findMany({ where: { id: { in: ids }, isActive: true }, select: { id: true } });
    const rows = await prisma.notification.createManyAndReturn({
      data: active.map((user) => ({
        userId: user.id,
        type: input.type,
        title: input.title.slice(0, 200),
        body: input.body ? input.body.slice(0, 500) : null,
        taskId: input.taskId ?? null,
        actorId: input.actorId ?? null,
      })),
      select: { id: true, userId: true, type: true, title: true, body: true, taskId: true, readAt: true, createdAt: true },
    });
    for (const row of rows) {
      publishChatEvent({
        type: "notification",
        memberIds: [row.userId],
        notification: {
          id: row.id,
          type: row.type,
          title: row.title,
          body: row.body,
          taskId: row.taskId,
          readAt: null,
          createdAt: row.createdAt.toISOString(),
        },
      });
    }
  } catch (error) {
    console.error("notify", error);
  }
}

/** Semua orang yang terlibat dalam tugas: pembuat, penanggung jawab, pelaksana, pengamat. */
export async function taskParticipants(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      creatorId: true,
      assigneeId: true,
      assignments: { select: { userId: true } },
      tags: { select: { userId: true } },
    },
  });
  if (!task) return [];
  return Array.from(
    new Set(
      [task.creatorId, task.assigneeId, ...task.assignments.map((a) => a.userId), ...task.tags.map((t) => t.userId)].filter(
        (id): id is string => Boolean(id)
      )
    )
  );
}
