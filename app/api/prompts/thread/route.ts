import { releaseExpiredPromptClaims } from "@/lib/prompt-maintenance";
import { toPromptDetail } from "@/lib/prompt-helpers";
import { prisma } from "@/lib/prisma";
import { getSessionIdFromRequest } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

export async function GET(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return badRequest("x-session-id obrigatorio.");
  }

  await releaseExpiredPromptClaims();

  const prompts = await prisma.prompt.findMany({
    where: {
      requesterSessionId: sessionId,
    },
    include: {
      response: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 100,
  });

  return NextResponse.json({
    items: prompts.map(toPromptDetail),
  });
}
