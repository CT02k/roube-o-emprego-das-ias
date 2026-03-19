"use client";

import { usePromptEvents } from "@/hooks/use-prompt-events";
import { api } from "@/lib/client-api";
import { AppMode, PromptDetail, PromptListItem } from "@/lib/types";
import { useUIStore } from "@/store/ui-store";
import { useCallback, useEffect, useRef, useState } from "react";

type UsePromptsDataResult = {
  list: PromptListItem[];
  selectedDetail: PromptDetail | null;
  requesterThread: PromptDetail[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export const usePromptsData = (
  sessionId: string,
  mode: AppMode,
  adminUnlocked = false,
  adminToken: string | null = null
): UsePromptsDataResult => {
  const selectedPromptId = useUIStore((state) => state.selectedPromptId);
  const [list, setList] = useState<PromptListItem[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<PromptDetail | null>(null);
  const [requesterThread, setRequesterThread] = useState<PromptDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const queuedRefreshRef = useRef(false);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const refresh = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    if (inFlightRef.current) {
      queuedRefreshRef.current = true;
      return;
    }

    if (mode === "admin" && (!adminUnlocked || !adminToken)) {
      setList([]);
      setSelectedDetail(null);
      setRequesterThread([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    inFlightRef.current = true;
    try {
      const nextList =
        mode === "admin"
          ? await api.adminListPrompts(sessionId, adminToken!)
          : await api.listPrompts(sessionId, mode);
      setList(nextList.items);
      setError(null);

      if (mode === "requester") {
        setSelectedDetail(null);
        const thread = await api.getRequesterThread(sessionId);
        setRequesterThread(thread.items);
      } else if (mode === "worker" || mode === "admin") {
        setRequesterThread([]);
        if (selectedPromptId) {
          const detail = await api.getPromptDetail(sessionId, selectedPromptId);
          setSelectedDetail(detail);
        } else {
          setSelectedDetail(null);
        }
      } else {
        setRequesterThread([]);
        setSelectedDetail(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar dados.";
      setError(message);
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
      if (queuedRefreshRef.current) {
        queuedRefreshRef.current = false;
        void refreshRef.current();
      }
    }
  }, [sessionId, mode, selectedPromptId, adminUnlocked, adminToken]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    setIsLoading(true);
    void refresh();
  }, [refresh]);

  usePromptEvents({
    sessionId,
    onMessage: () => {
      void refreshRef.current();
    },
    onError: () => {
      setError("Conexao em tempo real indisponivel. Tentando reconectar...");
    },
    onOpen: () => {
      setError(null);
    },
  });

  return { list, selectedDetail, requesterThread, isLoading, error, refresh };
};
