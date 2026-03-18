"use client";

import { useMemo } from "react";

const SESSION_KEY = "human-chat-session-id";

const getOrCreateSession = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const created = `humano_${crypto.randomUUID()}`;
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
};

export const useSessionId = () => useMemo(() => getOrCreateSession(), []);
