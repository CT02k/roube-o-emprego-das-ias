"use client";

import { useEffect } from "react";

type UsePromptEventsParams = {
  sessionId: string;
  onMessage: () => void;
  onOpen?: () => void;
  onError?: () => void;
};

export const usePromptEvents = ({
  sessionId,
  onMessage,
  onOpen,
  onError,
}: UsePromptEventsParams) => {
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const source = new EventSource("/api/events");

    source.onmessage = () => {
      onMessage();
    };

    source.onerror = () => {
      onError?.();
    };

    source.onopen = () => {
      onOpen?.();
    };

    return () => {
      source.close();
    };
  }, [onError, onMessage, onOpen, sessionId]);
};
