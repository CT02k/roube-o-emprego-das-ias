import { Prompt, PromptResponse } from "@/lib/generated/prisma/client";
import { CLAIM_TTL_MS } from "@/lib/constants";
import { PromptDetail, PromptListItem } from "@/lib/types";

type PromptWithOptionalResponse = Prompt & {
  response?: PromptResponse | null;
};

const PREVIEW_MAX = 88;

const toIso = (value: Date) => value.toISOString();

export const isClaimExpired = (claimedAt: Date | null, now = new Date()) => {
  if (!claimedAt) {
    return false;
  }
  return now.getTime() - claimedAt.getTime() > CLAIM_TTL_MS;
};

export const normalizeStatus = (prompt: Prompt): Prompt["status"] => {
  if (prompt.status !== "in_progress") {
    return prompt.status;
  }
  return isClaimExpired(prompt.claimedAt) ? "pending" : prompt.status;
};

const toTextPreview = (text: string) => {
  if (text.length <= PREVIEW_MAX) {
    return text;
  }

  return `${text.slice(0, PREVIEW_MAX - 1)}...`;
};

export const toPromptListItem = (prompt: PromptWithOptionalResponse): PromptListItem => {
  const normalizedStatus = normalizeStatus(prompt);

  return {
    id: prompt.id,
    textPreview: toTextPreview(prompt.text),
    status: normalizedStatus,
    createdAt: toIso(prompt.createdAt),
    claimedAt: prompt.claimedAt ? toIso(prompt.claimedAt) : undefined,
    respondedAt: prompt.response ? toIso(prompt.response.createdAt) : undefined,
    responseType: prompt.response?.type,
  };
};

export const toAdminPromptListItem = (prompt: PromptWithOptionalResponse): PromptListItem => {
  const base = toPromptListItem(prompt);

  return {
    ...base,
    updatedAt: toIso(prompt.updatedAt),
    requesterSessionId: prompt.requesterSessionId,
    claimedBySessionId: prompt.claimedBySessionId ?? undefined,
    responderSessionId: prompt.response?.responderSessionId ?? undefined,
  };
};

export const toPromptDetail = (prompt: PromptWithOptionalResponse): PromptDetail => {
  const normalizedStatus = normalizeStatus(prompt);
  const claimInfo =
    prompt.claimedBySessionId && prompt.claimedAt
      ? {
          claimedAt: toIso(prompt.claimedAt),
          claimedBySessionId: prompt.claimedBySessionId,
          expired: isClaimExpired(prompt.claimedAt),
        }
      : undefined;

  const response = prompt.response
    ? {
        id: prompt.response.id,
        type: prompt.response.type,
        text: prompt.response.text ?? undefined,
        imageDataUrl: prompt.response.imageDataUrl ?? undefined,
        responderSessionId: prompt.response.responderSessionId,
        createdAt: toIso(prompt.response.createdAt),
      }
    : undefined;

  return {
    id: prompt.id,
    text: prompt.text,
    status: normalizedStatus,
    createdAt: toIso(prompt.createdAt),
    claimInfo,
    response,
  };
};
