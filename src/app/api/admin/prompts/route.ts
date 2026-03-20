import { forbiddenAdminResponse, isAdminAuthorized } from "@/lib/admin-auth";
import {
  buildAdminPromptWhere,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  parseDate,
  parsePositiveInt,
  validAdminPromptStatuses,
} from "@/lib/admin-prompt-filters";
import { toAdminPromptListItem } from "@/lib/prompt-helpers";
import { releaseExpiredPromptClaims } from "@/lib/prompt-maintenance";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return forbiddenAdminResponse();
  }

  await releaseExpiredPromptClaims();

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  if (status && !validAdminPromptStatuses.has(status)) {
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

  const where = buildAdminPromptWhere({
    q,
    status: status ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    requesterSessionId,
    responderSessionId,
  });

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
