export type AppMode = "requester" | "worker" | "admin";

export type PromptStatus = "pending" | "in_progress" | "responded";
export type ResponseType = "text" | "image";

export type PromptListItem = {
  id: string;
  textPreview: string;
  status: PromptStatus;
  createdAt: string;
  updatedAt?: string;
  claimedAt?: string;
  respondedAt?: string;
  responseType?: ResponseType;
  requesterSessionId?: string;
  claimedBySessionId?: string;
  responderSessionId?: string;
};

export type PromptDetail = {
  id: string;
  text: string;
  status: PromptStatus;
  createdAt: string;
  claimInfo?: {
    claimedBySessionId: string;
    claimedAt: string;
    expired: boolean;
  };
  response?: {
    id: string;
    type: ResponseType;
    text?: string;
    imageDataUrl?: string;
    responderSessionId: string;
    createdAt: string;
  };
};

export type CreatePromptInput = {
  text: string;
};

export type SubmitResponseInput =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image";
      imageDataUrl: string;
    };

export type SharePayload = {
  promptText: string;
  responseType: "text" | "image";
  responseText?: string | null;
  responseImageDataUrl?: string | null;
};

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

export type PromptThreadResponse = {
  items: PromptDetail[];
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
