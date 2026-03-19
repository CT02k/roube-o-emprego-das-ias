import { request, requestAdmin } from "@/lib/api/base-client";
import type {
  AdminPromptDetail,
  AdminPromptFilters,
  AdminPromptListResponse,
  AdminStats,
} from "@/lib/types";

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

export const adminClient = {
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
