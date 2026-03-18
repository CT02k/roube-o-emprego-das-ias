import { createAdminToken, isAdminCodeValid } from "@/lib/admin-auth";
import { getSessionIdFromRequest } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "x-session-id obrigatorio." }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const code = typeof payload?.code === "string" ? payload.code.trim() : "";

  if (!code) {
    return NextResponse.json({ error: "Codigo admin obrigatorio." }, { status: 400 });
  }

  if (!isAdminCodeValid(code)) {
    return NextResponse.json({ error: "Codigo admin invalido." }, { status: 403 });
  }

  const token = createAdminToken(sessionId);
  return NextResponse.json({ token });
}
