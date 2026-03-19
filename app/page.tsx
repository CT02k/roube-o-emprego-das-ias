"use client";

import { DrawingDialog } from "@/components/drawing-dialog";
import { AdminPanel } from "@/components/home/admin-panel";
import { PromptSidebar } from "@/components/home/prompt-sidebar";
import { RequesterPanel } from "@/components/home/requester-panel";
import { WorkerPanel } from "@/components/home/worker-panel";
import { ShareDialog } from "@/components/share-dialog";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useModeSync } from "@/hooks/use-mode-sync";
import { useNotifications } from "@/hooks/use-notifications";
import { usePromptsData } from "@/hooks/use-prompts-data";
import { useSessionId } from "@/hooks/use-session-id";
import { useWorkerClaim } from "@/hooks/use-worker-claim";
import { api } from "@/lib/client-api";
import type { PromptDetail, PromptListItem, SharePayload } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import {
  ArrowLeftIcon,
  Clock3Icon,
  LockIcon,
  SendIcon,
  Share2Icon,
  ShieldIcon,
  UserPenIcon,
} from "lucide-react";
import { KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useState } from "react";

const NATIVE_SHARE_ENABLED = process.env.NEXT_PUBLIC_NATIVE_SHARE_ENABLED === "true";

const canRespond = (detail: PromptDetail | null, sessionId: string) => {
  if (!detail || detail.status !== "in_progress" || !detail.claimInfo) {
    return false;
  }
  return !detail.claimInfo.expired && detail.claimInfo.claimedBySessionId === sessionId;
};

