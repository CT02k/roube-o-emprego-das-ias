"use client";

import { useSessionId } from "@/hooks/use-session-id";
import { ADMIN_TOKEN_STORAGE_KEY } from "@/lib/admin-client";
import { api } from "@/lib/client-api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminContextProvider } from "./admin-context";

type AdminGateProps = {
  children: React.ReactNode;
};

export function AdminGate({ children }: AdminGateProps) {
  const sessionId = useSessionId();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let cancelled = false;
    const stored = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (!stored) {
      router.replace("/");
      return;
    }

    const validate = async () => {
      try {
        await api.checkAdminAuth(sessionId, stored);
        if (!cancelled) {
          setToken(stored);
          setReady(true);
        }
      } catch {
        window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        if (!cancelled) {
          router.replace("/");
        }
      }
    };

    void validate();

    return () => {
      cancelled = true;
    };
  }, [router, sessionId]);

  if (!ready || !token) {
    return null;
  }

  return (
    <AdminContextProvider
      value={{
        adminToken: token,
        sessionId,
      }}
    >
      {children}
    </AdminContextProvider>
  );
}
