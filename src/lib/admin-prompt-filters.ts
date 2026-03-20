import type { Prisma, PromptStatus } from "@prisma/client";
import type { AdminPromptFilters } from "@/lib/types";

export const validAdminPromptStatuses = new Set(["pending", "in_progress", "responded"]);

export type AdminPromptMatchMode = "contains" | "exact" | "startsWith";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const parsePositiveInt = (value: string | null, fallback: number) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

export const parseDate = (value: string | null) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
};

export const buildAdminPromptWhere = (
  filters: Pick<
    AdminPromptFilters,
    "q" | "status" | "dateFrom" | "dateTo" | "requesterSessionId" | "responderSessionId"
  >,
  matchMode: AdminPromptMatchMode = "contains"
): Prisma.PromptWhereInput => {
  const q = filters.q?.trim();
  const requesterSessionId = filters.requesterSessionId?.trim();
  const responderSessionId = filters.responderSessionId?.trim();
  const dateFrom = parseDate(filters.dateFrom ?? null);
  const dateTo = parseDate(filters.dateTo ?? null);

  return {
    ...(filters.status ? { status: filters.status as PromptStatus } : {}),
    ...(q
      ? {
          text:
            matchMode === "exact"
              ? {
                  equals: q,
                  mode: "insensitive" as const,
                }
              : matchMode === "startsWith"
                ? {
                    startsWith: q,
                    mode: "insensitive" as const,
                  }
                : {
                    contains: q,
                    mode: "insensitive" as const,
                  },
        }
      : {}),
    ...(requesterSessionId ? { requesterSessionId } : {}),
    ...(responderSessionId
      ? {
          response: {
            is: {
              responderSessionId,
            },
          },
        }
      : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
  };
};

export const hasAnyAdminPromptFilter = (
  filters: Pick<
    AdminPromptFilters,
    "q" | "status" | "dateFrom" | "dateTo" | "requesterSessionId" | "responderSessionId"
  >
) =>
  Boolean(
    filters.q?.trim() ||
      filters.status ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.requesterSessionId?.trim() ||
      filters.responderSessionId?.trim()
  );
