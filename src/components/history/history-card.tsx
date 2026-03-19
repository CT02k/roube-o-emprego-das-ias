import { PromptResponse } from "@/components/home/prompt-response";
import { Badge } from "@/components/ui/badge";
import type { HistoryListItem } from "@/lib/types";
import Link from "next/link";

type HistoryCardProps = {
  item: HistoryListItem;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export function HistoryCard({ item }: HistoryCardProps) {
  return (
    <Link
      className="group flex h-full flex-col gap-4 rounded-sm border border-border bg-card p-4 transition-colors hover:bg-muted/30"
      href={`/historico/${item.id}`}
    >
      <div className="flex items-center justify-between gap-3">
        <Badge variant="secondary">{item.response.type === "image" ? "Desenho" : "Texto"}</Badge>
        <span className="text-muted-foreground text-xs">{formatDate(item.createdAt)}</span>
      </div>
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Pergunta</p>
        <p className="line-clamp-3 text-base font-medium text-foreground">{item.promptText}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-border bg-background/70 p-3">
        <PromptResponse alt="Resposta humana do historico" response={item.response} />
      </div>
      <p className="text-sm text-primary transition-transform group-hover:translate-x-0.5">
        Abrir resposta
      </p>
    </Link>
  );
}
