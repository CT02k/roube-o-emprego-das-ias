"use client";

import { AppMode, PromptDetail, PromptListItem } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

const NOTIFY_STORAGE_KEY = "notify-on-response-enabled";

type UseNotificationsParams = {
  mode: AppMode;
  list: PromptListItem[];
  requesterThread: PromptDetail[];
  selectedPromptId: string | null;
  onError: (message: string | null) => void;
};

type UseNotificationsResult = {
  notifyEnabled: boolean;
  notifyPermission: NotificationPermission;
  onEnableNotifications: () => Promise<void>;
};

export const useNotifications = ({
  mode,
  list,
  requesterThread,
  selectedPromptId,
  onError,
}: UseNotificationsParams): UseNotificationsResult => {
  const [notifyEnabled, setNotifyEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(NOTIFY_STORAGE_KEY) === "1";
  });
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "default";
    }

    return Notification.permission;
  });
  const requesterResponsesRef = useRef<Record<string, boolean>>({});
  const requesterInitRef = useRef(false);
  const workerPromptIdsRef = useRef<Set<string>>(new Set());
  const workerInitRef = useRef(false);

  useEffect(() => {
    if (!notifyEnabled || notifyPermission !== "granted") {
      requesterResponsesRef.current = {};
      requesterInitRef.current = false;
      return;
    }

    if (mode !== "requester") {
      return;
    }

    const nextMap: Record<string, boolean> = {};

    for (const entry of requesterThread) {
      const hasResponse = Boolean(entry.response);
      nextMap[entry.id] = hasResponse;

      if (requesterInitRef.current) {
        const hadResponse = requesterResponsesRef.current[entry.id] ?? false;
        if (!hadResponse && hasResponse) {
          new Notification("Resposta recebida", {
            body: "Um humano respondeu seu prompt.",
            tag: `response-${entry.id}`,
          });
        }
      }
    }

    requesterResponsesRef.current = nextMap;
    requesterInitRef.current = true;
  }, [mode, notifyEnabled, notifyPermission, requesterThread]);

  useEffect(() => {
    if (!notifyEnabled || notifyPermission !== "granted") {
      workerPromptIdsRef.current = new Set();
      workerInitRef.current = false;
      return;
    }

    if (mode !== "worker" || Boolean(selectedPromptId)) {
      return;
    }

    const currentIds = new Set(list.map((item) => item.id));
    if (workerInitRef.current) {
      for (const item of list) {
        if (!workerPromptIdsRef.current.has(item.id) && item.status === "pending") {
          new Notification("Novo prompt na fila", {
            body: item.textPreview,
            tag: `worker-prompt-${item.id}`,
          });
        }
      }
    }

    workerPromptIdsRef.current = currentIds;
    workerInitRef.current = true;
  }, [mode, notifyEnabled, notifyPermission, list, selectedPromptId]);

  const onEnableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      onError("Este navegador nao suporta notificacoes.");
      return;
    }

    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
    setNotifyPermission(permission);

    if (permission === "granted") {
      setNotifyEnabled(true);
      window.localStorage.setItem(NOTIFY_STORAGE_KEY, "1");
      onError(null);
      return;
    }

    setNotifyEnabled(false);
    window.localStorage.setItem(NOTIFY_STORAGE_KEY, "0");
    onError("Ative notificacoes no navegador para receber alertas.");
  };

  return {
    notifyEnabled,
    notifyPermission,
    onEnableNotifications,
  };
};
