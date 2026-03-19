"use client";

import { HistoryList } from "@/components/history/history-list";
import { Button } from "@/components/ui/button";
import { useSessionId } from "@/hooks/use-session-id";
import { api } from "@/lib/client-api";
import type { HistoryListItem, HistorySort } from "@/lib/types";
import { ArrowDownWideNarrowIcon, FlameIcon, LoaderCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";

type HistoryFeedProps = {
  initialItems: HistoryListItem[];
  initialSort: HistorySort;
};

export function HistoryFeed({ initialItems, initialSort }: HistoryFeedProps) {
  const sessionId = useSessionId();
  const [items, setItems] = useState(initialItems);
  const [sort, setSort] = useState<HistorySort>(initialSort);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await api.listHistory(sort, sessionId);
        if (!cancelled) {
          setItems(result.items);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [sessionId, sort]);

  const onVoteChange = (itemId: string, viewerHasUpvoted: boolean, upvotesCount: number) => {
    setItems((current) => {
      const next = current.map((item) =>
        item.id === itemId ? { ...item, viewerHasUpvoted, upvotesCount } : item
      );

      if (sort !== "top") {
        return next;
      }

      return [...next].sort((left, right) => {
        if (right.upvotesCount !== left.upvotesCount) {
          return right.upvotesCount - left.upvotesCount;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => setSort("recent")}
          type="button"
          variant={sort === "recent" ? "default" : "outline"}
        >
          <ArrowDownWideNarrowIcon />
          Recentes
        </Button>
        <Button
          onClick={() => setSort("top")}
          type="button"
          variant={sort === "top" ? "default" : "outline"}
        >
          <FlameIcon />
          Em alta
        </Button>
        {isLoading && (
          <span className="inline-flex items-center gap-2 text-muted-foreground text-sm">
            <LoaderCircleIcon className="size-4 animate-spin" />
            Atualizando
          </span>
        )}
      </div>

      <HistoryList items={items} onVoteChange={onVoteChange} />
    </div>
  );
}
