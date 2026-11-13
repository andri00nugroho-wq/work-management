import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, taskScope, TASK_INCLUDE } from "@/lib/api";

export async function GET() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;

  const scope = taskScope(auth.user);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const [grouped, overdue, recentTasks, projects, totalUsers, totalDivisions, totalProjects] =
      await Promise.all([
        prisma.task.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
        prisma.task.count({
          where: { AND: [scope, { status: { not: "DONE" }, dueDate: { lt: today } }] },
        }),
        prisma.task.findMany({
          where: scope,
          include: TASK_INCLUDE,
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.project.findMany({
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, name: true, tasks: { select: { id: true, status: true } } },
        }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.division.count({ where: { isActive: true } }),
        prisma.project.count({ where: { isActive: true } }),
      ]);

    const count = (status: string) =>
      grouped.find((row) => row.status === status)?._count._all ?? 0;

    const todo = count("TODO");
    const inProgress = count("IN_PROGRESS");
    const review = count("REVIEW");
    const done = count("DONE");

    return NextResponse.json({
      stats: {
        totalTasks: todo + inProgress + review + done,
        todo,
        inProgress,
        review,
        done,
        overdue,
        totalUsers,
        totalDivisions,
        totalProjects,
      },
      recentTasks,
      projects,
    });
  } catch (error) {
    console.error("GET /api/dashboard", error);
    return NextResponse.json({ message: "Gagal mengambil data dashboard." }, { status: 500 });
  }
}
