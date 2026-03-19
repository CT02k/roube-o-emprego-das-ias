import { HistoryList } from "@/components/history/history-list";
import { listHistory } from "@/lib/prompt-service";
import { ArrowLeftIcon, GalleryVerticalEndIcon } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Historico",
};

const linkButtonClassName =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-all hover:bg-muted hover:text-foreground";

export default async function HistoryPage() {
  const items = await listHistory();

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6">
      <header className="flex flex-col gap-4 rounded-sm border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <GalleryVerticalEndIcon className="size-4" />
            Historico publico
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Respostas humanas recentes</h1>
            <p className="text-muted-foreground text-sm">
              As melhores respostas ainda vao ganhar ranking. Por enquanto, aqui fica o historico.
            </p>
          </div>
        </div>
        <Link className={linkButtonClassName} href="/">
          <ArrowLeftIcon />
          Voltar
        </Link>
      </header>

      <HistoryList items={items} />
    </main>
  );
}
