import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, oneOf, MANAGE_ROLES, PRIORITIES } from "@/lib/api";
import { INTAKE_FORM_SELECT, newSlug } from "@/lib/intake";

export async function GET() {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;
  const forms = await prisma.intakeForm.findMany({ orderBy: { createdAt: "desc" }, select: INTAKE_FORM_SELECT });
  return NextResponse.json({ forms });
}

export async function POST(request: Request) {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const projectId = typeof body.projectId === "string" && body.projectId ? body.projectId : null;
  const assigneeId = typeof body.assigneeId === "string" && body.assigneeId ? body.assigneeId : null;
  const priority = body.defaultPriority ?? "MEDIUM";
  if (!name || name.length > 120) return fail("Nama formulir wajib diisi (maksimal 120 karakter).");
  if (description.length > 1000) return fail("Deskripsi maksimal 1000 karakter.");
  if (!oneOf(PRIORITIES, priority)) return fail("Prioritas tidak valid.");
  if (projectId && !(await prisma.project.count({ where: { id: projectId, isActive: true } }))) {
    return fail("Proyek tidak ditemukan.", 404);
  }
  if (assigneeId && !(await prisma.user.count({ where: { id: assigneeId, isActive: true, role: { not: "GUEST" } } }))) {
    return fail("Penanggung jawab tidak ditemukan.", 404);
  }

  const form = await prisma.intakeForm.create({
    data: {
      name,
      description: description || null,
      projectId,
      assigneeId,
      defaultPriority: priority,
      isPublic: body.isPublic === true,
      slug: newSlug(),
      createdById: auth.user.id,
    },
    select: INTAKE_FORM_SELECT,
  });
  return NextResponse.json({ form }, { status: 201 });
}
