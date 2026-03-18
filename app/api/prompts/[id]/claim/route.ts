import { isClaimExpired } from "@/lib/prompt-helpers";
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
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const prompt = await tx.prompt.findUnique({ where: { id } });
    if (!prompt) {
      return { kind: "not_found" as const };
    }

    if (prompt.status === "responded") {
      return { kind: "invalid_state" as const };
    }

    const expired = isClaimExpired(prompt.claimedAt, now);
    const alreadyClaimedBySame =
      prompt.status === "in_progress" &&
      prompt.claimedBySessionId === sessionId &&
      !expired;

    if (alreadyClaimedBySame) {
      return { kind: "ok" as const };
    }

    if (prompt.status === "in_progress" && !expired) {
      return { kind: "conflict" as const };
    }

    await tx.prompt.update({
      where: { id },
      data: {
        status: "in_progress",
        claimedBySessionId: sessionId,
        claimedAt: now,
      },
    });

    return { kind: "ok" as const };
  });

  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Prompt nao encontrado." }, { status: 404 });
  }

  if (result.kind === "invalid_state") {
    return NextResponse.json({ error: "Prompt ja respondido." }, { status: 409 });
  }

  if (result.kind === "conflict") {
    return NextResponse.json({ error: "Prompt ja reservado." }, { status: 409 });
  }

  publishPromptEvent({
    type: "claimed",
    promptId: id,
    claimedBySessionId: sessionId,
    createdAt: now.toISOString(),
  });

  return NextResponse.json({ ok: true });
}
