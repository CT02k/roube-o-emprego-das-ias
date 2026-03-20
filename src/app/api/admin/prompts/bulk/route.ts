import { forbiddenAdminResponse, isAdminAuthorized } from "@/lib/admin-auth";
import {
  buildAdminPromptWhere,
  hasAnyAdminPromptFilter,
  type AdminPromptMatchMode,
} from "@/lib/admin-prompt-filters";
import { toAdminPromptListItem } from "@/lib/prompt-helpers";
import { releaseExpiredPromptClaims } from "@/lib/prompt-maintenance";
import { prisma } from "@/lib/prisma";
import type { AdminPromptBulkAction, AdminPromptBulkRequest } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

const validMatchModes = new Set<AdminPromptMatchMode>(["contains", "exact", "startsWith"]);
const sampleSize = 10;

const getActionLabel = (action: AdminPromptBulkAction) =>
  action === "delete" ? "delete" : "dryRun";

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return forbiddenAdminResponse();
  }

  await releaseExpiredPromptClaims();

  let body: AdminPromptBulkRequest;
  try {
    body = (await request.json()) as AdminPromptBulkRequest;
  } catch {
    return NextResponse.json({ error: "Payload JSON invalido." }, { status: 400 });
  }

  const action = body.action ?? "dryRun";
  if (action !== "dryRun" && action !== "delete") {
    return NextResponse.json({ error: "action deve ser dryRun ou delete." }, { status: 400 });
  }

  const filters = body.filters ?? {};
  if (!hasAnyAdminPromptFilter(filters)) {
    return NextResponse.json(
      { error: "Informe pelo menos um filtro antes de executar em lote." },
      { status: 400 }
    );
  }

  const matchMode = body.matchMode ?? "contains";
  if (!validMatchModes.has(matchMode)) {
    return NextResponse.json(
      { error: "matchMode deve ser contains, exact ou startsWith." },
      { status: 400 }
    );
  }

  const where = buildAdminPromptWhere(filters, matchMode);
  const [matchingPrompts, promptsCount, responsesCount, votesCount] = await Promise.all([
    prisma.prompt.findMany({
      where,
      include: { response: true },
      orderBy: { createdAt: "desc" },
      take: sampleSize,
    }),
    prisma.prompt.count({ where }),
    prisma.promptResponse.count({
      where: {
        prompt: {
          is: where,
        },
      },
    }),
    prisma.promptResponseVote.count({
      where: {
        response: {
          is: {
            prompt: {
              is: where,
            },
          },
        },
      },
    }),
  ]);

  if (action === "dryRun") {
    return NextResponse.json({
      action: getActionLabel(action),
      matchMode,
      filters,
      summary: {
        prompts: promptsCount,
        responses: responsesCount,
        votes: votesCount,
      },
      sample: matchingPrompts.map(toAdminPromptListItem),
    });
  }

  const deleted = await prisma.$transaction(async (tx) => {
    const deletedPrompts = await tx.prompt.deleteMany({ where });
    return {
      prompts: deletedPrompts.count,
      responses: responsesCount,
      votes: votesCount,
    };
  });

  return NextResponse.json({
    action: getActionLabel(action),
    matchMode,
    filters,
    summary: deleted,
    sample: matchingPrompts.map(toAdminPromptListItem),
  });
}
