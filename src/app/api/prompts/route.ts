import { getSessionIdFromRequest } from "@/lib/session";
import { touchSessionIdentity } from "@/lib/session-identity";
import { createPromptSchema } from "@/lib/validation";
import { createPrompt, listPromptsForView } from "@/lib/prompt-service";
import { NextRequest, NextResponse } from "next/server";

const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

export async function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get("view");
  if (view !== "requester" && view !== "worker") {
    return badRequest("view deve ser requester ou worker.");
  }

  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return badRequest("x-session-id obrigatorio.");
  }

  await touchSessionIdentity(sessionId, request);
  return NextResponse.json(await listPromptsForView(sessionId, view));
}

export async function POST(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return badRequest("x-session-id obrigatorio.");
  }

  await touchSessionIdentity(sessionId, request);
  const payload = await request.json().catch(() => null);
  const parsed = createPromptSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Body invalido.");
  }

  const prompt = await createPrompt(sessionId, parsed.data);

  return NextResponse.json(
    {
      id: prompt.id,
      status: prompt.status,
      createdAt: prompt.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
