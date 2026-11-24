import { prisma } from "@/lib/prisma";
import { taskScope } from "@/lib/api";
import { buildCalendar } from "@/lib/ics";
import { sessionUserById } from "@/lib/task-access";

type Ctx = { params: Promise<{ token: string }> };

const STATUS_TEXT = { TODO: "Belum Mulai", IN_PROGRESS: "Berjalan", REVIEW: "Menunggu Review", DONE: "Selesai" } as const;

/** Feed .ics pribadi (token rahasia di URL) untuk Google Calendar / Outlook. */
export async function GET(request: Request, { params }: Ctx) {
  const { token } = await params;
  const clean = token.replace(/\.ics$/, "");
  if (!/^[0-9a-f]{48}$/.test(clean)) return new Response("Tidak ditemukan", { status: 404 });

  const owner = await prisma.user.findFirst({ where: { calendarToken: clean, isActive: true }, select: { id: true } });
  const user = owner ? await sessionUserById(owner.id) : null;
  if (!user) return new Response("Tidak ditemukan", { status: 404 });

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const tasks = await prisma.task.findMany({
    where: { AND: [taskScope(user), { dueDate: { not: null, gte: since } }] },
    orderBy: { dueDate: "asc" },
    take: 1000,
    select: {
      id: true,
      title: true,
      status: true,
      startDate: true,
      dueDate: true,
      updatedAt: true,
      isMilestone: true,
      project: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  });

  const origin = new URL(request.url).origin;
  const body = buildCalendar(
    `REI · ${user.name}`,
    tasks.map((task) => ({
      uid: `${task.id}@rei-work-management`,
      title: `${task.isMilestone ? "◆ " : ""}${task.status === "DONE" ? "✓ " : ""}${task.title}`,
      description: [
        `Status: ${STATUS_TEXT[task.status]}`,
        `Proyek: ${task.project?.name ?? "Tanpa proyek"}`,
        `Penanggung jawab: ${task.assignee?.name ?? "-"}`,
      ].join("\n"),
      start: task.startDate && task.startDate <= task.dueDate! ? task.startDate : task.dueDate!,
      end: task.dueDate!,
      updatedAt: task.updatedAt,
      url: origin,
    }))
  );
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="rei-tugas.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
