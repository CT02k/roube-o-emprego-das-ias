import { listHistory } from "@/lib/prompt-service";
import { NextResponse } from "next/server";

export async function GET() {
  const items = await listHistory();

  return NextResponse.json({
    items,
  });
}
