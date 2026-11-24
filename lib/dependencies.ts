import { prisma } from "@/lib/prisma";

/** Apakah menambah "taskId menunggu dependsOnId" membentuk siklus? (BFS dari dependsOnId) */
export async function wouldCreateCycle(taskId: string, dependsOnId: string) {
  const seen = new Set<string>([dependsOnId]);
  let frontier = [dependsOnId];
  while (frontier.length) {
    const edges = await prisma.taskDependency.findMany({
      where: { taskId: { in: frontier } },
      select: { dependsOnId: true },
    });
    frontier = [];
    for (const edge of edges) {
      if (edge.dependsOnId === taskId) return true;
      if (!seen.has(edge.dependsOnId)) {
        seen.add(edge.dependsOnId);
        frontier.push(edge.dependsOnId);
      }
    }
  }
  return false;
}

/** Tugas prasyarat yang belum selesai. */
export function unfinishedBlockers(taskId: string) {
  return prisma.task.findMany({
    where: { blocking: { some: { taskId } }, status: { not: "DONE" } },
    select: { id: true, title: true },
  });
}

export function listDependencies(taskId: string) {
  return prisma.taskDependency.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    select: { dependsOn: { select: { id: true, title: true, status: true } } },
  });
}
