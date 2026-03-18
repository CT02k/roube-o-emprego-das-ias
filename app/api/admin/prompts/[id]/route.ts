import { forbiddenAdminResponse, isAdminAuthorized } from "@/lib/admin-auth";
import { toPromptDetail } from "@/lib/prompt-helpers";
import { publishPromptEvent } from "@/lib/realtime";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  if (!isAdminAuthorized(request)) {
    return forbiddenAdminResponse();
  }

  const { id } = await context.params;
  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: { response: true },
  });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    ...toPromptDetail(prompt),
    updatedAt: prompt.updatedAt.toISOString(),
    requesterSessionId: prompt.requesterSessionId,
    claimedBySessionId: prompt.claimedBySessionId ?? undefined,
    claimedAt: prompt.claimedAt?.toISOString(),
    responderSessionId: prompt.response?.responderSessionId ?? undefined,
    respondedAt: prompt.response?.createdAt.toISOString(),
  });
}

export async function DELETE(request: NextRequest, context: Context) {
  if (!isAdminAuthorized(request)) {
    return forbiddenAdminResponse();
  }

  const { id } = await context.params;
  const prompt = await prisma.prompt.findUnique({ where: { id } });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt nao encontrado." }, { status: 404 });
  }

  await prisma.prompt.delete({ where: { id } });

  publishPromptEvent({
    type: "released",
    promptId: id,
    claimedBySessionId: null,
    requesterSessionId: prompt.requesterSessionId,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
