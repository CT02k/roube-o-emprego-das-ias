import { requestPublic } from "@/lib/api/base-client";
import type { HistoryDetail, HistoryListItem, HistorySort } from "@/lib/types";

type HistoryListResponse = {
  items: HistoryListItem[];
  sort: HistorySort;
};

type HistoryVoteResponse = {
  ok: true;
  upvotesCount: number;
  viewerHasUpvoted: boolean;
};

export const historyClient = {
  listHistory: (sort: HistorySort, sessionId?: string | null) =>
    requestPublic<HistoryListResponse>(`/api/history?sort=${sort}`, {
      method: "GET",
      sessionId,
    }),
  getHistoryDetail: (id: string, sessionId?: string | null) =>
    requestPublic<HistoryDetail>(`/api/history/${id}`, {
      method: "GET",
      sessionId,
    }),
  addHistoryUpvote: (id: string, sessionId: string) =>
    requestPublic<HistoryVoteResponse>(`/api/history/${id}`, {
      method: "POST",
      sessionId,
      body: JSON.stringify({}),
    }),
  removeHistoryUpvote: (id: string, sessionId: string) =>
    requestPublic<HistoryVoteResponse>(`/api/history/${id}`, {
      method: "DELETE",
      sessionId,
    }),
};
