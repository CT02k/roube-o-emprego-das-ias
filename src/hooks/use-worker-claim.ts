"use client";

import { api } from "@/lib/client-api";
import { AppMode, PromptDetail, PromptListItem } from "@/lib/types";
import { useCallback, useEffect, useRef } from "react";

const canRespond = (detail: PromptDetail | null, sessionId: string) => {
  if (!detail || detail.status !== "in_progress" || !detail.claimInfo) {
    return false;
  }

  return !detail.claimInfo.expired && detail.claimInfo.claimedBySessionId === sessionId;
};

type UseWorkerClaimParams = {
  mode: AppMode;
  sessionId: string;
  selectedPromptId: string | null;
  selectedDetail: PromptDetail | null;
  refresh: () => Promise<void>;
  clearDraft: () => void;
  setSelectedPromptId: (id: string | null) => void;
  onError: (message: string | null) => void;
};

type UseWorkerClaimResult = {
  clearSelectedPrompt: () => Promise<void>;
  selectPrompt: (item: PromptListItem) => Promise<void>;
  releaseCurrentPrompt: () => Promise<void>;
};

export const useWorkerClaim = ({
  mode,
  sessionId,
  selectedPromptId,
  selectedDetail,
  refresh,
  clearDraft,
  setSelectedPromptId,
  onError,
}: UseWorkerClaimParams): UseWorkerClaimResult => {
  const previousModeRef = useRef(mode);

  const releaseCurrentPrompt = useCallback(async () => {
    if (!selectedPromptId || !sessionId) {
      return;
    }

    await api.releasePrompt(sessionId, selectedPromptId).catch(() => null);
    clearDraft();
    setSelectedPromptId(null);
    await refresh();
  }, [clearDraft, refresh, selectedPromptId, sessionId, setSelectedPromptId]);

  const clearSelectedPrompt = useCallback(async () => {
    if (!selectedPromptId) {
      return;
    }

    const shouldRelease =
      mode === "worker" && sessionId && canRespond(selectedDetail, sessionId);

    if (shouldRelease) {
      await api.releasePrompt(sessionId, selectedPromptId).catch(() => null);
    }

    clearDraft();
    setSelectedPromptId(null);
    if (shouldRelease) {
      await refresh();
    }
  }, [
    clearDraft,
    mode,
    refresh,
    selectedDetail,
    selectedPromptId,
    sessionId,
    setSelectedPromptId,
  ]);

  const selectPrompt = useCallback(
    async (item: PromptListItem) => {
      onError(null);
      setSelectedPromptId(item.id);

      if (mode === "worker" && item.status === "pending") {
        try {
          await api.claimPrompt(sessionId, item.id);
        } catch (err) {
          onError(err instanceof Error ? err.message : "Nao foi possivel reservar o prompt.");
          setSelectedPromptId(null);
          await refresh();
          return;
        }
      }

      await refresh();
    },
    [mode, onError, refresh, sessionId, setSelectedPromptId]
  );

  useEffect(() => {
    const onBeforeUnload = () => {
      if (!selectedPromptId || !sessionId || mode !== "worker") {
        return;
      }

      if (canRespond(selectedDetail, sessionId)) {
        void api.releasePrompt(sessionId, selectedPromptId).catch(() => null);
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [mode, selectedDetail, selectedPromptId, sessionId]);

  useEffect(() => {
    const previousMode = previousModeRef.current;
    previousModeRef.current = mode;

    if (!selectedPromptId) {
      return;
    }

    if (
      previousMode === "worker" &&
      mode !== "worker" &&
      sessionId &&
      canRespond(selectedDetail, sessionId)
    ) {
      void releaseCurrentPrompt();
      return;
    }

    if (mode === "requester") {
      clearDraft();
      setSelectedPromptId(null);
    }
  }, [
    clearDraft,
    mode,
    releaseCurrentPrompt,
    selectedDetail,
    selectedPromptId,
    sessionId,
    setSelectedPromptId,
  ]);

  return {
    clearSelectedPrompt,
    selectPrompt,
    releaseCurrentPrompt,
  };
};
