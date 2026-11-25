import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, taskScope, MANAGE_ROLES } from "@/lib/api";

export async function GET() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;

  try {
    const guestScope =
      auth.user.role === "GUEST" ? { tasks: { some: taskScope(auth.user) } } : {};
    const projects = await prisma.project.findMany({
      where: { isActive: true, ...guestScope },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { tasks: true } },
        tasks: {
          where: auth.user.role === "GUEST" ? taskScope(auth.user) : undefined,
          select: { id: true, status: true },
        },
      },
    });
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("GET /api/projects", error);
    return fail("Gagal mengambil data proyek.", 500);
  }
}

export async function POST(request: Request) {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;

  const body = await readJson(request);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!name) return fail("Nama proyek wajib diisi.");
  if (name.length > 180) return fail("Nama proyek maksimal 180 karakter.");
  if (description.length > 5000) return fail("Deskripsi maksimal 5000 karakter.");

  try {
    const project = await prisma.project.create({
      data: { name, description: description || null },
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects", error);
    return fail("Proyek gagal disimpan.", 500);
  }
}
