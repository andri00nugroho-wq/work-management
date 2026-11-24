import { prisma } from "@/lib/prisma";

export function listSubtasks(taskId: string) {
  return prisma.subtask.findMany({
    where: { taskId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, done: true, position: true },
  });
}
