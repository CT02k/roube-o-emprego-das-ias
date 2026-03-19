import type { PromptDetail, PromptListItem, PromptStatus } from "@/lib/types/prompt";

export type AdminPromptFilters = {
  q?: string;
  status?: PromptStatus;
  dateFrom?: string;
  dateTo?: string;
  requesterSessionId?: string;
  responderSessionId?: string;
  page?: number;
  pageSize?: number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminPromptListResponse = {
  items: PromptListItem[];
  pagination: PaginationMeta;
};

export type AdminStats = {
  pending: number;
  inProgress: number;
  responded: number;
  todayTotal: number;
};

export type AdminPromptDetail = PromptDetail & {
  updatedAt: string;
  requesterSessionId: string;
  claimedBySessionId?: string;
  claimedAt?: string;
  responderSessionId?: string;
  respondedAt?: string;
};
