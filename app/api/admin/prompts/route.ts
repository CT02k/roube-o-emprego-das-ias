import { PromptStatus } from "@/lib/generated/prisma/client";
import { forbiddenAdminResponse, isAdminAuthorized } from "@/lib/admin-auth";
import { toAdminPromptListItem } from "@/lib/prompt-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const validStatuses = new Set(["pending", "in_progress", "responded"]);
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const parsePositiveInt = (value: string | null, fallback: number) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

const parseDate = (value: string | null) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
};

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return forbiddenAdminResponse();
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  if (status && !validStatuses.has(status)) {
    return NextResponse.json(
      { error: "status deve ser pending, in_progress ou responded." },
      { status: 400 }
    );
  }

  const dateFrom = parseDate(searchParams.get("dateFrom"));
  const dateTo = parseDate(searchParams.get("dateTo"));
  if (dateFrom === undefined || dateTo === undefined) {
    return NextResponse.json(
      { error: "dateFrom/dateTo invalidos. Use formato ISO-8601." },
      { status: 400 }
    );
  }

  const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
  const pageSize = Math.min(
    parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  );

  const q = searchParams.get("q")?.trim();
  const requesterSessionId = searchParams.get("requesterSessionId")?.trim();
  const responderSessionId = searchParams.get("responderSessionId")?.trim();

  const where = {
    ...(status ? { status: status as PromptStatus } : {}),
    ...(q
      ? {
          text: {
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

  const [total, prompts] = await Promise.all([
    prisma.prompt.count({ where }),
    prisma.prompt.findMany({
      where,
      include: { response: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    items: prompts.map(toAdminPromptListItem),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}
