"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import type { HistoryListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, FlameIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type HistoryHighlightsProps = {
  sessionId: string;
  className?: string;
};

export function HistoryHighlights({ sessionId, className }: HistoryHighlightsProps) {
  const [items, setItems] = useState<HistoryListItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = await api.listHistory("hot", sessionId);
        if (!cancelled) {
          setItems(result.items.slice(0, 3));
        }
      } catch {
        if (!cancelled) {
          setItems([]);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-3 rounded-sm border border-border bg-card p-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FlameIcon className="size-4" />
            Em alta
          </div>
          <p className="mt-1 text-sm text-foreground">
            Respostas que a galera está empurrando para o topo.
          </p>
        </div>
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/historico">
          Ver ranking
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-1">
        {items.map((item) => (
          <Link
            className="rounded-sm border border-border bg-background/70 p-4 transition-colors hover:bg-muted/30"
            href={`/historico/${item.id}`}
            key={item.id}
          >
            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary">
                {item.response.type === "image" ? "Desenho" : "Texto"}
              </Badge>
              <span className="inline-flex items-center gap-1 text-muted-foreground text-sm">
                <ArrowUpIcon className="size-4" />
                {item.upvotesCount}
              </span>
            </div>
            <p className="mt-3 line-clamp-2 font-medium text-foreground">{item.promptText}</p>
            <p
              className={cn(
                "mt-2 text-sm text-muted-foreground",
                item.response.type === "text" && "line-clamp-2"
              )}
            >
              {item.response.type === "text"
                ? item.response.text ?? "Resposta sem texto."
                : "Abrir desenho humano"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
