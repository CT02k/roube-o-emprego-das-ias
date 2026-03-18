"use client";

import { AppMode } from "@/lib/types";
import { useUIStore } from "@/store/ui-store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const MODE_KEY = "human-chat-mode";

const isMode = (value: string | null): value is AppMode =>
  value === "requester" || value === "worker";

export const useModeSync = () => {
  const mode = useUIStore((state) => state.mode);
  const setMode = useUIStore((state) => state.setMode);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const modeParam = searchParams.get("mode");
    if (isMode(modeParam)) {
      setMode(modeParam);
      window.localStorage.setItem(MODE_KEY, modeParam);
      return;
    }

    const stored = window.localStorage.getItem(MODE_KEY);
    if (isMode(stored)) {
      setMode(stored);
      const next = new URLSearchParams(window.location.search);
      next.set("mode", stored);
      router.replace(`${pathname}?${next.toString()}`);
      return;
    }

    window.localStorage.setItem(MODE_KEY, "requester");
  }, [pathname, router, setMode]);

  const updateMode = (nextMode: AppMode) => {
    setMode(nextMode);
    window.localStorage.setItem(MODE_KEY, nextMode);
    const next = new URLSearchParams(window.location.search);
    next.set("mode", nextMode);
    router.replace(`${pathname}?${next.toString()}`);
  };

  return { mode, setMode: updateMode };
};
