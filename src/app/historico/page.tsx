import { HistoryFeed } from "@/components/history/history-feed";
import { PublicHeader } from "@/components/site/public-header";
import { listHistory } from "@/lib/prompt-service";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Ranking",
};

const linkButtonClassName =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-all hover:bg-muted hover:text-foreground";

export default async function HistoryPage() {
  const items = await listHistory("hot");

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 overflow-x-hidden px-4 py-4 sm:px-6">
      <PublicHeader
        actions={
          <Link className={linkButtonClassName} href="/">
            <ArrowLeftIcon />
            Voltar
          </Link>
        }
        currentPage="Ranking"
        title="Ranking"
      />

      <HistoryFeed initialItems={items} initialSort="hot" />
    </main>
  );
}
