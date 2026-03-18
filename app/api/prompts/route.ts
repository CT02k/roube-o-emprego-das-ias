import { prisma } from "@/lib/prisma";
import { getSessionIdFromRequest } from "@/lib/session";
import { createPromptSchema } from "@/lib/validation";
import { toPromptListItem } from "@/lib/prompt-helpers";
import { CLAIM_TTL_MS } from "@/lib/constants";
import { publishPromptEvent } from "@/lib/realtime";
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

  const now = new Date();
  const prompts =
    view === "requester"
      ? await prisma.prompt.findMany({
          where: {
            requesterSessionId: sessionId,
          },
          include: { response: true },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : await prisma.prompt.findMany({
          where: {
            OR: [
              { status: "pending" },
              {
                status: "in_progress",
                claimedBySessionId: sessionId,
                claimedAt: {
                  gte: new Date(now.getTime() - CLAIM_TTL_MS),
                },
              },
            ],
          },
          include: { response: true },
          orderBy: { createdAt: "asc" },
          take: 100,
        });

  return NextResponse.json({
    items: prompts.map(toPromptListItem),
    now: now.toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return badRequest("x-session-id obrigatorio.");
  }

  const payload = await request.json().catch(() => null);
  const parsed = createPromptSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Body invalido.");
  }

  const prompt = await prisma.prompt.create({
    data: {
      text: parsed.data.text,
      requesterSessionId: sessionId,
    },
  });

  publishPromptEvent({
    type: "created",
    promptId: prompt.id,
    requesterSessionId: sessionId,
    claimedBySessionId: null,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      id: prompt.id,
      status: prompt.status,
      createdAt: prompt.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
