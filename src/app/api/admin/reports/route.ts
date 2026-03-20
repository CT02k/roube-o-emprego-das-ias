import { forbiddenAdminResponse, isAdminAuthorized } from "@/lib/admin-auth";
import { listAdminReports } from "@/lib/report-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return forbiddenAdminResponse();
  }

  const status = request.nextUrl.searchParams.get("status");
  if (status && status !== "all" && status !== "open" && status !== "dismissed" && status !== "actioned") {
    return NextResponse.json({ error: "status inválido." }, { status: 400 });
  }

  return NextResponse.json({
    items: await listAdminReports((status as "all" | "open" | "dismissed" | "actioned" | null) ?? "all"),
  });
}
