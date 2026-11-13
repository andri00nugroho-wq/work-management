import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  try {
    const now = new Date();
    const result = await prisma.conversationMember.updateMany({
      where: { conversationId: id, userId: auth.user.id },
      data: { lastReadAt: now },
    });
    if (result.count === 0) return fail("Percakapan tidak ditemukan.", 404);
    return NextResponse.json({ ok: true, lastReadAt: now.toISOString() });
  } catch (error) {
    console.error("POST /api/chat/conversations/[id]/read", error);
    return fail("Status baca gagal disimpan.", 500);
  }
}
