"use client";

import { api } from "@/lib/client-api";
import { AppMode } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

const ADMIN_STORAGE_KEY = "human-chat-admin-token";

type UseAdminAuthParams = {
  sessionId: string;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  setSelectedPromptId: (id: string | null) => void;
};

type UseAdminAuthResult = {
  adminUnlocked: boolean;
  adminToken: string | null;
  adminGateReady: boolean;
  adminDialogOpen: boolean;
  setAdminDialogOpen: Dispatch<SetStateAction<boolean>>;
  adminKeyInput: string;
  setAdminKeyInput: Dispatch<SetStateAction<string>>;
  adminError: string | null;
  adminBusy: boolean;
  onAdminUnlock: () => Promise<void>;
  onAdminLogout: () => void;
};

export const useAdminAuth = ({
  sessionId,
  mode,
  setMode,
  setSelectedPromptId,
}: UseAdminAuthParams): UseAdminAuthResult => {
  const router = useRouter();
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminGateReady, setAdminGateReady] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminBusy, setAdminBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !sessionId) {
      return;
    }

    let cancelled = false;
    const storedToken = window.localStorage.getItem(ADMIN_STORAGE_KEY);

    if (!storedToken) {
      setAdminToken(null);
      setAdminUnlocked(false);
      setAdminGateReady(true);
      return;
    }

    const validate = async () => {
      try {
        await api.checkAdminAuth(sessionId, storedToken);
        if (!cancelled) {
          setAdminToken(storedToken);
          setAdminUnlocked(true);
        }
      } catch {
        window.localStorage.removeItem(ADMIN_STORAGE_KEY);
        if (!cancelled) {
          setAdminToken(null);
          setAdminUnlocked(false);
        }
      } finally {
        if (!cancelled) {
          setAdminGateReady(true);
        }
      }
    };

    void validate();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!adminGateReady) {
      return;
    }

    if (!adminUnlocked && mode === "admin") {
      setMode("requester");
      setSelectedPromptId(null);
    }
  }, [adminGateReady, adminUnlocked, mode, setMode, setSelectedPromptId]);

  const onAdminUnlock = async () => {
    setAdminBusy(true);
    try {
      const result = await api.verifyAdminCode(sessionId, adminKeyInput.trim());
      window.localStorage.setItem(ADMIN_STORAGE_KEY, result.token);
      setAdminToken(result.token);
      setAdminUnlocked(true);
      setAdminDialogOpen(false);
      setAdminError(null);
      router.push("/admin");
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Chave admin invalida.");
    } finally {
      setAdminBusy(false);
    }
  };

  const onAdminLogout = () => {
    window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    setAdminToken(null);
    setAdminUnlocked(false);
    setAdminDialogOpen(false);
    setAdminKeyInput("");
    setAdminError(null);
    setSelectedPromptId(null);
    setMode("requester");
  };

  return {
    adminUnlocked,
    adminToken,
    adminGateReady,
    adminDialogOpen,
    setAdminDialogOpen,
    adminKeyInput,
    setAdminKeyInput,
    adminError,
    adminBusy,
    onAdminUnlock,
    onAdminLogout,
  };
};
