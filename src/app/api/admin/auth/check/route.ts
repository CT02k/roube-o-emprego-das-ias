import { isAdminAuthorized } from "@/lib/admin-auth";
import { getSessionIdFromRequest } from "@/lib/session";
import { touchSessionIdentity } from "@/lib/session-identity";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const sessionId = getSessionIdFromRequest(request);
  if (sessionId) {
    await touchSessionIdentity(sessionId, request);
  }

  return NextResponse.json({ ok: true });
}
