import { prisma } from "@/lib/prisma";
import { getSessionIdFromRequest } from "@/lib/session";
import { touchSessionIdentity } from "@/lib/session-identity";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "x-session-id obrigatorio." }, { status: 400 });
  }

  await touchSessionIdentity(sessionId, request);
  const latest = await prisma.prompt.findFirst({
    where: {
      requesterSessionId: sessionId,
      status: "responded",
      response: {
        isNot: null,
      },
    },
    include: {
      response: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latest || !latest.response) {
    return NextResponse.json({ error: "Nenhuma resposta encontrada para compartilhar." }, { status: 404 });
  }

  return NextResponse.json({
    promptText: latest.text,
    responseType: latest.response.type,
    responseText: latest.response.text,
    responseImageDataUrl: latest.response.imageDataUrl,
    respondedAt: latest.response.createdAt.toISOString(),
  });
}
