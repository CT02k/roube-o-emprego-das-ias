"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { PromptResponse } from "@/components/home/prompt-response";
import { ReportButton } from "@/components/report-button";
import { Button } from "@/components/ui/button";
import type { PromptDetail, PromptListItem } from "@/lib/types";
import { BellIcon, LoaderCircleIcon, User2Icon } from "lucide-react";

const statusMeta = (item: Pick<PromptListItem, "status">) => {
  if (item.status === "responded") {
    return { label: "Respondido" };
  }
  return { label: "Em espera..." };
};

type RequesterPanelProps = {
  sessionId: string;
  requesterThread: PromptDetail[];
  isLoading: boolean;
  notifyEnabled: boolean;
  notifyPermission: NotificationPermission;
  onEnableNotifications: () => Promise<void>;
};

export function RequesterPanel({
  sessionId,
  requesterThread,
  isLoading,
  notifyEnabled,
  notifyPermission,
  onEnableNotifications,
}: RequesterPanelProps) {
  return (
    <Conversation className="min-h-0">
      <ConversationContent className="gap-6 p-5">
        {requesterThread.length === 0 && (
          <ConversationEmptyState
            description="Envie um prompt para alguém responder."
            icon={isLoading ? <LoaderCircleIcon className="animate-spin" /> : <User2Icon />}
            title={isLoading ? "Carregando..." : "Conversa vazia"}
          />
        )}
        {requesterThread.map((entry) => (
          <div className="space-y-3" key={entry.id}>
            <div className="space-y-2">
              <Message from="user">
                <MessageContent>{entry.text}</MessageContent>
              </Message>
              <div className="flex justify-end">
                <ReportButton compact sessionId={sessionId} targetId={entry.id} targetType="prompt" />
              </div>
            </div>
            {entry.response ? (
              <PromptResponse
                alt="Desenho humano enviado como resposta"
                footer={
                  <div className="flex justify-end">
                    <ReportButton
                      compact
                      sessionId={sessionId}
                      targetId={entry.response.id}
                      targetType="response"
                    />
                  </div>
                }
                response={entry.response}
              />
            ) : (
              <div className="rounded-sm border border-dashed border-border bg-muted p-4 text-muted-foreground text-sm">
                <Shimmer className="font-medium text-sm" duration={1.8}>
                  {statusMeta({ status: entry.status }).label}
                </Shimmer>
                <p className="mt-1">
                  {notifyEnabled && notifyPermission === "granted"
                    ? "Te avisamos quando alguem responder."
                    : "Ative notificações para ser avisado quando responderem."}
                </p>
                {!(notifyEnabled && notifyPermission === "granted") && (
                  <Button
                    className="mt-3"
                    onClick={() => void onEnableNotifications()}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <BellIcon />
                    Receber notificações
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </ConversationContent>
    </Conversation>
  );
}
