"use client";

import {
  CreatePromptInput,
  PromptDetail,
  PromptListItem,
  SharePayload,
  SubmitResponseInput,
} from "@/lib/types";

type PromptListResponse = {
  items: PromptListItem[];
};

const parseError = async (response: Response) => {
  const body = await response.json().catch(() => null);
  const message = body?.error;
  if (typeof message === "string" && message.length > 0) {
    return message;
  }
  return `Erro ${response.status}`;
};

async function request<T>(
  input: RequestInfo | URL,
  init: RequestInit & { sessionId: string }
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-session-id": init.sessionId,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<T>;
}

async function requestAdmin<T>(
  input: RequestInfo | URL,
  init: RequestInit & { sessionId: string; adminToken: string }
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-session-id": init.sessionId,
      "x-admin-token": init.adminToken,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<T>;
}

export const api = {
  listPrompts: (sessionId: string, view: "requester" | "worker") =>
    request<PromptListResponse>(`/api/prompts?view=${view}`, {
      method: "GET",
      sessionId,
    }),
  createPrompt: (sessionId: string, payload: CreatePromptInput) =>
    request<{ id: string }>(`/api/prompts`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionId,
    }),
  getPromptDetail: (id: string) =>
    fetch(`/api/prompts/${id}`, { cache: "no-store" }).then(async (res) => {
      if (!res.ok) {
        throw new Error(await parseError(res));
      }
      return (await res.json()) as PromptDetail;
    }),
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
  getLatestSharePayload: (sessionId: string) =>
    request<SharePayload>(`/api/share/latest`, {
      method: "GET",
      sessionId,
    }),
  verifyAdminCode: (sessionId: string, code: string) =>
    request<{ token: string }>("/api/admin/auth/verify", {
      method: "POST",
      sessionId,
      body: JSON.stringify({ code }),
    }),
  checkAdminAuth: (sessionId: string, adminToken: string) =>
    requestAdmin<{ ok: true }>("/api/admin/auth/check", {
      method: "GET",
      sessionId,
      adminToken,
    }),
  adminListPrompts: (
    sessionId: string,
    adminToken: string,
    status?: "pending" | "in_progress" | "responded"
  ) =>
    requestAdmin<PromptListResponse>(
      status ? `/api/admin/prompts?status=${status}` : "/api/admin/prompts",
      {
        method: "GET",
        sessionId,
        adminToken,
      }
    ),
  adminReopenPrompt: (sessionId: string, adminToken: string, id: string) =>
    requestAdmin<{ ok: true }>(`/api/admin/prompts/${id}/reopen`, {
      method: "POST",
      body: JSON.stringify({}),
      sessionId,
      adminToken,
    }),
  adminDeletePrompt: (sessionId: string, adminToken: string, id: string) =>
    requestAdmin<{ ok: true }>(`/api/admin/prompts/${id}`, {
      method: "DELETE",
      sessionId,
      adminToken,
    }),
};
