import { ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  AdminReportItem,
  CreateReportInput,
  ReportStatus as ReportStatusType,
} from "@/lib/types";

const toAdminReportItem = (report: {
  id: string;
  targetType: "prompt" | "response";
  targetId: string;
  reporterSessionId: string;
  reason: "spam" | "harassment" | "hateful" | "sexual" | "violence" | "other";
  details: string | null;
  status: "open" | "dismissed" | "actioned";
  promptId: string | null;
  responseId: string | null;
  snapshotPromptText: string | null;
  snapshotResponseText: string | null;
  snapshotResponseType: "text" | "image" | null;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
  reviewedBySessionId: string | null;
  reporterIdentity: {
    ipHash: string | null;
    ipSource: string | null;
  } | null;
}): AdminReportItem => ({
  id: report.id,
  targetType: report.targetType,
  targetId: report.targetId,
  reporterSessionId: report.reporterSessionId,
  reporterIpHash: report.reporterIdentity?.ipHash ?? undefined,
  reporterIpSource: report.reporterIdentity?.ipSource ?? undefined,
  reason: report.reason,
  details: report.details ?? undefined,
  status: report.status,
  promptId: report.promptId ?? undefined,
  responseId: report.responseId ?? undefined,
  snapshotPromptText: report.snapshotPromptText ?? undefined,
  snapshotResponseText: report.snapshotResponseText ?? undefined,
  snapshotResponseType: report.snapshotResponseType ?? undefined,
  createdAt: report.createdAt.toISOString(),
  updatedAt: report.updatedAt.toISOString(),
  reviewedAt: report.reviewedAt?.toISOString(),
  reviewedBySessionId: report.reviewedBySessionId ?? undefined,
});

export const createReport = async (sessionId: string, input: CreateReportInput) => {
  const details = input.details?.trim() || null;

  if (input.targetType === "prompt") {
    const prompt = await prisma.prompt.findUnique({
      where: { id: input.targetId },
    });

    if (!prompt) {
      return { kind: "not_found" as const };
    }

    const report = await prisma.report.upsert({
      where: {
        reporterSessionId_targetType_targetId: {
          reporterSessionId: sessionId,
          targetType: "prompt",
          targetId: input.targetId,
        },
      },
      create: {
        targetType: "prompt",
        targetId: input.targetId,
        reporterSessionId: sessionId,
        reason: input.reason,
        details,
        status: "open",
        promptId: prompt.id,
        snapshotPromptText: prompt.text,
      },
      update: {
        reason: input.reason,
        details,
        status: "open",
        reviewedAt: null,
        reviewedBySessionId: null,
        promptId: prompt.id,
        snapshotPromptText: prompt.text,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return { kind: "ok" as const, report };
  }

  const response = await prisma.promptResponse.findUnique({
    where: { id: input.targetId },
    include: {
      prompt: {
        select: {
          id: true,
          text: true,
        },
      },
    },
  });

  if (!response) {
    return { kind: "not_found" as const };
  }

  const report = await prisma.report.upsert({
    where: {
      reporterSessionId_targetType_targetId: {
        reporterSessionId: sessionId,
        targetType: "response",
        targetId: input.targetId,
      },
    },
    create: {
      targetType: "response",
      targetId: input.targetId,
      reporterSessionId: sessionId,
      reason: input.reason,
      details,
      status: "open",
      promptId: response.prompt.id,
      responseId: response.id,
      snapshotPromptText: response.prompt.text,
      snapshotResponseText: response.text,
      snapshotResponseType: response.type,
    },
    update: {
      reason: input.reason,
      details,
      status: "open",
      reviewedAt: null,
      reviewedBySessionId: null,
      promptId: response.prompt.id,
      responseId: response.id,
      snapshotPromptText: response.prompt.text,
      snapshotResponseText: response.text,
      snapshotResponseType: response.type,
    },
    select: {
      id: true,
      status: true,
    },
  });

  return { kind: "ok" as const, report };
};

export const listAdminReports = async (status?: ReportStatusType | "all") => {
  const reports = await prisma.report.findMany({
    where: status && status !== "all" ? { status: status as ReportStatus } : undefined,
    include: {
      reporterIdentity: {
        select: {
          ipHash: true,
          ipSource: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return reports.map(toAdminReportItem);
};

export const reviewReport = async (
  reportId: string,
  reviewerSessionId: string,
  status: ReportStatusType
) => {
  const existing = await prisma.report.findUnique({
    where: {
      id: reportId,
    },
  });

  if (!existing) {
    return { kind: "not_found" as const };
  }

  const updated = await prisma.report.update({
    where: {
      id: reportId,
    },
    data: {
      status: status as ReportStatus,
      reviewedAt: new Date(),
      reviewedBySessionId: reviewerSessionId,
    },
    include: {
      reporterIdentity: {
        select: {
          ipHash: true,
          ipSource: true,
        },
      },
    },
  });

  return {
    kind: "ok" as const,
    report: toAdminReportItem(updated),
  };
};
