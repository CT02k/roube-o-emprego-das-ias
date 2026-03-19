import { addHistoryUpvote, getHistoryDetail, removeHistoryUpvote } from "@/lib/prompt-service";
import { getSessionIdFromRequest } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const sessionId = getSessionIdFromRequest(request);
  const item = await getHistoryDetail(id, sessionId);

  if (!item) {
    return NextResponse.json({ error: "Resposta nao encontrada." }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "x-session-id obrigatorio." }, { status: 400 });
  }

  const { id } = await context.params;
  const result = await addHistoryUpvote(id, sessionId);

  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Resposta nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    upvotesCount: result.upvotesCount,
    viewerHasUpvoted: true,
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "x-session-id obrigatorio." }, { status: 400 });
  }

  const { id } = await context.params;
  const result = await removeHistoryUpvote(id, sessionId);

  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Resposta nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    upvotesCount: result.upvotesCount,
    viewerHasUpvoted: false,
  });
}
