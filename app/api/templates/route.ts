import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, MANAGE_ROLES } from "@/lib/api";
import { BUILT_IN_TEMPLATES, parseItems, type TemplateItem } from "@/lib/templates";

const DAY = 24 * 60 * 60 * 1000;

export async function GET() {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;
  const custom = await prisma.projectTemplate.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({
    templates: [
      ...BUILT_IN_TEMPLATES,
      ...custom.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        builtIn: false,
        items: parseItems(row.items),
      })),
    ],
  });
}

/** Simpan struktur proyek yang ada sebagai templat (tanggal menjadi offset relatif). */
export async function POST(request: Request) {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  if (!name || name.length > 120) return fail("Nama templat wajib diisi (maksimal 120 karakter).");

  const project = await prisma.project.findFirst({
    where: { id: projectId, isActive: true },
    select: {
      tasks: {
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          startDate: true,
          dueDate: true,
          createdAt: true,
          isMilestone: true,
          subtasks: { orderBy: { position: "asc" }, select: { title: true } },
          dependsOn: { select: { dependsOnId: true } },
        },
      },
    },
  });
  if (!project) return fail("Proyek tidak ditemukan.", 404);
  if (!project.tasks.length) return fail("Proyek belum punya tugas untuk dijadikan templat.");

  // Urutkan menurut tanggal acuan (mulai/tenggat) di sini: di database, milestone tanpa
  // tanggal mulai akan selalu jatuh di akhir (NULL terakhir).
  const anchor = (task: (typeof project.tasks)[number]) => (task.startDate ?? task.dueDate ?? task.createdAt).getTime();
  const tasks = [...project.tasks].sort((a, b) => anchor(a) - anchor(b) || a.createdAt.getTime() - b.createdAt.getTime());
  const base = Math.min(...tasks.map(anchor));
  const index = new Map(tasks.map((task, position) => [task.id, position]));
  const items: TemplateItem[] = tasks.map((task) => {
    const start = (task.startDate ?? task.dueDate ?? task.createdAt).getTime();
    const end = (task.dueDate ?? task.startDate ?? task.createdAt).getTime();
    return {
      title: task.title,
      description: task.description ?? undefined,
      priority: task.priority,
      startOffset: Math.round((start - base) / DAY),
      duration: Math.max(1, Math.round((end - start) / DAY) + 1),
      isMilestone: task.isMilestone,
      subtasks: task.subtasks.map((subtask) => subtask.title),
      dependsOn: task.dependsOn
        .map((dep) => index.get(dep.dependsOnId))
        .filter((value): value is number => value !== undefined),
    };
  });

  const template = await prisma.projectTemplate.create({
    data: { name, description: description || null, items, createdById: auth.user.id },
  });
  return NextResponse.json({ template: { ...template, builtIn: false, items } }, { status: 201 });
}
