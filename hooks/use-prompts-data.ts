"use client";

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
        if (nextList.items.length === 0) {
          setRequesterThread([]);
        } else {
          const details = await Promise.all(
            nextList.items.map((item) => api.getPromptDetail(item.id))
          );
          const sorted = [...details].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setRequesterThread(sorted);
        }
      } else if (mode === "worker" || mode === "admin") {
        setRequesterThread([]);
        if (selectedPromptId) {
          const detail = await api.getPromptDetail(selectedPromptId);
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

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const source = new EventSource("/api/events");

    source.onmessage = () => {
      void refreshRef.current();
    };

    source.onerror = () => {
      setError("Conexao em tempo real indisponivel. Tentando reconectar...");
    };

    source.onopen = () => {
      setError(null);
    };

    return () => {
      source.close();
    };
  }, [sessionId, mode]);

  return { list, selectedDetail, requesterThread, isLoading, error, refresh };
};
