"use client";

import { Queue, QueueItem, QueueItemContent } from "@/components/ai-elements/queue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppMode, PromptListItem } from "@/lib/types";
import { BellIcon, BellOffIcon } from "lucide-react";

const statusMeta = (item: Pick<PromptListItem, "status">) => {
  if (item.status === "responded") {
    return { label: "Respondido", variant: "default" as const };
  }
  if (item.status === "in_progress") {
    return { label: "Em espera...", variant: "secondary" as const };
  }
  return { label: "Em espera...", variant: "outline" as const };
};

type PromptSidebarProps = {
  mode: AppMode;
  list: PromptListItem[];
  adminList: PromptListItem[];
  selectedPromptId: string | null;
  notifyEnabled: boolean;
  notifyPermission: NotificationPermission;
  onEnableNotifications: () => Promise<void>;
  onSelectPrompt: (item: PromptListItem) => Promise<void>;
  onSelectAdminPrompt: (item: PromptListItem) => Promise<void>;
};

export function PromptSidebar({
  mode,
  list,
  adminList,
  selectedPromptId,
  notifyEnabled,
  notifyPermission,
  onEnableNotifications,
  onSelectPrompt,
  onSelectAdminPrompt,
}: PromptSidebarProps) {
  const items = mode === "admin" ? adminList : list;

  return (
    <aside className="flex min-h-0 max-h-80 flex-col rounded-sm border border-border bg-card p-3 lg:max-h-[calc(100svh-8rem)]">
      <p className="mb-2 px-1 font-medium text-sm">
        {mode === "admin" ? "Painel de moderacao" : "Fila de prompts"}
      </p>
      <Queue className="h-full border-none bg-transparent p-0 shadow-none">
        <div className="space-y-1 overflow-y-auto pr-1">
          {items.map((item) => {
            const meta = statusMeta(item);
            const active = item.id === selectedPromptId;
            return (
              <button
                className={cn(
                  "w-full rounded-sm border px-3 py-2 text-left transition",
                  active ? "border-border bg-accent" : "border-transparent bg-muted hover:bg-zinc-800"
                )}
                key={item.id}
                onClick={() =>
                  void (mode === "admin" ? onSelectAdminPrompt(item) : onSelectPrompt(item))
                }
                type="button"
              >
                <QueueItem className="w-full p-0 hover:bg-transparent">
                  <div className="flex items-start justify-between gap-2">
                    <QueueItemContent className="line-clamp-2 text-foreground">
                      {item.textPreview}
                    </QueueItemContent>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                </QueueItem>
              </button>
            );
          })}
          {items.length === 0 && (
            <div className="rounded-sm border border-dashed border-border p-4 text-muted-foreground text-sm">
              Sem mensagens por enquanto.
            </div>
          )}
        </div>
      </Queue>
      {mode === "worker" ? (
        <div className="mt-3 rounded-sm border border-border bg-background p-3">
          <p className="font-medium text-sm">Notificacoes de novos prompts</p>
          <p className="mt-1 text-muted-foreground text-xs">
            Receba um alerta quando novos prompts entrarem na fila.
          </p>
          <Button
            className="mt-3 w-full"
            onClick={() => void onEnableNotifications()}
            type="button"
            variant="outline"
          >
            {notifyEnabled && notifyPermission === "granted" ? (
              <>
                <BellIcon />
                Desativar notificações
              </>
            ) : (
              <>
                <BellOffIcon />
                Receber notificações
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="mt-3 rounded-sm border border-border bg-background p-3 text-xs text-muted-foreground">
          Use Ctrl + &apos; para desbloquear o painel admin.
        </div>
      )}
    </aside>
  );
}
