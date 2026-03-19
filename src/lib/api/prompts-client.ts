import { parseJsonOrThrow, request } from "@/lib/api/base-client";
import type {
  CreatePromptInput,
  PromptDetail,
  PromptListItem,
  PromptThreadResponse,
  SubmitResponseInput,
} from "@/lib/types";

type PromptListResponse = {
  items: PromptListItem[];
};

export const promptsClient = {
  listPrompts: (sessionId: string, view: "requester" | "worker") =>
    request<PromptListResponse>(`/api/prompts?view=${view}`, {
      method: "GET",
      sessionId,
    }),
  getRequesterThread: (sessionId: string) =>
    request<PromptThreadResponse>(`/api/prompts/thread`, {
      method: "GET",
      sessionId,
    }),
  createPrompt: (sessionId: string, payload: CreatePromptInput) =>
    request<{ id: string }>(`/api/prompts`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionId,
    }),
  getPromptDetail: (sessionId: string, id: string) =>
    fetch(`/api/prompts/${id}`, {
      cache: "no-store",
      headers: {
        "x-session-id": sessionId,
      },
    }).then((response) => parseJsonOrThrow<PromptDetail>(response)),
  claimPrompt: (sessionId: string, id: string) =>
    request<{ ok: true }>(`/api/prompts/${id}/claim`, {
      method: "POST",
      sessionId,
      body: JSON.stringify({}),
    }),
  releasePrompt: (sessionId: string, id: string) =>
    request<{ ok: true }>(`/api/prompts/${id}/release`, {
      method: "POST",
      sessionId,
      body: JSON.stringify({}),
    }),
  respondPrompt: (sessionId: string, id: string, payload: SubmitResponseInput) =>
    request<{ ok: true }>(`/api/prompts/${id}/respond`, {
      method: "POST",
      sessionId,
      body: JSON.stringify(payload),
    }),
};
