"use client";

import { useAdminContext } from "@/components/admin/admin-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/client-api";
import type { AdminReportItem, ReportStatus } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

const statusOptions: Array<{ value: "all" | ReportStatus; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "open", label: "Abertas" },
  { value: "dismissed", label: "Descartadas" },
  { value: "actioned", label: "Ação tomada" },
];

const reasonLabels: Record<AdminReportItem["reason"], string> = {
  spam: "Spam",
  harassment: "Assédio",
  hateful: "Ódio",
  sexual: "Sexual",
  violence: "Violência",
  other: "Outro",
};

const statusLabels: Record<ReportStatus, string> = {
  open: "Aberta",
  dismissed: "Descartada",
  actioned: "Ação tomada",
};

export default function AdminReportsPage() {
  const { sessionId, adminToken } = useAdminContext();
  const [status, setStatus] = useState<"all" | ReportStatus>("open");
  const [items, setItems] = useState<AdminReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await api.adminListReports(sessionId, adminToken, status);
        if (!cancelled) {
          setItems(response.items);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao carregar denúncias.");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [adminToken, sessionId, status]);

  const review = async (id: string, nextStatus: ReportStatus) => {
    setBusyId(id);
    try {
      const updated = await api.adminReviewReport(sessionId, adminToken, id, {
        status: nextStatus,
      });
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao revisar denúncia.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-semibold text-lg">Reports</h1>
          <p className="text-muted-foreground text-sm">Fila de denúncias para revisão manual.</p>
        </div>
        <Select onValueChange={(value) => setStatus(value as "all" | ReportStatus)} value={status}>
          <SelectTrigger className="w-full sm:w-48">
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
      </div>

      {loading ? <p className="text-muted-foreground text-sm">Carregando denúncias...</p> : null}

      {!loading && items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma denúncia nessa fila.</p>
      ) : null}

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{item.targetType === "prompt" ? "Prompt" : "Resposta"}</Badge>
                <Badge variant={item.status === "open" ? "default" : "outline"}>
                  {statusLabels[item.status]}
                </Badge>
                <Badge variant="outline">{reasonLabels[item.reason]}</Badge>
              </div>
              <CardTitle className="text-base">Denúncia {item.id}</CardTitle>
              <CardDescription>{new Date(item.createdAt).toLocaleString("pt-BR")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1 text-muted-foreground">
                <p>Reporter: {item.reporterSessionId}</p>
                <p>Reporter IP hash: {item.reporterIpHash ?? "-"}</p>
                <p>Reporter IP source: {item.reporterIpSource ?? "-"}</p>
                <p>Prompt ID: {item.promptId ?? "-"}</p>
                <p>Response ID: {item.responseId ?? "-"}</p>
                <p>Revisado por: {item.reviewedBySessionId ?? "-"}</p>
              </div>

              {item.snapshotPromptText ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
                    Prompt
                  </p>
                  <p>{item.snapshotPromptText}</p>
                </div>
              ) : null}

              {item.targetType === "response" ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
                    Resposta
                  </p>
                  <p>
                    {item.snapshotResponseType === "image"
                      ? "Resposta em imagem"
                      : item.snapshotResponseText ?? "Sem texto salvo."}
                  </p>
                </div>
              ) : null}

              {item.details ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
                    Detalhes
                  </p>
                  <p>{item.details}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {item.promptId ? (
                  <Link className="inline-flex items-center rounded-sm border px-3 py-2" href={`/admin/messages?selected=${item.promptId}&page=1`}>
                    Abrir prompt
                  </Link>
                ) : null}
                {item.responseId ? (
                  <Link className="inline-flex items-center rounded-sm border px-3 py-2" href={`/historico/${item.responseId}`}>
                    Abrir histórico
                  </Link>
                ) : null}
                <Button
                  disabled={busyId === item.id}
                  onClick={() => void review(item.id, "dismissed")}
                  type="button"
                  variant="outline"
                >
                  Descartar
                </Button>
                <Button
                  disabled={busyId === item.id}
                  onClick={() => void review(item.id, "actioned")}
                  type="button"
                  variant="destructive"
                >
                  Marcar ação tomada
                </Button>
                <Button
                  disabled={busyId === item.id}
                  onClick={() => void review(item.id, "open")}
                  type="button"
                  variant="outline"
                >
                  Reabrir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
