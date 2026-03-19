import { request } from "@/lib/api/base-client";
import type { SharePayload } from "@/lib/types";

export const shareClient = {
  getLatestSharePayload: (sessionId: string) =>
    request<SharePayload>(`/api/share/latest`, {
      method: "GET",
      sessionId,
    }),
};
