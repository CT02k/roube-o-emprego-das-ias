import { forbiddenAdminResponse, isAdminAuthorized } from "@/lib/admin-auth";
import { publishPromptEvent } from "@/lib/realtime";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: Context) {
  if (!isAdminAuthorized(request)) {
    return forbiddenAdminResponse();
  }

  const { id } = await context.params;
  const prompt = await prisma.prompt.findUnique({ where: { id } });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt nao encontrado." }, { status: 404 });
  }

  if (prompt.status === "responded") {
    await prisma.promptResponse.deleteMany({
      where: { promptId: id },
    });
  }

  await prisma.prompt.update({
    where: { id },
    data: {
      status: "pending",
      claimedAt: null,
      claimedBySessionId: null,
    },
  });

  publishPromptEvent({
    type: "released",
    promptId: id,
    claimedBySessionId: null,
    requesterSessionId: prompt.requesterSessionId,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
