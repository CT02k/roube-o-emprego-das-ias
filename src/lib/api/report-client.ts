import { request, requestAdmin } from "@/lib/api/base-client";
import type {
  AdminReportItem,
  AdminReportListResponse,
  AdminReviewReportInput,
  CreateReportInput,
  ReportSubmitResponse,
} from "@/lib/types";

export const reportClient = {
  createReport: (sessionId: string, payload: CreateReportInput) =>
    request<ReportSubmitResponse>("/api/reports", {
      method: "POST",
      sessionId,
      body: JSON.stringify(payload),
    }),
  adminListReports: (
    sessionId: string,
    adminToken: string,
    status: "all" | "open" | "dismissed" | "actioned" = "all"
  ) =>
    requestAdmin<AdminReportListResponse>(`/api/admin/reports?status=${status}`, {
      method: "GET",
      sessionId,
      adminToken,
    }),
  adminReviewReport: (
    sessionId: string,
    adminToken: string,
    id: string,
    payload: AdminReviewReportInput
  ) =>
    requestAdmin<AdminReportItem>(`/api/admin/reports/${id}`, {
      method: "PATCH",
      sessionId,
      adminToken,
      body: JSON.stringify(payload),
    }),
};
