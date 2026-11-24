import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, oneOf, taskScope, ADMIN_ROLES, ROLES } from "@/lib/api";

const PUBLIC_USER = {
  id: true,
  name: true,
  email: true,
  role: true,
  division: { select: { id: true, name: true } },
  weeklyCapacityHours: true,
} as const;

export async function GET() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;

  try {
    const guestScope =
      auth.user.role === "GUEST"
        ? {
            OR: [
              { id: auth.user.id },
              { assignedTasks: { some: taskScope(auth.user) } },
              { createdTasks: { some: taskScope(auth.user) } },
              { taskAssignments: { some: { task: taskScope(auth.user) } } },
            ],
          }
        : {};
    const users = await prisma.user.findMany({
      where: { isActive: true, ...guestScope },
      orderBy: { name: "asc" },
      select: PUBLIC_USER,
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/users", error);
    return fail("Gagal mengambil data tim.", 500);
  }
}

export async function POST(request: Request) {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const body = await readJson(request);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role ?? "MEMBER";
  const divisionId =
    typeof body.divisionId === "string" && body.divisionId ? body.divisionId : null;

  if (!name || !email) return fail("Nama dan email wajib diisi.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Format email tidak valid.");
  if (password.length < 8) return fail("Kata sandi minimal 8 karakter.");
  if (!oneOf(ROLES, role)) return fail("Peran tidak valid.");
  if (role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
    return fail("Hanya Super Admin yang dapat membuat Super Admin.", 403);
  }

  try {
    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return fail("Email sudah terdaftar.", 409);

    if (divisionId) {
      const division = await prisma.division.findFirst({
        where: { id: divisionId, isActive: true },
        select: { id: true },
      });
      if (!division) return fail("Divisi tidak ditemukan.", 404);
    }

    const created = await prisma.user.create({
      data: {
        name,
        email,
        role,
        divisionId,
        passwordHash: await bcrypt.hash(password, 12),
      },
      select: PUBLIC_USER,
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users", error);
    return fail("Anggota gagal disimpan.", 500);
  }
}
