/** Kolom divisi yang dikirim ke klien. */
export const DIVISION_SELECT = {
  id: true,
  name: true,
  description: true,
  supervisor: { select: { id: true, name: true } },
  _count: { select: { users: { where: { isActive: true } }, tasks: true } },
} as const;