export default function HomePage() {
  const sessionId = useSessionId();
  const { mode, setMode } = useModeSync();
  const selectedPromptId = useUIStore((state) => state.selectedPromptId);
  const setSelectedPromptId = useUIStore((state) => state.setSelectedPromptId);
  const textDraft = useUIStore((state) => state.textDraft);
  const setTextDraft = useUIStore((state) => state.setTextDraft);
  const imageDraftDataUrl = useUIStore((state) => state.imageDraftDataUrl);
  const setImageDraftDataUrl = useUIStore((state) => state.setImageDraftDataUrl);
  const clearDraft = useUIStore((state) => state.clearDraft);

  const [isCanvasOpen, setCanvasOpen] = useState(false);
  const [isShareOpen, setShareOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [shareAvailable, setShareAvailable] = useState(false);
  const [shareAvailabilityLoading, setShareAvailabilityLoading] = useState(true);
  const [shareHintOpen, setShareHintOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    adminUnlocked,
    adminToken,
    adminDialogOpen,
    setAdminDialogOpen,
    adminKeyInput,
    setAdminKeyInput,
    adminError,
    adminBusy,
    openAdminDialog,
    onAdminUnlock,
    onAdminLogout,
  } = useAdminAuth({
    sessionId,
    mode,
    setMode,
    setSelectedPromptId,
  });

  const { list, selectedDetail, requesterThread, refresh, isLoading, error } = usePromptsData(
    sessionId,
    mode,
    adminUnlocked,
    adminToken
  );

  const {
    notifyEnabled,
    notifyPermission,
    onEnableNotifications: onEnableNotifications,
  } = useNotifications({
    mode,
    list,
    requesterThread,
    selectedPromptId,
    onError: setLocalError,
  });

  const { clearSelectedPrompt, selectPrompt, releaseCurrentPrompt } = useWorkerClaim({
    mode,
    sessionId,
    selectedPromptId,
    selectedDetail,
    refresh,
    clearDraft,
    setSelectedPromptId,
    onError: setLocalError,
  });

  useEffect(() => {
    const isAdminShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) {
        return false;
      }

      return (
        event.code === "Quote" ||
        event.code === "BracketLeft" ||
        event.code === "IntlRo" ||
        event.key === "'" ||
        event.key === '"' ||
        event.key === "Dead" ||
        event.key === "Â´" ||
        event.key === "`"
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (process.env.NEXT_PUBLIC_ENABLE_LEGACY_ADMIN_SHORTCUT !== "true") {
        return;
      }
      if (!isAdminShortcut(event)) {
        return;
      }
      event.preventDefault();
      openAdminDialog();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openAdminDialog]);

  useEffect(() => {
    if (!NATIVE_SHARE_ENABLED) {
      setShareAvailable(false);
      setShareAvailabilityLoading(false);
      return;
    }

    let cancelled = false;

    const checkShareAvailability = async () => {
      if (!sessionId) {
        return;
      }
      setShareAvailabilityLoading(true);
      try {
        await api.getLatestSharePayload(sessionId);
        if (!cancelled) {
          setShareAvailable(true);
        }
      } catch {
        if (!cancelled) {
          setShareAvailable(false);
        }
      } finally {
        if (!cancelled) {
          setShareAvailabilityLoading(false);
        }
      }
    };

    void checkShareAvailability();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const onOpenShare = async () => {
    if (!shareAvailable) {
      return;
    }
    setShareOpen(true);
    setShareLoading(true);
    setShareError(null);
    try {
      const payload = await api.getLatestSharePayload(sessionId);
      setSharePayload(payload);
      setShareAvailable(true);
    } catch (err) {
      setSharePayload(null);
      setShareAvailable(false);
      setShareError(err instanceof Error ? err.message : "Falha ao gerar card de share.");
    } finally {
      setShareLoading(false);
    }
  };

  const selectAdminPrompt = async (item: PromptListItem) => {
    setLocalError(null);
    setSelectedPromptId(item.id);
    await refresh();
  };

  const reopenByAdmin = async () => {
    if (!selectedPromptId || !adminToken) {
      return;
    }

    setSubmitting(true);
    try {
      await api.adminReopenPrompt(sessionId, adminToken, selectedPromptId);
      setSelectedPromptId(null);
      await refresh();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Falha ao reabrir prompt.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteByAdmin = async () => {
    if (!selectedPromptId || !adminToken) {
      return;
    }

    setSubmitting(true);
    try {
      await api.adminDeletePrompt(sessionId, adminToken, selectedPromptId);
      setSelectedPromptId(null);
      await refresh();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Falha ao excluir prompt.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitNewPrompt = async (text: string) => {
    if (!sessionId || text.trim().length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      await api.createPrompt(sessionId, { text });
      clearDraft();
      await refresh();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Falha ao enviar prompt.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitWorkerResponse = async () => {
    if (!selectedPromptId || !sessionId) {
      return;
    }

    setSubmitting(true);
    try {
      if (imageDraftDataUrl) {
        await api.respondPrompt(sessionId, selectedPromptId, {
          type: "image",
          imageDataUrl: imageDraftDataUrl,
        });
      } else {
        await api.respondPrompt(sessionId, selectedPromptId, {
          type: "text",
          text: textDraft,
        });
      }

      clearDraft();
      await refresh();
      setSelectedPromptId(null);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Falha ao enviar resposta.");
    } finally {
      setSubmitting(false);
    }
  };

  const draftReady = imageDraftDataUrl ? true : textDraft.trim().length > 0;
  const isWorkerWithSelection = mode === "worker" && Boolean(selectedPromptId);
  const isAdminWithSelection = mode === "admin" && Boolean(selectedPromptId);
  const canSendRequester = mode === "requester" && textDraft.trim().length > 0 && !isSubmitting;
  const canSendWorker =
    mode === "worker" &&
    draftReady &&
    canRespond(selectedDetail, sessionId) &&
    !isSubmitting;
  const adminTabVisible = false;
  const adminList = mode === "admin" ? list : [];

  const waitingBadge = useMemo(
    () =>
      mode === "worker"
        ? "Você esta substituindo uma IA."
        : mode === "admin"
          ? "Painel administrativo"
          : "CLT-5.3-Mini",
    [mode]
  );

  const handleComposerKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.ctrlKey || event.metaKey) || event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (mode === "requester" && canSendRequester) {
      void submitNewPrompt(textDraft);
      return;
    }

    if (mode === "worker" && canSendWorker) {
      void submitWorkerResponse();
    }
  };

  return (
    <div className="min-h-svh w-full bg-background">
      <div className="relative min-h-svh w-full transition-colors duration-500" data-mode={mode}>
        <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
          <header className="flex flex-col items-start justify-between gap-3 rounded-sm border border-border bg-card px-4 py-3 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-sm">Roube o emprego das IAs</p>
              <p className="text-muted-foreground text-xs">{waitingBadge}</p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              {(isWorkerWithSelection || isAdminWithSelection) && (
                <Button onClick={() => void clearSelectedPrompt()} type="button" variant="outline">
                  <ArrowLeftIcon />
                  Voltar para lista
                </Button>
              )}
              {mode === "admin" && adminTabVisible && (
                <Button onClick={onAdminLogout} type="button" variant="outline">
                  <LockIcon />
                  Sair do admin
                </Button>
              )}
              {!NATIVE_SHARE_ENABLED ? (
                <div
                  onBlur={() => setShareHintOpen(false)}
                  onFocus={() => setShareHintOpen(true)}
                  onMouseEnter={() => setShareHintOpen(true)}
                  onMouseLeave={() => setShareHintOpen(false)}
                >
                  <Popover onOpenChange={setShareHintOpen} open={shareHintOpen}>
                    <PopoverTrigger
                      render={
                        <Button disabled type="button" variant="outline">
                          <Share2Icon />
                          Compartilhar
                        </Button>
                      }
                    />
                    <PopoverContent align="end" className="text-sm">
                      Compartilhamento nativo desativado no ambiente.
                    </PopoverContent>
                  </Popover>
                </div>
              ) : shareAvailable ? (
                <Button
                  disabled={shareAvailabilityLoading}
                  onClick={() => void onOpenShare()}
                  type="button"
                  variant="outline"
                >
                  <Share2Icon />
                  Compartilhar
                </Button>
              ) : (
                <div
                  onBlur={() => setShareHintOpen(false)}
                  onFocus={() => setShareHintOpen(true)}
                  onMouseEnter={() => setShareHintOpen(true)}
                  onMouseLeave={() => setShareHintOpen(false)}
                >
                  <Popover onOpenChange={setShareHintOpen} open={shareHintOpen}>
                    <PopoverTrigger
                      render={
                        <Button disabled type="button" variant="outline">
                          <Share2Icon />
                          Compartilhar
                        </Button>
                      }
                    />
                    <PopoverContent align="end" className="text-sm">
                      Experimente fazer uma pergunta primeiro.
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              <Tabs
                onValueChange={(value) => setMode(value as "requester" | "worker")}
                value={mode}
              >
                <TabsList>
                  <TabsTrigger value="requester">
                    <Clock3Icon />
                    Usuario
                  </TabsTrigger>
                  <TabsTrigger value="worker">
                    <UserPenIcon />
                    Trabalhador
                  </TabsTrigger>
                  {adminTabVisible && (
                    <TabsTrigger value="admin">
                      <ShieldIcon />
                      Admin
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            </div>
          </header>

          <div
            className={cn(
              "grid gap-4",
              (mode === "worker" && !isWorkerWithSelection) ||
                (mode === "admin" && !isAdminWithSelection)
                ? "lg:grid-cols-[320px_1fr]"
                : "grid-cols-1"
            )}
          >
            {((mode === "worker" && !isWorkerWithSelection) ||
              (mode === "admin" && !isAdminWithSelection)) && (
              <PromptSidebar
                adminList={adminList}
                list={list}
                mode={mode}
                notifyEnabled={notifyEnabled}
                notifyPermission={notifyPermission}
                onEnableNotifications={onEnableNotifications}
                onSelectAdminPrompt={selectAdminPrompt}
                onSelectPrompt={selectPrompt}
                selectedPromptId={selectedPromptId}
              />
            )}

            <section className="flex min-h-[65svh] flex-col overflow-hidden rounded-sm border border-border bg-card lg:h-[calc(100svh-8rem)]">
              {mode === "requester" ? (
                <>
                  <RequesterPanel
                    isLoading={isLoading}
                    notifyEnabled={notifyEnabled}
                    notifyPermission={notifyPermission}
                    onEnableNotifications={onEnableNotifications}
                    requesterThread={requesterThread}
                  />
                  <Separator />
                  <div className="p-4">
                    <div className="flex flex-col gap-3 rounded-sm border border-border bg-background p-3">
                      <Textarea
                        className="min-h-28 resize-none border-none bg-transparent p-2 shadow-none"
                        disabled={isSubmitting}
                        onChange={(event) => setTextDraft(event.target.value)}
                        onKeyDown={handleComposerKeyDown}
                        placeholder="Peca algo para um humano"
                        value={textDraft}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="mr-2 ml-auto text-muted-foreground text-xs">
                          Ctrl + Enter para enviar
                        </p>
                        <Button
                          disabled={textDraft.trim().length === 0 || isSubmitting}
                          onClick={() => void submitNewPrompt(textDraft)}
                          type="button"
                        >
                          <SendIcon />
                          Enviar
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : mode === "worker" ? (
                <WorkerPanel
                  canRespond={canRespond(selectedDetail, sessionId)}
                  draftReady={draftReady}
                  imageDraftDataUrl={imageDraftDataUrl}
                  isLoading={isLoading}
                  isSubmitting={isSubmitting}
                  onClearImageDraft={() => setImageDraftDataUrl(null)}
                  onComposerKeyDown={handleComposerKeyDown}
                  onOpenCanvas={() => setCanvasOpen(true)}
                  onReleasePrompt={releaseCurrentPrompt}
                  onSubmitWorkerResponse={submitWorkerResponse}
                  onTextDraftChange={setTextDraft}
                  selectedDetail={selectedDetail}
                  textDraft={textDraft}
                />
              ) : (
                <AdminPanel
                  adminList={adminList}
                  adminToken={adminToken}
                  isLoading={isLoading}
                  isSubmitting={isSubmitting}
                  onDelete={deleteByAdmin}
                  onReopen={reopenByAdmin}
                  selectedDetail={selectedDetail}
                  selectedPromptId={selectedPromptId}
                />
              )}

              {(error || localError) && (
                <div className="px-4 pb-4">
                  <p className="text-destructive text-sm">{localError ?? error}</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <DrawingDialog
        onOpenChange={setCanvasOpen}
        onSubmit={(dataUrl) => setImageDraftDataUrl(dataUrl)}
        open={isCanvasOpen}
      />
      <ShareDialog
        error={shareError}
        loading={shareLoading}
        nativeShareEnabled={NATIVE_SHARE_ENABLED}
        onOpenChange={setShareOpen}
        open={isShareOpen}
        payload={sharePayload}
      />
      <Dialog onOpenChange={setAdminDialogOpen} open={adminDialogOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle>Desbloquear admin</DialogTitle>
            <DialogDescription>
              Pressione Ctrl + &apos; para abrir este atalho e informe a chave de administrador.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            onChange={(event) => setAdminKeyInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || adminBusy) {
                return;
              }
              event.preventDefault();
              void onAdminUnlock();
            }}
            placeholder="Cole a chave admin"
            type="password"
            value={adminKeyInput}
          />
          {adminError && <p className="text-destructive text-sm">{adminError}</p>}
          <DialogFooter>
            <Button onClick={() => setAdminDialogOpen(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button
              disabled={adminBusy || adminKeyInput.trim().length === 0}
              onClick={() => void onAdminUnlock()}
              type="button"
            >
              {adminBusy ? "Validando..." : "Entrar no admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
