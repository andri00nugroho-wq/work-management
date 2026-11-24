import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, readJson, parseDate } from "@/lib/api";
import { getCurrentUser } from "@/lib/current-user";
import { clientIp, rateLimited } from "@/lib/intake";
import { notify } from "@/lib/notify";
import { dispatchWebhooks } from "@/lib/webhooks";

type Ctx = { params: Promise<{ slug: string }> };

/** Kirim permintaan kerja -> menjadi tugas. Formulir internal butuh login. */
export async function POST(request: Request, { params }: Ctx) {
  const { slug } = await params;
  const form = await prisma.intakeForm.findFirst({
    where: { slug, isActive: true },
    select: { id: true, name: true, isPublic: true, projectId: true, assigneeId: true, defaultPriority: true, createdById: true },
  });
  if (!form) return fail("Formulir tidak ditemukan atau sudah ditutup.", 404);

  const user = await getCurrentUser();
  if (!form.isPublic && !user) return fail("Silakan login untuk mengisi formulir internal ini.", 401);

  const body = await readJson(request);
  // Honeypot: bot mengisi kolom tersembunyi ini; pura-pura berhasil.
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true }, { status: 201 });
  if (!user && rateLimited(`${slug}:${clientIp(request)}`)) {
    return fail("Terlalu banyak permintaan. Coba lagi dalam beberapa menit.", 429);
  }

  const name = (user?.name ?? (typeof body.name === "string" ? body.name.trim() : "")).slice(0, 120);
  const email = (user?.email ?? (typeof body.email === "string" ? body.email.trim().toLowerCase() : "")).slice(0, 160);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const details = typeof body.details === "string" ? body.details.trim() : "";
  const due = parseDate(body.dueDate);
  if (!name) return fail("Nama wajib diisi.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Email tidak valid.");
  if (!title || title.length > 180) return fail("Judul permintaan wajib diisi (maksimal 180 karakter).");
  if (details.length > 5000) return fail("Rincian maksimal 5000 karakter.");
  if (due === "invalid") return fail("Tanggal yang diharapkan tidak valid.");

  const assigneeId = form.assigneeId ?? form.createdById;
  const assignee = await prisma.user.findFirst({ where: { id: assigneeId, isActive: true }, select: { id: true, divisionId: true } });
  const task = await prisma.task.create({
    data: {
      title,
      description: `${details || "(tanpa rincian)"}\n\n— Dikirim lewat formulir "${form.name}" oleh ${name} <${email}>`,
      priority: form.defaultPriority,
      dueDate: due,
      projectId: form.projectId,
      assigneeId: assignee?.id ?? null,
      divisionId: assignee?.divisionId ?? null,
      creatorId: form.createdById,
      intakeFormId: form.id,
      requesterName: name,
      requesterEmail: email,
      ...(assignee ? { assignments: { create: { userId: assignee.id } } } : {}),
      activities: {
        create: { userId: form.createdById, message: `Permintaan baru "${title}" masuk lewat formulir "${form.name}" dari ${name}` },
      },
    },
    select: { id: true },
  });

  await notify([assignee?.id, form.createdById], {
    type: "REQUEST",
    title: `Permintaan baru: ${title}`,
    body: `Dari ${name} lewat formulir "${form.name}".`,
    taskId: task.id,
    actorId: user?.id ?? null,
  });
  void dispatchWebhooks(
    "request.submitted",
    { taskId: task.id, title, form: form.name, requester: { name, email } },
    `📥 Permintaan baru lewat "${form.name}": *${title}* dari ${name}`
  );
  return NextResponse.json({ ok: true, taskId: task.id }, { status: 201 });
}
