"use client";

import { HistoryVoteButton } from "@/components/history/history-vote-button";
import { PromptResponse } from "@/components/home/prompt-response";
import { Badge } from "@/components/ui/badge";
import { useSessionId } from "@/hooks/use-session-id";
import { api } from "@/lib/client-api";
import type { HistoryDetail } from "@/lib/types";
import { useEffect, useState } from "react";

type HistoryDetailViewProps = {
  initialItem: HistoryDetail;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export function HistoryDetailView({ initialItem }: HistoryDetailViewProps) {
  const sessionId = useSessionId();
  const [item, setItem] = useState(initialItem);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const nextItem = await api.getHistoryDetail(initialItem.id, sessionId);
        if (!cancelled) {
          setItem(nextItem);
        }
      } catch {
        if (!cancelled) {
          setItem(initialItem);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [initialItem, sessionId]);

  const onVoteChange = (
    itemId: string,
    viewerHasUpvoted: boolean,
    upvotesCount: number,
  ) => {
    if (itemId !== item.id) {
      return;
    }

    setItem((current) => ({
      ...current,
      viewerHasUpvoted,
      upvotesCount,
    }));
  };

  return (
    <article className="flex flex-col gap-4 rounded-sm border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {item.response.type === "image" ? "Desenho" : "Texto"}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {formatDate(item.createdAt)}
          </span>
        </div>
        <HistoryVoteButton item={item} onVoteChange={onVoteChange} />
      </div>

      <section className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
          Pergunta
        </p>
        <p className="text-lg font-medium text-foreground">{item.promptText}</p>
      </section>

      <section className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
          Resposta
        </p>
        <div className="overflow-hidden rounded-sm border border-border bg-background/70 p-3">
          <PromptResponse
            alt="Resposta humana do ranking"
            response={item.response}
          />
        </div>
      </section>
    </article>
  );
}
