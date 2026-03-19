"use client";

import { DrawingDialog } from "@/components/drawing-dialog";
import { ShareDialog } from "@/components/share-dialog";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Queue, QueueItem, QueueItemContent } from "@/components/ai-elements/queue";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Badge } from "@/components/ui/badge";
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
import { api } from "@/lib/client-api";
import { PromptDetail, PromptListItem, SharePayload } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import {
  ArrowLeftIcon,
  BellIcon,
  BellOffIcon,
  BrushIcon,
  Clock3Icon,
  LockIcon,
  LoaderCircleIcon,
  ShieldIcon,
  SendIcon,
  Share2Icon,
  Trash2Icon,
  UnlockIcon,
  User2Icon,
  UserPenIcon,
} from "lucide-react";
import Image from "next/image";
import {
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const NATIVE_SHARE_ENABLED = process.env.NEXT_PUBLIC_NATIVE_SHARE_ENABLED === "true";

const statusMeta = (item: Pick<PromptListItem, "status">) => {
  if (item.status === "responded") {
    return { label: "Respondido", variant: "default" as const };
  }
  if (item.status === "in_progress") {
    return { label: "Em espera...", variant: "secondary" as const };
  }
  return { label: "Em espera...", variant: "outline" as const };
};

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
  const previousModeRef = useRef(mode);
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
    onEnableNotifications: requestNotifications,
  } = useNotifications({
    mode,
    list,
    requesterThread,
    selectedPromptId,
    onError: setLocalError,
  });

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
  }, [clearDraft, mode, refresh, selectedDetail, selectedPromptId, sessionId, setSelectedPromptId]);

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
        event.key === "´" ||
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
  }, [selectedPromptId, selectedDetail, sessionId, mode]);

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

  const onEnableNotifications = requestNotifications;

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
      void (async () => {
        await api.releasePrompt(sessionId, selectedPromptId).catch(() => null);
        clearDraft();
        setSelectedPromptId(null);
        await refresh();
      })();
      return;
    }

    if (mode === "requester") {
      clearDraft();
      setSelectedPromptId(null);
    }
  }, [clearDraft, mode, refresh, selectedDetail, selectedPromptId, sessionId, setSelectedPromptId]);

  const selectPrompt = async (item: PromptListItem) => {
    setLocalError(null);
    setSelectedPromptId(item.id);
    if (mode === "worker" && item.status === "pending") {
      try {
        await api.claimPrompt(sessionId, item.id);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Nao foi possivel reservar o prompt.");
        setSelectedPromptId(null);
        await refresh();
        return;
      }
    }
    await refresh();
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
        ? "Voce esta substituindo uma IA."
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
                <Button
                  onClick={() => void clearSelectedPrompt()}
                  type="button"
                  variant="outline"
                >
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
                    Usuário
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
              <aside className="flex min-h-0 max-h-80 flex-col rounded-sm border border-border bg-card p-3 lg:max-h-[calc(100svh-8rem)]">
                <p className="mb-2 px-1 font-medium text-sm">
                  {mode === "admin" ? "Painel de moderacao" : "Fila de prompts"}
                </p>
                <Queue className="h-full border-none bg-transparent p-0 shadow-none">
                  <div className="space-y-1 overflow-y-auto pr-1">
                    {(mode === "admin" ? adminList : list).map((item) => {
                      const meta = statusMeta(item);
                      const active = item.id === selectedPromptId;
                      return (
                        <button
                          className={cn(
                            "w-full rounded-sm border px-3 py-2 text-left transition",
                            active
                              ? "border-border bg-accent"
                              : "border-transparent bg-muted hover:bg-zinc-800"
                          )}
                          key={item.id}
                          onClick={() =>
                            void (mode === "admin" ? selectAdminPrompt(item) : selectPrompt(item))
                          }
                          type="button"
                        >
                          <QueueItem className="w-full p-0 hover:bg-transparent">
                            <div className="flex items-start justify-between gap-2">
                              <QueueItemContent className="line-clamp-2 text-foreground">
                                {item.textPreview}
                              </QueueItemContent>
                              <Badge variant={meta.variant}>{meta.label}</Badge>
                            </div>
                          </QueueItem>
                        </button>
                      );
                    })}
                    {(mode === "admin" ? adminList.length === 0 : list.length === 0) && (
                      <div className="rounded-sm border border-dashed border-border p-4 text-muted-foreground text-sm">
                        Sem mensagens por enquanto.
                      </div>
                    )}
                  </div>
                </Queue>
                {mode === "worker" ? (
                  <div className="mt-3 rounded-sm border border-border bg-background p-3">
                    <p className="font-medium text-sm">Notificacoes de novos prompts</p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      Receba um alerta quando novos prompts entrarem na fila.
                    </p>
                    <Button
                      className="mt-3 w-full"
                      onClick={() => void onEnableNotifications()}
                      type="button"
                      variant="outline"
                    >
                      {notifyEnabled && notifyPermission === "granted" ? (
                        <>
                          <BellIcon />
                          Desativar notificacoes
                        </>
                      ) : (
                        <>
                          <BellOffIcon />
                          Receber notificacoes
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 rounded-sm border border-border bg-background p-3 text-xs text-muted-foreground">
                    Use Ctrl + &apos; para desbloquear o painel admin.
                  </div>
                )}
              </aside>
            )}

            <section className="flex min-h-[65svh] flex-col overflow-hidden rounded-sm border border-border bg-card lg:h-[calc(100svh-8rem)]">
              <Conversation className="min-h-0">
                <ConversationContent className="gap-6 p-5">
                  {mode === "requester" && requesterThread.length === 0 && (
                    <ConversationEmptyState
                      description="Envie um prompt para alguém responder."
                      icon={isLoading ? (<LoaderCircleIcon className="animate-spin" />) : <User2Icon/>}
                      title={isLoading ? "Carregando..." : "Conversa vazia"}
                    />
                  )}
                  {mode === "requester" &&
                    requesterThread.map((entry) => (
                      <div className="space-y-3" key={entry.id}>
                        <Message from="user">
                          <MessageContent>{entry.text}</MessageContent>
                        </Message>
                        {entry.response ? (
                          <Message from="assistant">
                            <MessageContent>
                              {entry.response.type === "text" ? (
                                <MessageResponse>{entry.response.text}</MessageResponse>
                              ) : entry.response.imageDataUrl ? (
                              <Image
                                alt="Desenho humano enviado como resposta"
                                className="max-h-[420px] w-full rounded-sm border border-border object-contain"
                                height={420}
                                src={entry.response.imageDataUrl}
                                unoptimized
                                  width={720}
                                />
                              ) : (
                                <p className="text-muted-foreground text-sm">
                                  Resposta de imagem indisponivel.
                                </p>
                              )}
                            </MessageContent>
                          </Message>
                        ) : (
                          <div className="rounded-sm border border-dashed border-border bg-muted p-4 text-muted-foreground text-sm">
                            <Shimmer className="font-medium text-sm" duration={1.8}>{statusMeta({ status: entry.status }).label}</Shimmer>
                            <p className="mt-1">
                              {notifyEnabled && notifyPermission === "granted"
                                ? "Te avisamos quando alguem responder."
                                : "Ative notificações para ser avisado quando responderem."}
                            </p>                            {!(notifyEnabled && notifyPermission === "granted") && (
                              <Button
                                className="mt-3"
                                onClick={() => void onEnableNotifications()}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                <BellIcon />
                                Receber notificações
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  {mode === "worker" && !selectedDetail && (
                    <ConversationEmptyState
                      description="Selecione um prompt na fila para responder."
                      icon={isLoading ? (<LoaderCircleIcon className="animate-spin" />) : <User2Icon/>}
                      title={isLoading ? "Carregando..." : "Nenhuma conversa selecionada"}
                    />
                  )}
                  {mode === "worker" && selectedDetail && (
                    <>
                      <Message from="user">
                        <MessageContent>{selectedDetail.text}</MessageContent>
                      </Message>
                      {selectedDetail.response && (
                        <Message from="assistant">
                          <MessageContent>
                            {selectedDetail.response.type === "text" ? (
                              <MessageResponse>{selectedDetail.response.text}</MessageResponse>
                            ) : selectedDetail.response.imageDataUrl ? (
                              <Image
                                alt="Desenho humano enviado como resposta"
                                className="max-h-[420px] w-full rounded-sm border border-border object-contain"
                                height={420}
                                src={selectedDetail.response.imageDataUrl}
                                unoptimized
                                width={720}
                              />
                            ) : (
                              <p className="text-muted-foreground text-sm">
                                Resposta de imagem indisponivel.
                              </p>
                            )}
                          </MessageContent>
                        </Message>
                      )}
                    </>
                  )}
                  {mode === "admin" && !selectedDetail && (
                    <ConversationEmptyState
                      description="Selecione um prompt para moderar."
                      icon={isLoading ? <LoaderCircleIcon className="animate-spin" /> : <ShieldIcon />}
                      title={isLoading ? "Carregando..." : "Nenhum prompt selecionado"}
                    />
                  )}
                  {mode === "admin" && selectedDetail && (
                    <div className="space-y-3">
                      <Message from="user">
                        <MessageContent>{selectedDetail.text}</MessageContent>
                      </Message>
                      {selectedDetail.response ? (
                        <Message from="assistant">
                          <MessageContent>
                            {selectedDetail.response.type === "text" ? (
                              <MessageResponse>{selectedDetail.response.text}</MessageResponse>
                            ) : selectedDetail.response.imageDataUrl ? (
                              <Image
                                alt="Resposta em imagem"
                                className="max-h-[420px] w-full rounded-sm border border-border object-contain"
                                height={420}
                                src={selectedDetail.response.imageDataUrl}
                                unoptimized
                                width={720}
                              />
                            ) : (
                              <p className="text-muted-foreground text-sm">
                                Resposta de imagem indisponivel.
                              </p>
                            )}
                          </MessageContent>
                        </Message>
                      ) : (
                        <div className="rounded-sm border border-dashed border-border bg-muted p-4 text-muted-foreground text-sm">
                          Sem resposta ainda.
                        </div>
                      )}
                      <div className="rounded-sm border border-border bg-muted p-3 text-xs text-muted-foreground">
                        <p>ID do prompt: {selectedDetail.id}</p>
                        <p>
                          Solicitante:{" "}
                          {adminList.find((item) => item.id === selectedDetail.id)?.requesterSessionId ?? "-"}
                        </p>
                        <p>
                          Claimer:{" "}
                          {adminList.find((item) => item.id === selectedDetail.id)?.claimedBySessionId ?? "-"}
                        </p>
                        <p>
                          Respondedor:{" "}
                          {adminList.find((item) => item.id === selectedDetail.id)?.responderSessionId ?? "-"}
                        </p>
                        <p>Criado em: {new Date(selectedDetail.createdAt).toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  )}
                </ConversationContent>
              </Conversation>
              <Separator />

              <div className="p-4">
                {mode === "admin" ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border bg-background p-3">
                    <p className="mr-auto text-muted-foreground text-xs">
                      Moderacao: reabra prompts ou exclua definitivamente.
                    </p>
                    <Button
                      disabled={!selectedPromptId || !adminToken || isSubmitting}
                      onClick={() => void reopenByAdmin()}
                      type="button"
                      variant="outline"
                    >
                      <UnlockIcon />
                      Reabrir para fila
                    </Button>
                    <Button
                      disabled={!selectedPromptId || !adminToken || isSubmitting}
                      onClick={() => void deleteByAdmin()}
                      type="button"
                      variant="destructive"
                    >
                      <Trash2Icon />
                      Excluir
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 rounded-sm border border-border bg-background p-3">
                    <Textarea
                      className="min-h-28 resize-none border-none bg-transparent p-2 shadow-none"
                      disabled={mode === "worker" ? !canRespond(selectedDetail, sessionId) || isSubmitting : isSubmitting}
                      onChange={(event) => setTextDraft(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder={mode === "requester" ? "Peca algo para um humano" : "Responda como humano."}
                      value={textDraft}
                    />
                    {mode === "worker" && imageDraftDataUrl && (
                      <div className="space-y-2 rounded-sm border border-border bg-muted p-3">
                        <p className="text-xs">Desenho pronto para enviar:</p>
                        <Image
                          alt="Preview do desenho"
                          className="max-h-48 rounded-sm border border-border object-contain"
                          height={220}
                          src={imageDraftDataUrl}
                          unoptimized
                          width={360}
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {mode === "worker" ? (
                        <div className="mr-auto flex flex-wrap gap-2">
                          <Button
                            disabled={!canRespond(selectedDetail, sessionId) || isSubmitting}
                            onClick={() => setCanvasOpen(true)}
                            type="button"
                            variant="outline"
                          >
                            <BrushIcon />
                            Gerar imagem
                          </Button>
                          <Button
                            disabled={!canRespond(selectedDetail, sessionId) || isSubmitting}
                            onClick={() => setImageDraftDataUrl(null)}
                            type="button"
                            variant="ghost"
                          >
                            Limpar rascunho
                          </Button>
                          <Button
                            disabled={!canRespond(selectedDetail, sessionId) || isSubmitting}
                            onClick={async () => {
                              if (!selectedPromptId) {
                                return;
                              }
                              await api.releasePrompt(sessionId, selectedPromptId).catch(() => null);
                              clearDraft();
                              setSelectedPromptId(null);
                              await refresh();
                            }}
                            type="button"
                            variant="ghost"
                          >
                            Devolver para fila
                          </Button>
                        </div>
                      ) : null}
                      <p className="mr-2 ml-auto text-muted-foreground text-xs">Ctrl + Enter para enviar</p>
                      {mode === "requester" ? (
                        <Button
                          disabled={textDraft.trim().length === 0 || isSubmitting}
                          onClick={() => void submitNewPrompt(textDraft)}
                          type="button"
                        >
                          <SendIcon />
                          Enviar
                        </Button>
                      ) : (
                        <Button
                          disabled={!draftReady || !canRespond(selectedDetail, sessionId) || isSubmitting}
                          onClick={() => void submitWorkerResponse()}
                          type="button"
                        >
                          <UserPenIcon />
                          Responder
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {(error || localError) && (
                  <p className="mt-3 text-destructive text-sm">{localError ?? error}</p>
                )}
              </div>
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
            <Button disabled={adminBusy || adminKeyInput.trim().length === 0} onClick={() => void onAdminUnlock()} type="button">
              {adminBusy ? "Validando..." : "Entrar no admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



