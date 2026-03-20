import { getRequesterThread } from "@/lib/prompt-service";
import { getSessionIdFromRequest } from "@/lib/session";
import { touchSessionIdentity } from "@/lib/session-identity";
import { NextRequest, NextResponse } from "next/server";

const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

export async function GET(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return badRequest("x-session-id obrigatorio.");
  }

  await touchSessionIdentity(sessionId, request);
  return NextResponse.json({
    items: await getRequesterThread(sessionId),
  });
}
