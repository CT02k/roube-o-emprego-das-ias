import { forbiddenAdminResponse, isAdminAuthorized } from "@/lib/admin-auth";
import { reviewReport } from "@/lib/report-service";
import { getSessionIdFromRequest } from "@/lib/session";
import { reviewReportSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  if (!isAdminAuthorized(request)) {
    return forbiddenAdminResponse();
  }

  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "x-session-id obrigatório." }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = reviewReportSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Body inválido." },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const result = await reviewReport(id, sessionId, parsed.data.status);

  if (result.kind === "not_found") {
    return NextResponse.json({ error: "Denúncia não encontrada." }, { status: 404 });
  }

  return NextResponse.json(result.report);
}
