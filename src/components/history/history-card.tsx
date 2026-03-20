"use client";

import { HistoryShareButton } from "@/components/history/history-share-button";
import { HistoryVoteButton } from "@/components/history/history-vote-button";
import { PromptResponse } from "@/components/home/prompt-response";
import { ReportButton } from "@/components/report-button";
import { Badge } from "@/components/ui/badge";
import { useSessionId } from "@/hooks/use-session-id";
import type { HistoryListItem } from "@/lib/types";
import Link from "next/link";

type HistoryCardProps = {
  item: HistoryListItem;
  onVoteChange: (itemId: string, viewerHasUpvoted: boolean, upvotesCount: number) => void;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export function HistoryCard({ item, onVoteChange }: HistoryCardProps) {
  const sessionId = useSessionId();
  const sharePayload = {
    promptText: item.promptText,
    responseType: item.response.type,
    responseText: item.response.text ?? null,
    responseImageDataUrl: item.response.imageDataUrl ?? null,
  } as const;

  return (
    <article className="group flex h-full flex-col gap-4 rounded-sm border border-border bg-card p-4 transition-colors hover:bg-muted/30">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="secondary">{item.response.type === "image" ? "Desenho" : "Texto"}</Badge>
        <span className="text-muted-foreground text-xs">{formatDate(item.createdAt)}</span>
      </div>
      <Link className="space-y-2" href={`/historico/${item.id}`}>
        <p className="line-clamp-3 text-base font-medium text-foreground">{item.promptText}</p>
      </Link>
      <Link
        className="min-h-0 flex-1 overflow-hidden rounded-sm border border-border bg-background/70 p-3"
        href={`/historico/${item.id}`}
      >
        <PromptResponse alt="Resposta humana do historico" response={item.response} />
      </Link>
      <div className="flex items-center justify-end gap-3">
        <ReportButton compact sessionId={sessionId} targetId={item.response.id} targetType="response" />
        <HistoryShareButton payload={sharePayload} />
        <HistoryVoteButton item={item} onVoteChange={onVoteChange} />
      </div>
    </article>
  );
}
