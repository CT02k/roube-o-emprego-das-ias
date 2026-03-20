"use client";

import { useAdminContext } from "@/components/admin/admin-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { api } from "@/lib/client-api";
import {
  AdminPromptBulkMatchMode,
  AdminPromptBulkResponse,
  AdminPromptDetail,
  AdminPromptListResponse,
  PromptListItem,
  PromptStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const statusOptions: Array<{ value: "all" | PromptStatus; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "in_progress", label: "Em andamento" },
  { value: "responded", label: "Respondidos" },
];

const pageSizeOptions = [10, 20, 50, 100];
const bulkMatchModeOptions: Array<{ value: AdminPromptBulkMatchMode; label: string }> = [
  { value: "contains", label: "Contem" },
  { value: "exact", label: "Exato" },
  { value: "startsWith", label: "Comeca com" },
];

const statusBadge = (status: PromptStatus) => {
  if (status === "responded") return { text: "Respondido", variant: "default" as const };
  if (status === "in_progress") return { text: "Em andamento", variant: "secondary" as const };
  return { text: "Pendente", variant: "outline" as const };
};

const toQueryString = (params: URLSearchParams) => {
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
};

export default function AdminMessagesPage() {
  const { sessionId, adminToken } = useAdminContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const filters = useMemo(() => {
    const statusParam = searchParams.get("status");
    const status: PromptStatus | undefined =
      statusParam === "pending" || statusParam === "in_progress" || statusParam === "responded"
        ? statusParam
        : undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.max(1, Number(searchParams.get("pageSize") ?? "20") || 20);

    return {
      q: searchParams.get("q") ?? "",
      status,
      dateFrom: searchParams.get("dateFrom") ?? "",
      dateTo: searchParams.get("dateTo") ?? "",
      requesterSessionId: searchParams.get("requesterSessionId") ?? "",
      responderSessionId: searchParams.get("responderSessionId") ?? "",
      page,
      pageSize,
      selected: searchParams.get("selected") ?? "",
    };
  }, [searchParams]);

  const [listData, setListData] = useState<AdminPromptListResponse | null>(null);
  const [detail, setDetail] = useState<AdminPromptDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<"reopen" | "delete" | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkMatchMode, setBulkMatchMode] = useState<AdminPromptBulkMatchMode>("contains");
  const [bulkPreview, setBulkPreview] = useState<AdminPromptBulkResponse | null>(null);
  const [bulkPreviewLoading, setBulkPreviewLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const updateQuery = (mutator: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    router.replace(`${pathname}${toQueryString(params)}`);
  };

  const resetFilters = () => {
    router.replace("/admin/messages?page=1&pageSize=20");
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingList(true);
      try {
        const response = await api.adminListPrompts(sessionId, adminToken, {
          q: filters.q || undefined,
          status: filters.status,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          requesterSessionId: filters.requesterSessionId || undefined,
          responderSessionId: filters.responderSessionId || undefined,
          page: filters.page,
          pageSize: filters.pageSize,
        });
        if (!cancelled) {
          setListData(response);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao carregar mensagens.");
          setListData(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    adminToken,
    filters.dateFrom,
    filters.dateTo,
    filters.page,
    filters.pageSize,
    filters.q,
    filters.requesterSessionId,
    filters.responderSessionId,
    filters.status,
    sessionId,
  ]);

  useEffect(() => {
    if (!filters.selected) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    const loadDetail = async () => {
      setLoadingDetail(true);
      try {
        const response = await api.adminGetPromptDetail(sessionId, adminToken, filters.selected);
        if (!cancelled) {
          setDetail(response);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setDetail(null);
          setError(err instanceof Error ? err.message : "Falha ao carregar detalhe.");
        }
      } finally {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      }
    };

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [adminToken, filters.selected, sessionId]);

  const items = listData?.items ?? [];
  const pagination = listData?.pagination;
  const hasBulkFilters = Boolean(
    filters.q ||
      filters.status ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.requesterSessionId ||
      filters.responderSessionId
  );
  const activeFilterLabels = [
    filters.q ? `Busca: ${filters.q}` : null,
    filters.status ? `Status: ${filters.status}` : null,
    filters.dateFrom ? `De: ${filters.dateFrom}` : null,
    filters.dateTo ? `Ate: ${filters.dateTo}` : null,
    filters.requesterSessionId ? `Requester: ${filters.requesterSessionId}` : null,
    filters.responderSessionId ? `Responder: ${filters.responderSessionId}` : null,
  ].filter(Boolean) as string[];

  const onSelect = (item: PromptListItem) => {
    updateQuery((params) => {
      params.set("selected", item.id);
    });
  };

  const closeDetail = () => {
    updateQuery((params) => {
      params.delete("selected");
    });
  };

  const runReopen = async () => {
    if (!filters.selected) {
      return;
    }
    setBusyAction("reopen");
    try {
      await api.adminReopenPrompt(sessionId, adminToken, filters.selected);
      closeDetail();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao reabrir prompt.");
    } finally {
      setBusyAction(null);
    }
  };

  const runDelete = async () => {
    if (!filters.selected) {
      return;
    }
    setBusyAction("delete");
    try {
      await api.adminDeletePrompt(sessionId, adminToken, filters.selected);
      setConfirmDeleteOpen(false);
      closeDetail();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir prompt.");
    } finally {
      setBusyAction(null);
    }
  };

  const loadBulkPreview = async () => {
    if (!hasBulkFilters) {
      setError("Defina pelo menos um filtro antes da exclusao em lote.");
      return;
    }

    setBulkPreviewLoading(true);
    try {
      const response = await api.adminBulkUpdatePrompts(sessionId, adminToken, {
        action: "dryRun",
        matchMode: bulkMatchMode,
        filters: {
          q: filters.q || undefined,
          status: filters.status,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          requesterSessionId: filters.requesterSessionId || undefined,
          responderSessionId: filters.responderSessionId || undefined,
        },
      });
      setBulkPreview(response);
      setError(null);
    } catch (err) {
      setBulkPreview(null);
      setError(err instanceof Error ? err.message : "Falha ao analisar exclusao em lote.");
    } finally {
      setBulkPreviewLoading(false);
    }
  };

  const runBulkDelete = async () => {
    if (!hasBulkFilters) {
      setError("Defina pelo menos um filtro antes da exclusao em lote.");
      return;
    }

    setBulkDeleteLoading(true);
    try {
      const response = await api.adminBulkUpdatePrompts(sessionId, adminToken, {
        action: "delete",
        matchMode: bulkMatchMode,
        filters: {
          q: filters.q || undefined,
          status: filters.status,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          requesterSessionId: filters.requesterSessionId || undefined,
          responderSessionId: filters.responderSessionId || undefined,
        },
      });
      setBulkPreview(response);
      setConfirmDeleteOpen(false);
      closeDetail();
      setBulkDeleteOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir prompts filtrados.");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const detailPanel = (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <p className="font-semibold text-sm">Detalhe</p>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-4 text-sm">
          {!filters.selected ? (
            <p className="text-muted-foreground">Selecione uma mensagem na lista.</p>
          ) : loadingDetail ? (
            <p className="text-muted-foreground">Carregando detalhe...</p>
          ) : !detail ? (
            <p className="text-muted-foreground">Detalhe indisponivel.</p>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Prompt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>{detail.text}</p>
                  <Badge variant={statusBadge(detail.status).variant}>
                    {statusBadge(detail.status).text}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Resposta</CardTitle>
                </CardHeader>
                <CardContent>
                  {!detail.response ? (
                    <p className="text-muted-foreground">Sem resposta.</p>
                  ) : detail.response.type === "text" ? (
                    <p>{detail.response.text}</p>
                  ) : detail.response.imageDataUrl ? (
                    <Image
                      alt="Resposta em imagem"
                      className="max-h-[360px] w-full rounded-sm border border-border object-contain"
                      height={360}
                      src={detail.response.imageDataUrl}
                      unoptimized
                      width={520}
                    />
                  ) : (
                    <p className="text-muted-foreground">Imagem indisponivel.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Metadados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-muted-foreground text-xs">
                  <p>ID: {detail.id}</p>
                  <p>Requester: {detail.requesterSessionId}</p>
                  <p>Claimer: {detail.claimedBySessionId ?? "-"}</p>
                  <p>Responder: {detail.responderSessionId ?? "-"}</p>
                  <p>Criado: {new Date(detail.createdAt).toLocaleString("pt-BR")}</p>
                  <p>Atualizado: {new Date(detail.updatedAt).toLocaleString("pt-BR")}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </ScrollArea>
      <Separator />
      <div className="flex gap-2 p-4">
        <Button
          className="flex-1"
          disabled={!detail || busyAction !== null}
          onClick={() => void runReopen()}
          variant="outline"
        >
          Reabrir para fila
        </Button>
        <Button
          className="flex-1"
          disabled={!detail || busyAction !== null}
          onClick={() => setConfirmDeleteOpen(true)}
          variant="destructive"
        >
          Excluir
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-semibold text-lg">Messages</h1>
        <p className="text-muted-foreground text-sm">
          Filtros persistem na URL para moderacao com contexto.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <Input
            onChange={(event) =>
              updateQuery((params) => {
                params.set("q", event.target.value);
                params.set("page", "1");
              })
            }
            placeholder="Buscar por texto do prompt"
            value={filters.q}
          />

          <Select
            onValueChange={(value) =>
              updateQuery((params) => {
                if (!value || value === "all") {
                  params.delete("status");
                } else {
                  params.set("status", value);
                }
                params.set("page", "1");
              })
            }
            value={filters.status ?? "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            onChange={(event) =>
              updateQuery((params) => {
                if (event.target.value) {
                  params.set("requesterSessionId", event.target.value);
                } else {
                  params.delete("requesterSessionId");
                }
                params.set("page", "1");
              })
            }
            placeholder="Requester session ID"
            value={filters.requesterSessionId}
          />

          <Input
            onChange={(event) =>
              updateQuery((params) => {
                if (event.target.value) {
                  params.set("responderSessionId", event.target.value);
                } else {
                  params.delete("responderSessionId");
                }
                params.set("page", "1");
              })
            }
            placeholder="Responder session ID"
            value={filters.responderSessionId}
          />

          <Input
            onChange={(event) =>
              updateQuery((params) => {
                if (event.target.value) {
                  params.set("dateFrom", event.target.value);
                } else {
                  params.delete("dateFrom");
                }
                params.set("page", "1");
              })
            }
            type="date"
            value={filters.dateFrom}
          />

          <Input
            onChange={(event) =>
              updateQuery((params) => {
                if (event.target.value) {
                  params.set("dateTo", event.target.value);
                } else {
                  params.delete("dateTo");
                }
                params.set("page", "1");
              })
            }
            type="date"
            value={filters.dateTo}
          />

          <Select
            onValueChange={(value) =>
              updateQuery((params) => {
                if (value) {
                  params.set("pageSize", value);
                }
                params.set("page", "1");
              })
            }
            value={String(filters.pageSize)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tamanho da pagina" />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} por pagina
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={resetFilters} variant="outline">
            Limpar filtros
          </Button>

          <Button
            disabled={!hasBulkFilters}
            onClick={() => {
              setBulkDeleteOpen(true);
              setBulkPreview(null);
            }}
            variant="destructive"
          >
            Excluir filtrados
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card className="min-h-[520px]">
          <CardContent className="p-0">
            <ScrollArea className="h-[520px]">
              <div className="space-y-1 p-2">
                {loadingList ? (
                  <p className="p-3 text-muted-foreground text-sm">Carregando mensagens...</p>
                ) : items.length === 0 ? (
                  <p className="p-3 text-muted-foreground text-sm">
                    Nenhum resultado com os filtros atuais.
                  </p>
                ) : (
                  items.map((item) => {
                    const active = item.id === filters.selected;
                    const meta = statusBadge(item.status);
                    return (
                      <button
                        className={cn(
                          "w-full rounded-sm border px-3 py-2 text-left",
                          active ? "border-primary bg-accent" : "border-transparent hover:bg-muted"
                        )}
                        key={item.id}
                        onClick={() => onSelect(item)}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm">{item.textPreview}</p>
                          <Badge variant={meta.variant}>{meta.text}</Badge>
                        </div>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {new Date(item.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <p className="text-muted-foreground">
                Pagina {pagination?.page ?? filters.page} de {pagination?.totalPages ?? 1} (
                {pagination?.total ?? 0} itens)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  disabled={(pagination?.page ?? filters.page) <= 1}
                  onClick={() =>
                    updateQuery((params) => {
                      params.set("page", String(Math.max(1, filters.page - 1)));
                    })
                  }
                  size="sm"
                  variant="outline"
                >
                  Anterior
                </Button>
                <Button
                  disabled={
                    (pagination?.page ?? filters.page) >= (pagination?.totalPages ?? filters.page)
                  }
                  onClick={() =>
                    updateQuery((params) => {
                      params.set(
                        "page",
                        String(
                          Math.min(
                            pagination?.totalPages ?? filters.page,
                            (pagination?.page ?? filters.page) + 1
                          )
                        )
                      );
                    })
                  }
                  size="sm"
                  variant="outline"
                >
                  Proxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isMobile ? <Card className="min-h-[520px]">{detailPanel}</Card> : null}
      </div>

      {isMobile ? (
        <Sheet onOpenChange={(open) => !open && closeDetail()} open={Boolean(filters.selected)}>
          <SheetContent className="w-full p-0 sm:max-w-md" side="right">
            <SheetHeader className="sr-only">
              <SheetTitle>Detalhe da mensagem</SheetTitle>
            </SheetHeader>
            {detailPanel}
          </SheetContent>
        </Sheet>
      ) : null}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Dialog onOpenChange={setConfirmDeleteOpen} open={confirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir prompt?</DialogTitle>
            <DialogDescription>
              Essa acao remove o prompt e a resposta associada permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setConfirmDeleteOpen(false)} variant="outline">
              Cancelar
            </Button>
            <Button
              disabled={busyAction !== null}
              onClick={() => void runDelete()}
              variant="destructive"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          setBulkDeleteOpen(open);
          if (!open) {
            setBulkPreview(null);
          }
        }}
        open={bulkDeleteOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir prompts filtrados</DialogTitle>
            <DialogDescription>
              Analise primeiro com os filtros atuais e execute a remocao em lote quando o
              resultado estiver correto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium">Filtros ativos</p>
              {activeFilterLabels.length === 0 ? (
                <p className="text-muted-foreground">Nenhum filtro definido.</p>
              ) : (
                <div className="space-y-1 text-muted-foreground">
                  {activeFilterLabels.map((label) => (
                    <p key={label}>{label}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="font-medium">Modo de busca</p>
              <Select
                onValueChange={(value) => {
                  setBulkMatchMode(value as AdminPromptBulkMatchMode);
                  setBulkPreview(null);
                }}
                value={bulkMatchMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Modo de busca" />
                </SelectTrigger>
                <SelectContent>
                  {bulkMatchModeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border p-3">
              {bulkPreviewLoading ? (
                <p className="text-muted-foreground">Analisando impacto...</p>
              ) : !bulkPreview ? (
                <p className="text-muted-foreground">
                  Rode uma analise para ver quantos prompts, respostas e votos serao removidos.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p>Prompts: {bulkPreview.summary.prompts}</p>
                    <p>Respostas: {bulkPreview.summary.responses}</p>
                    <p>Votos: {bulkPreview.summary.votes}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-medium">Amostra</p>
                    {bulkPreview.sample.length === 0 ? (
                      <p className="text-muted-foreground">Nenhum prompt encontrado.</p>
                    ) : (
                      <div className="space-y-1 text-muted-foreground">
                        {bulkPreview.sample.map((item) => (
                          <p key={item.id}>
                            {item.textPreview} ({new Date(item.createdAt).toLocaleString("pt-BR")})
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setBulkDeleteOpen(false)} variant="outline">
              Fechar
            </Button>
            <Button
              disabled={!hasBulkFilters || bulkPreviewLoading || bulkDeleteLoading}
              onClick={() => void loadBulkPreview()}
              variant="outline"
            >
              Analisar
            </Button>
            <Button
              disabled={
                !bulkPreview ||
                bulkPreview.summary.prompts === 0 ||
                bulkPreviewLoading ||
                bulkDeleteLoading
              }
              onClick={() => void runBulkDelete()}
              variant="destructive"
            >
              {bulkDeleteLoading
                ? "Excluindo..."
                : `Excluir ${bulkPreview?.summary.prompts ?? 0} prompts`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
