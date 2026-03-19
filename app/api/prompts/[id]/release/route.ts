import { releasePrompt } from "@/lib/prompt-service";
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
  const result = await releasePrompt(id, sessionId);
  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Prompt nao encontrado." }, { status: 404 });
  }
  if (result.kind === "responded") {
    return NextResponse.json({ error: "Prompt ja respondido." }, { status: 409 });
  }
  if (result.kind === "forbidden") {
    return NextResponse.json({ error: "Somente o claimer atual pode liberar." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
