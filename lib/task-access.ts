import { prisma } from "@/lib/prisma";
import { MANAGE_ROLES, taskScope } from "@/lib/api";
import type { SessionUser } from "@/lib/current-user";

/** Tugas dalam cakupan pengguna, beserta data kepemilikan untuk cek izin. */
export async function loadTaskForUser(taskId: string, user: SessionUser) {
  return prisma.task.findFirst({
    where: { AND: [{ id: taskId }, taskScope(user)] },
    select: {
      id: true,
      title: true,
      status: true,
      assigneeId: true,
      creatorId: true,
      assignments: { select: { userId: true } },
    },
  });
}

export type AccessibleTask = NonNullable<Awaited<ReturnType<typeof loadTaskForUser>>>;

/** Manajer, pembuat, penanggung jawab, atau anggota pelaksana. Tamu tidak pernah. */
export function canManageTask(task: AccessibleTask, user: SessionUser) {
  if (user.role === "GUEST") return false;
  return (
    MANAGE_ROLES.includes(user.role) ||
    task.assigneeId === user.id ||
    task.creatorId === user.id ||
    task.assignments.some((assignment) => assignment.userId === user.id)
  );
}

/** Bentuk SessionUser dari id pengguna (untuk mengecek cakupan orang lain). */
export async function sessionUserById(userId: string): Promise<SessionUser | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      divisionId: true,
      supervisedDivision: { select: { id: true } },
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    divisionId: user.divisionId,
    supervisedDivisionId: user.supervisedDivision?.id ?? null,
  };
}

/** Id pengguna (dari daftar) yang sudah bisa melihat tugas ini. */
export async function usersWhoCanSeeTask(taskId: string, userIds: string[]) {
  const visible: string[] = [];
  for (const userId of userIds) {
    const user = await sessionUserById(userId);
    if (!user) continue;
    const found = await prisma.task.count({ where: { AND: [{ id: taskId }, taskScope(user)] } });
    if (found) visible.push(userId);
  }
  return visible;
}
