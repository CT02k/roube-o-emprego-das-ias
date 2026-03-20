import { respondToPrompt } from "@/lib/prompt-service";
import { getSessionIdFromRequest } from "@/lib/session";
import { touchSessionIdentity } from "@/lib/session-identity";
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

  await touchSessionIdentity(sessionId, request);
  const payload = await request.json().catch(() => null);
  const parsed = submitResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Body invalido." },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const result = await respondToPrompt(id, sessionId, parsed.data);

  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Prompt nao encontrado." }, { status: 404 });
  }

  if (result.kind === "immutable") {
    return NextResponse.json({ error: "Prompt ja respondido." }, { status: 409 });
  }

  if (result.kind === "forbidden") {
    return NextResponse.json({ error: "Apenas o claimer atual pode responder." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
