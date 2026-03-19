import { CLAIM_TTL_MS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { releaseExpiredPromptClaims } from "@/lib/prompt-maintenance";
import { publishPromptEvent } from "@/lib/realtime";
import { isClaimExpired, toPromptDetail, toPromptListItem } from "@/lib/prompt-mappers";
import type {
  CreatePromptInput,
  HistoryDetail,
  HistoryListItem,
  HistorySort,
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

const toHistoryItem = (
  response: {
    id: string;
    type: "text" | "image";
    text: string | null;
    imageDataUrl: string | null;
    responderSessionId: string;
    upvotesCount: number;
    createdAt: Date;
    prompt: {
      id: string;
      text: string;
    };
    votes: Array<{
      id: string;
    }>;
  }
): HistoryListItem => ({
  id: response.id,
  promptId: response.prompt.id,
  promptText: response.prompt.text,
  response: {
    id: response.id,
    type: response.type,
    text: response.text ?? undefined,
    imageDataUrl: response.imageDataUrl ?? undefined,
    responderSessionId: response.responderSessionId,
    createdAt: response.createdAt.toISOString(),
  },
  createdAt: response.createdAt.toISOString(),
  upvotesCount: response.upvotesCount,
  viewerHasUpvoted: response.votes.length > 0,
});

export const listHistory = async (
  sort: HistorySort = "hot",
  sessionId?: string | null
): Promise<HistoryListItem[]> => {
  if (sort === "hot") {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const voteGroups = await prisma.promptResponseVote.groupBy({
      by: ["responseId"],
      where: {
        createdAt: {
          gte: since,
        },
      },
      _count: {
        responseId: true,
      },
      orderBy: {
        _count: {
          responseId: "desc",
        },
      },
      take: 100,
    });

    const responses = await prisma.promptResponse.findMany({
      include: {
        prompt: {
          select: {
            id: true,
            text: true,
          },
        },
        votes: {
          where: {
            sessionId: sessionId ?? "__anonymous__",
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    });

    const hotScoreByResponseId = new Map(
      voteGroups.map((group) => [group.responseId, group._count.responseId])
    );

    const sortedResponses = [...responses].sort((left, right) => {
      const leftScore = hotScoreByResponseId.get(left.id) ?? 0;
      const rightScore = hotScoreByResponseId.get(right.id) ?? 0;

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return right.createdAt.getTime() - left.createdAt.getTime();
    });

    const responsesById = new Map(responses.map((response) => [response.id, response]));
    void responsesById;

    return sortedResponses.map(toHistoryItem);
  }

  const responses = await prisma.promptResponse.findMany({
    include: {
      prompt: {
        select: {
          id: true,
          text: true,
        },
      },
      votes: {
        where: {
          sessionId: sessionId ?? "__anonymous__",
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
    orderBy:
      sort === "top"
        ? [{ upvotesCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
    take: 100,
  });

  return responses.map(toHistoryItem);
};

export const getHistoryDetail = async (
  responseId: string,
  sessionId?: string | null
): Promise<HistoryDetail | null> => {
  const response = await prisma.promptResponse.findUnique({
    where: {
      id: responseId,
    },
    include: {
      prompt: {
        select: {
          id: true,
          text: true,
        },
      },
      votes: {
        where: {
          sessionId: sessionId ?? "__anonymous__",
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!response) {
    return null;
  }

  return toHistoryItem(response);
};

export const addHistoryUpvote = async (responseId: string, sessionId: string) => {
  return prisma.$transaction(async (tx) => {
    const response = await tx.promptResponse.findUnique({
      where: {
        id: responseId,
      },
    });

    if (!response) {
      return { kind: "not_found" as const };
    }

    const existingVote = await tx.promptResponseVote.findUnique({
      where: {
        responseId_sessionId: {
          responseId,
          sessionId,
        },
      },
    });

    if (existingVote) {
      return { kind: "ok" as const, upvotesCount: response.upvotesCount };
    }

    const updated = await tx.promptResponse.update({
      where: {
        id: responseId,
      },
      data: {
        upvotesCount: {
          increment: 1,
        },
        votes: {
          create: {
            sessionId,
          },
        },
      },
      select: {
        upvotesCount: true,
      },
    });

    return { kind: "ok" as const, upvotesCount: updated.upvotesCount };
  });
};

export const removeHistoryUpvote = async (responseId: string, sessionId: string) => {
  return prisma.$transaction(async (tx) => {
    const existingVote = await tx.promptResponseVote.findUnique({
      where: {
        responseId_sessionId: {
          responseId,
          sessionId,
        },
      },
      include: {
        response: {
          select: {
            upvotesCount: true,
          },
        },
      },
    });

    if (!existingVote) {
      const response = await tx.promptResponse.findUnique({
        where: {
          id: responseId,
        },
        select: {
          upvotesCount: true,
        },
      });

      if (!response) {
        return { kind: "not_found" as const };
      }

      return { kind: "ok" as const, upvotesCount: response.upvotesCount };
    }

    const updated = await tx.promptResponse.update({
      where: {
        id: responseId,
      },
      data: {
        upvotesCount: {
          decrement: existingVote.response.upvotesCount > 0 ? 1 : 0,
        },
      },
      select: {
        upvotesCount: true,
      },
    });

    await tx.promptResponseVote.delete({
      where: {
        responseId_sessionId: {
          responseId,
          sessionId,
        },
      },
    });

    return { kind: "ok" as const, upvotesCount: updated.upvotesCount };
  });
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
