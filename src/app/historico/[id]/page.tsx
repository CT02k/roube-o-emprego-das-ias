import { PromptResponse } from "@/components/home/prompt-response";
import { getHistoryDetail } from "@/lib/prompt-service";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const linkButtonClassName =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-all hover:bg-muted hover:text-foreground";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default async function HistoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getHistoryDetail(id);

  if (!item) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 px-4 py-4 sm:px-6">
      <header className="flex flex-col gap-4 rounded-sm border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Histórico publico</p>
          <h1 className="mt-1 text-xl font-semibold">Resposta humana arquivada</h1>
          <p className="mt-2 text-muted-foreground text-sm">{formatDate(item.createdAt)}</p>
        </div>
        <Link className={linkButtonClassName} href="/historico">
          <ArrowLeftIcon />
          Voltar ao historico
        </Link>
      </header>

      <section className="rounded-sm border border-border bg-card p-5">
        <p className="text-muted-foreground text-xs uppercase tracking-tight">Pergunta</p>
        <p className="mt-3 text-lg font-medium text-foreground">{item.promptText}</p>
      </section>

      <section className="rounded-sm border border-border bg-card p-5">
        <p className="text-muted-foreground text-xs uppercase tracking-tight">Resposta</p>
        <div className="mt-4">
          <PromptResponse alt="Resposta humana do histórico" response={item.response} />
        </div>
      </section>
    </main>
  );
}
