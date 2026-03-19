"use client";

import { useAdminContext } from "@/components/admin/admin-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/client-api";
import { AdminStats } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

const cardItems: Array<{
  key: keyof AdminStats;
  label: string;
  href: string;
  description: string;
}> = [
  {
    key: "pending",
    label: "Pendentes",
    href: "/admin/messages?status=pending&page=1",
    description: "Prompts aguardando humano",
  },
  {
    key: "inProgress",
    label: "Em andamento",
    href: "/admin/messages?status=in_progress&page=1",
    description: "Prompts reservados por workers",
  },
  {
    key: "responded",
    label: "Respondidos",
    href: "/admin/messages?status=responded&page=1",
    description: "Prompts finalizados",
  },
  {
    key: "todayTotal",
    label: "Total hoje",
    href: "/admin/messages?page=1",
    description: "Prompts criados no dia (UTC)",
  },
];

export default function AdminOverviewPage() {
  const { sessionId, adminToken } = useAdminContext();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await api.adminGetStats(sessionId, adminToken);
        if (!cancelled) {
          setStats(response);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao carregar estatisticas.");
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [adminToken, sessionId]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-semibold text-lg">Overview</h1>
        <p className="text-muted-foreground text-sm">
          Monitoramento rapido de fila e moderacao.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cardItems.map((item) => (
          <Link href={item.href} key={item.key}>
            <Card className="h-full hover:bg-muted/60">
              <CardHeader className="pb-3">
                <CardDescription>{item.description}</CardDescription>
                <CardTitle className="text-base">{item.label}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {stats ? (
                  <p className="font-semibold text-2xl">{stats[item.key]}</p>
                ) : (
                  <Skeleton className="h-8 w-20" />
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
