export type AppMode = "requester" | "worker";

export type PromptStatus = "pending" | "in_progress" | "responded";
export type ResponseType = "text" | "image";

export type PromptListItem = {
  id: string;
  textPreview: string;
  status: PromptStatus;
  createdAt: string;
  claimedAt?: string;
  respondedAt?: string;
  responseType?: ResponseType;
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
