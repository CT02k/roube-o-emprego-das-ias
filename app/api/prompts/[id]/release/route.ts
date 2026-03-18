import { prisma } from "@/lib/prisma";
import { publishPromptEvent } from "@/lib/realtime";
import { getSessionIdFromRequest } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: Context) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "x-session-id obrigatorio." }, { status: 400 });
  }

  const { id } = await context.params;
  const prompt = await prisma.prompt.findUnique({ where: { id } });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt nao encontrado." }, { status: 404 });
  }

  if (prompt.status === "responded") {
    return NextResponse.json({ error: "Prompt ja respondido." }, { status: 409 });
  }

  if (prompt.claimedBySessionId !== sessionId) {
    return NextResponse.json({ error: "Somente o claimer atual pode liberar." }, { status: 403 });
  }

  await prisma.prompt.update({
    where: { id },
    data: {
      status: "pending",
      claimedAt: null,
      claimedBySessionId: null,
    },
  });

  publishPromptEvent({
    type: "released",
    promptId: id,
    claimedBySessionId: null,
    requesterSessionId: prompt.requesterSessionId,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
