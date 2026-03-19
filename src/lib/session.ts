import { NextRequest } from "next/server";

export const getSessionIdFromRequest = (request: NextRequest): string | null => {
  const sessionId = request.headers.get("x-session-id");
  if (!sessionId) {
    return null;
  }

  const trimmed = sessionId.trim();
  return trimmed.length > 0 ? trimmed : null;
};
