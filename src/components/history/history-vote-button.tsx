"use client";

import { Button } from "@/components/ui/button";
import { useSessionId } from "@/hooks/use-session-id";
import { api } from "@/lib/client-api";
import type { HistoryListItem } from "@/lib/types";
import { ArrowBigUpIcon } from "lucide-react";
import { useState } from "react";

type HistoryVoteButtonProps = {
  item: Pick<HistoryListItem, "id" | "upvotesCount" | "viewerHasUpvoted">;
  onVoteChange: (itemId: string, viewerHasUpvoted: boolean, upvotesCount: number) => void;
};

export function HistoryVoteButton({ item, onVoteChange }: HistoryVoteButtonProps) {
  const sessionId = useSessionId();
  const [isBusy, setIsBusy] = useState(false);

  const onToggleVote = async () => {
    if (isBusy) {
      return;
    }

    setIsBusy(true);

    const nextViewerHasUpvoted = !item.viewerHasUpvoted;
    const optimisticCount = item.upvotesCount + (nextViewerHasUpvoted ? 1 : -1);
    onVoteChange(item.id, nextViewerHasUpvoted, Math.max(0, optimisticCount));

    try {
      const result = item.viewerHasUpvoted
        ? await api.removeHistoryUpvote(item.id, sessionId)
        : await api.addHistoryUpvote(item.id, sessionId);
      onVoteChange(item.id, result.viewerHasUpvoted, result.upvotesCount);
    } catch {
      onVoteChange(item.id, item.viewerHasUpvoted, item.upvotesCount);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Button
      onClick={() => void onToggleVote()}
      size="sm"
      type="button"
      variant={item.viewerHasUpvoted ? "default" : "outline"}
    >
      <ArrowBigUpIcon />
      {item.upvotesCount}
    </Button>
  );
}
