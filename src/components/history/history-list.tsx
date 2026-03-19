import { HistoryCard } from "@/components/history/history-card";
import type { HistoryListItem } from "@/lib/types";

type HistoryListProps = {
  items: HistoryListItem[];
};

export function HistoryList({ items }: HistoryListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
        <p className="font-medium text-foreground">Ainda nao ha respostas historicas.</p>
        <p className="mt-2 text-muted-foreground text-sm">
          Assim que responderem prompts, elas aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <HistoryCard item={item} key={item.id} />
      ))}
    </div>
  );
}
