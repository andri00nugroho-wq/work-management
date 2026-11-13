import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, taskScope } from "@/lib/api";
import {
  MAX_TASK_EVIDENCE_BYTES,
  removeTaskEvidence,
  saveTaskEvidence,
  TaskEvidenceError,
  type StoredTaskEvidence,
} from "@/lib/task-evidence";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  let task: { id: string; title: string } | null;
  try {
    task = await prisma.task.findFirst({
      where: { AND: [{ id }, taskScope(auth.user)] },
      select: { id: true, title: true },
    });
  } catch (error) {
    console.error("POST /api/tasks/[id]/issues task access", error);
    return fail("Laporan kendala gagal disimpan.", 500);
  }
  if (!task) return fail("Tugas tidak ditemukan.", 404);

  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_TASK_EVIDENCE_BYTES + 64 * 1024
  ) {
    return fail("Ukuran file bukti maksimal 10 MB.", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error("POST /api/tasks/[id]/issues form data", error);
    return fail("Form laporan kendala tidak valid.");
  }

  const descriptionValue = formData.get("description");
  const description =
    typeof descriptionValue === "string" ? descriptionValue.trim() : "";
  if (!description) return fail("Deskripsi kendala wajib diisi.");
  if (description.length > 5000) return fail("Deskripsi kendala maksimal 5000 karakter.");

  const evidenceEntries = formData.getAll("evidence");
  if (evidenceEntries.length > 1) return fail("Unggah satu file bukti untuk setiap laporan.");
  const evidenceValue = evidenceEntries[0];
  if (typeof evidenceValue === "string") return fail("File bukti tidak valid.");
  if (evidenceValue && evidenceValue.size > MAX_TASK_EVIDENCE_BYTES) {
    return fail("Ukuran file bukti maksimal 10 MB.", 413);
  }

  let storedEvidence: StoredTaskEvidence | null = null;
  try {
    if (evidenceValue) storedEvidence = await saveTaskEvidence(evidenceValue);

    const issueReport = await prisma.$transaction(async (transaction) => {
      const report = await transaction.taskIssueReport.create({
        data: {
          description,
          taskId: task.id,
          userId: auth.user.id,
          evidenceKey: storedEvidence?.key,
          evidenceName: storedEvidence?.name,
          evidenceMimeType: storedEvidence?.mimeType,
          evidenceSize: storedEvidence?.size,
        },
        select: {
          id: true,
          description: true,
          createdAt: true,
          user: { select: { name: true } },
          evidenceName: true,
          evidenceMimeType: true,
          evidenceSize: true,
        },
      });

      await transaction.activity.create({
        data: {
          userId: auth.user.id,
          taskId: task.id,
          message: `${auth.user.name} melaporkan kendala pada tugas "${task.title}"`,
        },
      });
      return report;
    });

    return NextResponse.json({ issueReport }, { status: 201 });
  } catch (error) {
    if (storedEvidence) {
      try {
        await removeTaskEvidence(storedEvidence.key);
      } catch (cleanupError) {
        console.error("POST /api/tasks/[id]/issues evidence cleanup", cleanupError);
      }
    }

    if (error instanceof TaskEvidenceError) return fail(error.message);
    console.error("POST /api/tasks/[id]/issues", error);
    return fail("Laporan kendala gagal disimpan.", 500);
  }
}
