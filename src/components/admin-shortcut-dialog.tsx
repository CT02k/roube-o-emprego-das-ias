"use client";

import { useSessionId } from "@/hooks/use-session-id";
import { ADMIN_TOKEN_STORAGE_KEY, isAdminShortcut } from "@/lib/admin-client";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminShortcutDialog() {
  const sessionId = useSessionId();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isAdminShortcut(event)) {
        return;
      }

      event.preventDefault();
      setValue("");
      setError(null);
      setOpen(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onUnlock = async () => {
    if (!sessionId || value.trim().length === 0 || busy) {
      return;
    }

    setBusy(true);
    try {
      const result = await api.verifyAdminCode(sessionId, value.trim());
      window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, result.token);
      setOpen(false);
      setError(null);
      if (pathname !== "/admin") {
        router.push("/admin");
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Codigo admin invalido.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle>Desbloquear admin</DialogTitle>
          <DialogDescription>
            Use o atalho Ctrl + &apos; para abrir este dialogo e informar o codigo.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") {
              return;
            }
            event.preventDefault();
            void onUnlock();
          }}
          placeholder="Cole o codigo admin"
          type="password"
          value={value}
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <DialogFooter>
          <Button onClick={() => setOpen(false)} type="button" variant="outline">
            Cancelar
          </Button>
          <Button disabled={busy || value.trim().length === 0} onClick={() => void onUnlock()}>
            {busy ? "Validando..." : "Entrar no admin"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
