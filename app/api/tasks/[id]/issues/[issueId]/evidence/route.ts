import { prisma } from "@/lib/prisma";
import { authorize, fail, taskScope } from "@/lib/api";
import { readTaskEvidence } from "@/lib/task-evidence";

type Ctx = { params: Promise<{ id: string; issueId: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id, issueId } = await params;

  let task: { id: string } | null;
  try {
    task = await prisma.task.findFirst({
      where: { AND: [{ id }, taskScope(auth.user)] },
      select: { id: true },
    });
  } catch (error) {
    console.error("GET /api/tasks/[id]/issues/[issueId]/evidence task access", error);
    return fail("Bukti kendala gagal dibuka.", 500);
  }
  if (!task) return fail("Tugas tidak ditemukan.", 404);

  let report: {
    evidenceKey: string | null;
    evidenceName: string | null;
    evidenceMimeType: string | null;
  } | null;
  try {
    report = await prisma.taskIssueReport.findFirst({
      where: { id: issueId, taskId: task.id },
      select: {
        evidenceKey: true,
        evidenceName: true,
        evidenceMimeType: true,
      },
    });
  } catch (error) {
    console.error("GET /api/tasks/[id]/issues/[issueId]/evidence metadata", error);
    return fail("Bukti kendala gagal dibuka.", 500);
  }
  if (!report?.evidenceKey || !report.evidenceName || !report.evidenceMimeType) {
    return fail("Bukti kendala tidak ditemukan.", 404);
  }

  try {
    const bytes = await readTaskEvidence(report.evidenceKey);
    const asciiName = report.evidenceName
      .replace(/[^\x20-\x7e]/g, "_")
      .replace(/["\\]/g, "_");
    const encodedName = encodeURIComponent(report.evidenceName).replace(
      /[!'()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    );

    return new Response(
      new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength),
      {
        headers: {
          "Content-Type": report.evidenceMimeType,
          "Content-Length": String(bytes.length),
          "Content-Disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/tasks/[id]/issues/[issueId]/evidence", error);
    return fail("Bukti kendala gagal dibuka.", 404);
  }
}
