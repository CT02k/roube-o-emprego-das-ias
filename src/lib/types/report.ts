import type { ResponseType } from "@/lib/types/prompt";

export type ReportTargetType = "prompt" | "response";
export type ReportReason = "spam" | "harassment" | "hateful" | "sexual" | "violence" | "other";
export type ReportStatus = "open" | "dismissed" | "actioned";

export type CreateReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
};

export type ReportSubmitResponse = {
  ok: true;
  reportId: string;
  status: ReportStatus;
};

export type AdminReportItem = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reporterSessionId: string;
  reporterIpHash?: string;
  reporterIpSource?: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  promptId?: string;
  responseId?: string;
  snapshotPromptText?: string;
  snapshotResponseText?: string;
  snapshotResponseType?: ResponseType;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBySessionId?: string;
};

export type AdminReportListResponse = {
  items: AdminReportItem[];
};

export type AdminReviewReportInput = {
  status: ReportStatus;
};
