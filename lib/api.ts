import { NextResponse } from "next/server";
import { Prisma, TaskPriority, TaskStatus, UserRole } from "@/app/generated/prisma";
import { getCurrentUser, type SessionUser } from "@/lib/current-user";

export const ADMIN_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
export const MANAGE_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.SPV,
  UserRole.MANAGER,
];

export const STATUSES = Object.values(TaskStatus);
export const PRIORITIES = Object.values(TaskPriority);
export const ROLES = Object.values(UserRole);

export function oneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

/** Pakai: const auth = await authorize(MANAGE_ROLES); if ("response" in auth) return auth.response; */
export async function authorize(
  roles?: UserRole[]
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { response: fail("Sesi berakhir. Silakan login kembali.", 401) };
  if (roles && !roles.includes(user.role)) {
    return { response: fail("Anda tidak memiliki akses untuk aksi ini.", 403) };
  }
  return { user };
}

/** Batas tugas yang boleh dilihat tiap role. */
export function taskScope(user: SessionUser): Prisma.TaskWhereInput {
  if (
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.ADMIN ||
    user.role === UserRole.MANAGER
  ) {
    return {};
  }

  const own: Prisma.TaskWhereInput[] = [
    { assigneeId: user.id },
    { creatorId: user.id },
    { assignments: { some: { userId: user.id } } },
    { tags: { some: { userId: user.id } } },
  ];

  if (user.role === UserRole.SPV) {
    const divisionIds = [user.divisionId, user.supervisedDivisionId].filter(
      (id): id is string => Boolean(id)
    );
    if (divisionIds.length) own.push({ divisionId: { in: divisionIds } });
  }

  return { OR: own };
}

export const TASK_INCLUDE = {
  project: { select: { id: true, name: true } },
  division: { select: { name: true } },
  assignee: { select: { id: true, name: true } },
  creator: { select: { id: true, name: true } },
  links: { orderBy: { createdAt: "asc" as const } },
  tags: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
      taggedBy: { select: { name: true } },
    },
  },
  issueReports: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      description: true,
      createdAt: true,
      user: { select: { name: true } },
      evidenceName: true,
      evidenceMimeType: true,
      evidenceSize: true,
    },
  },
} satisfies Prisma.TaskInclude;

export function parseDate(value: unknown): Date | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return "invalid";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "invalid" : date;
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
