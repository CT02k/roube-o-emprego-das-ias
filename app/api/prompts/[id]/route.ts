import { isClaimExpired, toPromptDetail } from "@/lib/prompt-helpers";
import { getSessionIdFromRequest } from "@/lib/session";
import { prisma } from "@/lib/prisma";
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

  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: { response: true },
  });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt nao encontrado." }, { status: 404 });
  }

  const requesterAccess = prompt.requesterSessionId === sessionId;
  const workerAccess =
    prompt.claimedBySessionId === sessionId &&
    prompt.status === "in_progress" &&
    !isClaimExpired(prompt.claimedAt);
  const responderAccess = prompt.response?.responderSessionId === sessionId;

  if (!requesterAccess && !workerAccess && !responderAccess) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  return NextResponse.json(toPromptDetail(prompt));
}
