import { CLAIM_TTL_MS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { releaseExpiredPromptClaims } from "@/lib/prompt-maintenance";
import { publishPromptEvent } from "@/lib/realtime";
import { isClaimExpired, toPromptDetail, toPromptListItem } from "@/lib/prompt-mappers";
import type {
  CreatePromptInput,
  PromptDetail,
  PromptListItem,
  SubmitResponseInput,
} from "@/lib/types";

export const listPromptsForView = async (
  sessionId: string,
  view: "requester" | "worker"
): Promise<{ items: PromptListItem[]; now: string }> => {
  const now = new Date();
  await releaseExpiredPromptClaims(now);

  const prompts =
    view === "requester"
      ? await prisma.prompt.findMany({
          where: {
            requesterSessionId: sessionId,
            status: {
              in: ["pending", "in_progress"],
            },
          },
          include: { response: true },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : await prisma.prompt.findMany({
          where: {
            OR: [
              { status: "pending" },
              {
                status: "in_progress",
                claimedBySessionId: sessionId,
                claimedAt: {
                  gte: new Date(now.getTime() - CLAIM_TTL_MS),
                },
              },
            ],
          },
          include: { response: true },
          orderBy: { createdAt: "asc" },
          take: 100,
        });

  return {
    items: prompts.map(toPromptListItem),
    now: now.toISOString(),
  };
};

export const getRequesterThread = async (sessionId: string): Promise<PromptDetail[]> => {
  await releaseExpiredPromptClaims();

  const prompts = await prisma.prompt.findMany({
    where: {
      requesterSessionId: sessionId,
    },
    include: {
      response: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 100,
  });

  return prompts.map(toPromptDetail);
};

export const createPrompt = async (sessionId: string, payload: CreatePromptInput) => {
  const prompt = await prisma.prompt.create({
    data: {
      text: payload.text,
      requesterSessionId: sessionId,
    },
  });

  publishPromptEvent({
    type: "created",
    promptId: prompt.id,
    requesterSessionId: sessionId,
    claimedBySessionId: null,
    createdAt: new Date().toISOString(),
  });

  return prompt;
};

export const getPromptDetailForSession = async (id: string, sessionId: string) => {
  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: { response: true },
  });

  if (!prompt) {
    return { kind: "not_found" as const };
  }

  const requesterAccess = prompt.requesterSessionId === sessionId;
  const workerAccess =
    prompt.claimedBySessionId === sessionId &&
    prompt.status === "in_progress" &&
    !isClaimExpired(prompt.claimedAt);
  const responderAccess = prompt.response?.responderSessionId === sessionId;

  if (!requesterAccess && !workerAccess && !responderAccess) {
    return { kind: "forbidden" as const };
  }

  return {
    kind: "ok" as const,
    detail: toPromptDetail(prompt),
  };
};

export const claimPrompt = async (id: string, sessionId: string) => {
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const prompt = await tx.prompt.findUnique({ where: { id } });
    if (!prompt) {
      return { kind: "not_found" as const };
    }

    if (prompt.status === "responded") {
      return { kind: "invalid_state" as const };
    }

    const expired = isClaimExpired(prompt.claimedAt, now);
    const alreadyClaimedBySame =
      prompt.status === "in_progress" &&
      prompt.claimedBySessionId === sessionId &&
      !expired;

    if (alreadyClaimedBySame) {
      return { kind: "ok" as const };
    }

    if (prompt.status === "in_progress" && !expired) {
      return { kind: "conflict" as const };
    }

    await tx.prompt.update({
      where: { id },
      data: {
        status: "in_progress",
        claimedBySessionId: sessionId,
        claimedAt: now,
      },
    });

    return { kind: "ok" as const };
  });

  if (result.kind === "ok") {
    publishPromptEvent({
      type: "claimed",
      promptId: id,
      claimedBySessionId: sessionId,
      createdAt: now.toISOString(),
    });
  }

  return result;
};

export const releasePrompt = async (id: string, sessionId: string) => {
  const prompt = await prisma.prompt.findUnique({ where: { id } });

  if (!prompt) {
    return { kind: "not_found" as const };
  }

  if (prompt.status === "responded") {
    return { kind: "responded" as const };
  }

  if (prompt.claimedBySessionId !== sessionId) {
    return { kind: "forbidden" as const };
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

  return { kind: "ok" as const };
};

export const respondToPrompt = async (
  id: string,
  sessionId: string,
  payload: SubmitResponseInput
) => {
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const prompt = await tx.prompt.findUnique({
      where: { id },
      include: { response: true },
    });

    if (!prompt) {
      return { kind: "not_found" as const };
    }

    if (prompt.status === "responded" || prompt.response) {
      return { kind: "immutable" as const };
    }

    const isCurrentClaimer =
      prompt.claimedBySessionId === sessionId && !isClaimExpired(prompt.claimedAt, now);
    if (!isCurrentClaimer) {
      return { kind: "forbidden" as const };
    }

    await tx.promptResponse.create({
      data:
        payload.type === "text"
          ? {
              promptId: prompt.id,
              type: "text",
              text: payload.text,
              responderSessionId: sessionId,
            }
          : {
              promptId: prompt.id,
              type: "image",
              imageDataUrl: payload.imageDataUrl,
              responderSessionId: sessionId,
            },
    });

    await tx.prompt.update({
      where: { id: prompt.id },
      data: {
        status: "responded",
        claimedAt: null,
        claimedBySessionId: null,
      },
    });

    return { kind: "ok" as const };
  });

  if (result.kind === "ok") {
    publishPromptEvent({
      type: "responded",
      promptId: id,
      claimedBySessionId: null,
      createdAt: now.toISOString(),
    });
  }

  return result;
};
