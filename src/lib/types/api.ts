export type SharePayload = {
  promptText: string;
  responseType: "text" | "image";
  responseText?: string | null;
  responseImageDataUrl?: string | null;
};
