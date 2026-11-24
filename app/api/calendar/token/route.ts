import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/api";

export async function GET() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const user = await prisma.user.findUnique({ where: { id: auth.user.id }, select: { calendarToken: true } });
  return NextResponse.json({ token: user?.calendarToken ?? null });
}

/** Buat / ganti token feed kalender pribadi (token lama tidak berlaku lagi). */
export async function POST() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const token = randomBytes(24).toString("hex");
  await prisma.user.update({ where: { id: auth.user.id }, data: { calendarToken: token } });
  return NextResponse.json({ token }, { status: 201 });
}

export async function DELETE() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  await prisma.user.update({ where: { id: auth.user.id }, data: { calendarToken: null } });
  return NextResponse.json({ ok: true });
}
