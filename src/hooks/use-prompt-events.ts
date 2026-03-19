"use client";

import { useEffect, useEffectEvent } from "react";

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
  const handleMessage = useEffectEvent(() => {
    onMessage();
  });

  const handleOpen = useEffectEvent(() => {
    onOpen?.();
  });

  const handleError = useEffectEvent(() => {
    onError?.();
  });

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const source = new EventSource("/api/events");

    source.onmessage = () => {
      handleMessage();
    };

    source.onerror = () => {
      handleError();
    };

    source.onopen = () => {
      handleOpen();
    };

    return () => {
      source.close();
    };
  }, [sessionId]);
};
