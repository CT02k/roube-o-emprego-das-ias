import { HistoryDetailView } from "@/components/history/history-detail-view";
import { PublicHeader } from "@/components/site/public-header";
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

export default async function HistoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getHistoryDetail(id);

  if (!item) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 overflow-x-hidden px-4 py-4 sm:px-6">
      <PublicHeader
        actions={
          <Link className={linkButtonClassName} href="/historico">
            <ArrowLeftIcon />
            Voltar ao ranking
          </Link>
        }
        currentPage="Resposta"
        description="Abra a resposta, vote e continue navegando sem perder o contexto."
        title="Resposta humana"
      />

      <HistoryDetailView initialItem={item} />
    </main>
  );
}
