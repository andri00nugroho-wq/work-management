import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, parseDate, MANAGE_ROLES } from "@/lib/api";
import { BUILT_IN_TEMPLATES, parseItems } from "@/lib/templates";

const DAY = 24 * 60 * 60 * 1000;

/** Buat proyek + seluruh tugasnya (jadwal, sub-tugas, dependensi) dari templat. */
export async function POST(request: Request) {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const body = await readJson(request);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const templateId = typeof body.templateId === "string" ? body.templateId : "";
  const start = parseDate(body.startDate);
  if (!name || name.length > 180) return fail("Nama proyek wajib diisi (maksimal 180 karakter).");
  if (start === "invalid" || !start) return fail("Tanggal mulai proyek wajib diisi.");

  const builtIn = BUILT_IN_TEMPLATES.find((template) => template.id === templateId);
  const custom = builtIn ? null : await prisma.projectTemplate.findUnique({ where: { id: templateId } });
  const items = builtIn?.items ?? (custom ? parseItems(custom.items) : null);
  if (!items) return fail("Templat tidak ditemukan.", 404);

  const at = (offset: number) => new Date(start.getTime() + offset * DAY);

  const result = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: { name, description: builtIn?.description ?? custom?.description ?? null },
      select: { id: true, name: true },
    });
    const ids: string[] = [];
    for (const item of items) {
      const task = await tx.task.create({
        data: {
          title: item.title,
          description: item.description ?? null,
          priority: item.priority,
          isMilestone: item.isMilestone ?? false,
          startDate: item.isMilestone ? null : at(item.startOffset),
          dueDate: at(item.startOffset + item.duration - 1),
          projectId: project.id,
          assigneeId: user.id,
          divisionId: user.divisionId,
          creatorId: user.id,
          assignments: { create: { userId: user.id } },
          subtasks: { create: (item.subtasks ?? []).map((title, position) => ({ title, position })) },
          activities: {
            create: { userId: user.id, message: `${user.name} membuat tugas "${item.title}" dari templat` },
          },
        },
        select: { id: true },
      });
      ids.push(task.id);
    }
    const edges = items.flatMap((item, index) =>
      (item.dependsOn ?? [])
        .filter((dep) => dep >= 0 && dep < ids.length && dep !== index)
        .map((dep) => ({ taskId: ids[index], dependsOnId: ids[dep] }))
    );
    if (edges.length) await tx.taskDependency.createMany({ data: edges, skipDuplicates: true });
    return { project, taskCount: ids.length, dependencyCount: edges.length };
  });

  return NextResponse.json(result, { status: 201 });
}
