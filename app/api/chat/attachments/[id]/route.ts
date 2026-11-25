import { prisma } from "@/lib/prisma";
import { authorize, fail, STAFF_ROLES } from "@/lib/api";
import { readChatFile } from "@/lib/chat-files";

type Ctx = { params: Promise<{ id: string }> };

const INLINE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await authorize(STAFF_ROLES);
  if ("response" in auth) return auth.response;
  const { id } = await params;

  let attachment: {
    key: string;
    name: string;
    mimeType: string;
  } | null;
  try {
    attachment = await prisma.chatAttachment.findFirst({
      where: {
        id,
        message: {
          conversation: {
            members: { some: { userId: auth.user.id } },
          },
        },
      },
      select: { key: true, name: true, mimeType: true },
    });
  } catch (error) {
    console.error("GET /api/chat/attachments/[id] metadata", error);
    return fail("Berkas gagal dibuka.", 500);
  }
  if (!attachment) return fail("Berkas tidak ditemukan.", 404);

  try {
    const bytes = await readChatFile(attachment.key);
    const mimeType = /^[\w.+-]+\/[\w.+-]+$/.test(attachment.mimeType)
      ? attachment.mimeType
      : "application/octet-stream";
    const disposition = INLINE_IMAGE_TYPES.has(mimeType) ? "inline" : "attachment";

    const asciiName = attachment.name
      .replace(/[^\x20-\x7e]/g, "_")
      .replace(/["\\]/g, "_");
    const encodedName = encodeURIComponent(attachment.name).replace(
      /[!'()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    );

    return new Response(
      new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength),
      {
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(bytes.length),
          "Content-Disposition": `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "sandbox",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/chat/attachments/[id]", error);
    return fail("Berkas gagal dibuka.", 404);
  }
}
