import { listHistory } from "@/lib/prompt-service";
import { getSessionIdFromRequest } from "@/lib/session";
import { touchSessionIdentity } from "@/lib/session-identity";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  sort: z.enum(["recent", "hot", "top"]).default("hot"),
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    sort: url.searchParams.get("sort") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Filtro invalido." }, { status: 400 });
  }

  const sessionId = getSessionIdFromRequest(request);
  if (sessionId) {
    await touchSessionIdentity(sessionId, request);
  }

  const items = await listHistory(parsed.data.sort, sessionId);

  return NextResponse.json({
    items,
    sort: parsed.data.sort,
  });
}
