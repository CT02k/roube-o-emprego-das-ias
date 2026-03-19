import { getHistoryDetail } from "@/lib/prompt-service";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const item = await getHistoryDetail(id);

  if (!item) {
    return NextResponse.json({ error: "Resposta nao encontrada." }, { status: 404 });
  }

  return NextResponse.json(item);
}
