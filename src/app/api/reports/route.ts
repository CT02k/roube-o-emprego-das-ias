import { createReport } from "@/lib/report-service";
import { getSessionIdFromRequest } from "@/lib/session";
import { touchSessionIdentity } from "@/lib/session-identity";
import { createReportSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

export async function POST(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return badRequest("x-session-id obrigatório.");
  }

  await touchSessionIdentity(sessionId, request);

  const payload = await request.json().catch(() => null);
  const parsed = createReportSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Body inválido.");
  }

  const result = await createReport(sessionId, parsed.data);
  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    reportId: result.report.id,
    status: result.report.status,
  });
}
