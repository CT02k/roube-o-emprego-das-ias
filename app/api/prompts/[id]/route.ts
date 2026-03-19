import { getPromptDetailForSession } from "@/lib/prompt-service";
import { getSessionIdFromRequest } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "x-session-id obrigatorio." }, { status: 400 });
  }

  const { id } = await context.params;

  const result = await getPromptDetailForSession(id, sessionId);
  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Prompt nao encontrado." }, { status: 404 });
  }
  if (result.kind === "forbidden") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  return NextResponse.json(result.detail);
}
