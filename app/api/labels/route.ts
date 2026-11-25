import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, fail, readJson, MANAGE_ROLES } from "@/lib/api";
import { parseLabelInput } from "@/lib/labels";

export async function GET() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;

  const labels = await prisma.label.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, _count: { select: { tasks: true } } },
  });
  return NextResponse.json({ labels });
}

export async function POST(request: Request) {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;

  const input = parseLabelInput(await readJson(request));
  if ("error" in input) return fail(input.error);

  const exists = await prisma.label.findFirst({
    where: { name: { equals: input.name, mode: "insensitive" } },
    select: { id: true },
  });
  if (exists) return fail("Label dengan nama itu sudah ada.", 409);

  const label = await prisma.label.create({
    data: input,
    select: { id: true, name: true, color: true },
  });
  return NextResponse.json({ label }, { status: 201 });
}
