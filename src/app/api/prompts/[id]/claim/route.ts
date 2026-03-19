import { claimPrompt } from "@/lib/prompt-service";
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
  const result = await claimPrompt(id, sessionId);

  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Prompt nao encontrado." }, { status: 404 });
  }

  if (result.kind === "invalid_state") {
    return NextResponse.json({ error: "Prompt ja respondido." }, { status: 409 });
  }

  if (result.kind === "conflict") {
    return NextResponse.json({ error: "Prompt ja reservado." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
