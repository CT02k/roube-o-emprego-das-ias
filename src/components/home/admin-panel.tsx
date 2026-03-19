"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { PromptResponse } from "@/components/home/prompt-response";
import { Button } from "@/components/ui/button";
import type { PromptDetail, PromptListItem } from "@/lib/types";
import { LoaderCircleIcon, ShieldIcon, Trash2Icon, UnlockIcon } from "lucide-react";

type AdminPanelProps = {
  selectedDetail: PromptDetail | null;
  adminList: PromptListItem[];
  isLoading: boolean;
  selectedPromptId: string | null;
  adminToken: string | null;
  isSubmitting: boolean;
  onReopen: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export function AdminPanel({
  selectedDetail,
  adminList,
  isLoading,
  selectedPromptId,
  adminToken,
  isSubmitting,
  onReopen,
  onDelete,
}: AdminPanelProps) {
  return (
    <>
      <Conversation className="min-h-0">
        <ConversationContent className="gap-6 p-5">
          {!selectedDetail && (
            <ConversationEmptyState
              description="Selecione um prompt para moderar."
              icon={isLoading ? <LoaderCircleIcon className="animate-spin" /> : <ShieldIcon />}
              title={isLoading ? "Carregando..." : "Nenhum prompt selecionado"}
            />
          )}
          {selectedDetail && (
            <div className="space-y-3">
              <Message from="user">
                <MessageContent>{selectedDetail.text}</MessageContent>
              </Message>
              {selectedDetail.response ? (
                <PromptResponse alt="Resposta em imagem" response={selectedDetail.response} />
              ) : (
                <div className="rounded-sm border border-dashed border-border bg-muted p-4 text-muted-foreground text-sm">
                  Sem resposta ainda.
                </div>
              )}
              <div className="rounded-sm border border-border bg-muted p-3 text-xs text-muted-foreground">
                <p>ID do prompt: {selectedDetail.id}</p>
                <p>
                  Solicitante:{" "}
                  {adminList.find((item) => item.id === selectedDetail.id)?.requesterSessionId ?? "-"}
                </p>
                <p>
                  Claimer:{" "}
                  {adminList.find((item) => item.id === selectedDetail.id)?.claimedBySessionId ?? "-"}
                </p>
                <p>
                  Respondedor:{" "}
                  {adminList.find((item) => item.id === selectedDetail.id)?.responderSessionId ?? "-"}
                </p>
                <p>Criado em: {new Date(selectedDetail.createdAt).toLocaleString("pt-BR")}</p>
              </div>
            </div>
          )}
        </ConversationContent>
      </Conversation>
      <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border bg-background p-3">
        <p className="mr-auto text-muted-foreground text-xs">
          Moderacao: reabra prompts ou exclua definitivamente.
        </p>
        <Button
          disabled={!selectedPromptId || !adminToken || isSubmitting}
          onClick={() => void onReopen()}
          type="button"
          variant="outline"
        >
          <UnlockIcon />
          Reabrir para fila
        </Button>
        <Button
          disabled={!selectedPromptId || !adminToken || isSubmitting}
          onClick={() => void onDelete()}
          type="button"
          variant="destructive"
        >
          <Trash2Icon />
          Excluir
        </Button>
      </div>
    </>
  );
}
