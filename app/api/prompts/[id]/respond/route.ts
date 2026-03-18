import { isClaimExpired } from "@/lib/prompt-helpers";
import { prisma } from "@/lib/prisma";
import { publishPromptEvent } from "@/lib/realtime";
import { getSessionIdFromRequest } from "@/lib/session";
import { submitResponseSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: Context) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "x-session-id obrigatorio." }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = submitResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Body invalido." },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const prompt = await tx.prompt.findUnique({
      where: { id },
      include: { response: true },
    });

    if (!prompt) {
      return { kind: "not_found" as const };
    }

    if (prompt.status === "responded" || prompt.response) {
      return { kind: "immutable" as const };
    }

    const isCurrentClaimer =
      prompt.claimedBySessionId === sessionId && !isClaimExpired(prompt.claimedAt, now);
    if (!isCurrentClaimer) {
      return { kind: "forbidden" as const };
    }

    await tx.promptResponse.create({
      data:
        parsed.data.type === "text"
          ? {
              promptId: prompt.id,
              type: "text",
              text: parsed.data.text,
              responderSessionId: sessionId,
            }
          : {
              promptId: prompt.id,
              type: "image",
              imageDataUrl: parsed.data.imageDataUrl,
              responderSessionId: sessionId,
            },
    });

    await tx.prompt.update({
      where: { id: prompt.id },
      data: {
        status: "responded",
        claimedAt: null,
        claimedBySessionId: null,
      },
    });

    return { kind: "ok" as const };
  });

  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Prompt nao encontrado." }, { status: 404 });
  }

  if (result.kind === "immutable") {
    return NextResponse.json({ error: "Prompt ja respondido." }, { status: 409 });
  }

  if (result.kind === "forbidden") {
    return NextResponse.json({ error: "Apenas o claimer atual pode responder." }, { status: 403 });
  }

  publishPromptEvent({
    type: "responded",
    promptId: id,
    claimedBySessionId: null,
    createdAt: now.toISOString(),
  });

  return NextResponse.json({ ok: true });
}
