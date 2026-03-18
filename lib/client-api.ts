"use client";

import {
  AdminPromptDetail,
  AdminPromptFilters,
  AdminPromptListResponse,
  AdminStats,
  CreatePromptInput,
  PromptDetail,
  PromptListItem,
  PromptThreadResponse,
  SharePayload,
  SubmitResponseInput,
} from "@/lib/types";

type PromptListResponse = {
  items: PromptListItem[];
};

const buildAdminPromptsQuery = (filters: AdminPromptFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.requesterSessionId) {
    params.set("requesterSessionId", filters.requesterSessionId);
  }
  if (filters.responderSessionId) {
    params.set("responderSessionId", filters.responderSessionId);
  }
  if (typeof filters.page === "number") params.set("page", String(filters.page));
  if (typeof filters.pageSize === "number") params.set("pageSize", String(filters.pageSize));

  const query = params.toString();
  return query.length > 0 ? `/api/admin/prompts?${query}` : "/api/admin/prompts";
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
    }).then(async (res) => {
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
  adminListPrompts: (sessionId: string, adminToken: string, filters?: AdminPromptFilters) =>
    requestAdmin<AdminPromptListResponse>(buildAdminPromptsQuery(filters), {
      method: "GET",
      sessionId,
      adminToken,
    }),
  adminGetPromptDetail: (sessionId: string, adminToken: string, id: string) =>
    requestAdmin<AdminPromptDetail>(`/api/admin/prompts/${id}`, {
      method: "GET",
      sessionId,
      adminToken,
    }),
  adminGetStats: (sessionId: string, adminToken: string) =>
    requestAdmin<AdminStats>("/api/admin/stats", {
      method: "GET",
      sessionId,
      adminToken,
    }),
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
