import { forbiddenAdminResponse, isAdminAuthorized } from "@/lib/admin-auth";
import { toAdminPromptListItem } from "@/lib/prompt-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const validStatuses = new Set(["pending", "in_progress", "responded"]);

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return forbiddenAdminResponse();
  }

  const status = request.nextUrl.searchParams.get("status");
  if (status && !validStatuses.has(status)) {
    return NextResponse.json(
      { error: "status deve ser pending, in_progress ou responded." },
      { status: 400 }
    );
  }

  const prompts = await prisma.prompt.findMany({
    where: status ? { status: status as "pending" | "in_progress" | "responded" } : undefined,
    include: { response: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return NextResponse.json({
    items: prompts.map(toAdminPromptListItem),
  });
}
