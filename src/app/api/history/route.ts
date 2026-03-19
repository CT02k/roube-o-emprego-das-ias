import { listHistory } from "@/lib/prompt-service";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  sort: z.enum(["recent", "top"]).default("recent"),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    sort: url.searchParams.get("sort") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Filtro invalido." }, { status: 400 });
  }

  const sessionId =
    request instanceof Request && "headers" in request
      ? request.headers.get("x-session-id")
      : null;
  const items = await listHistory(parsed.data.sort, sessionId);

  return NextResponse.json({
    items,
    sort: parsed.data.sort,
  });
}
