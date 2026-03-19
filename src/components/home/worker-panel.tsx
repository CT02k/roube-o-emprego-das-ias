"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { PromptResponse } from "@/components/home/prompt-response";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PromptDetail } from "@/lib/types";
import { BrushIcon, LoaderCircleIcon, User2Icon, UserPenIcon } from "lucide-react";
import Image from "next/image";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

type WorkerPanelProps = {
  selectedDetail: PromptDetail | null;
  isLoading: boolean;
  textDraft: string;
  imageDraftDataUrl: string | null;
  isSubmitting: boolean;
  canRespond: boolean;
  draftReady: boolean;
  onTextDraftChange: (value: string) => void;
  onComposerKeyDown: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
  onOpenCanvas: () => void;
  onClearImageDraft: () => void;
  onReleasePrompt: () => Promise<void>;
  onSubmitWorkerResponse: () => Promise<void>;
};

export function WorkerPanel({
  selectedDetail,
  isLoading,
  textDraft,
  imageDraftDataUrl,
  isSubmitting,
  canRespond,
  draftReady,
  onTextDraftChange,
  onComposerKeyDown,
  onOpenCanvas,
  onClearImageDraft,
  onReleasePrompt,
  onSubmitWorkerResponse,
}: WorkerPanelProps) {
  return (
    <>
      <Conversation className="min-h-0">
        <ConversationContent className="gap-6 p-5">
          {!selectedDetail && (
            <ConversationEmptyState
              description="Selecione um prompt na fila para responder."
              icon={isLoading ? <LoaderCircleIcon className="animate-spin" /> : <User2Icon />}
              title={isLoading ? "Carregando..." : "Nenhuma conversa selecionada"}
            />
          )}
          {selectedDetail && (
            <>
              <Message from="user">
                <MessageContent>{selectedDetail.text}</MessageContent>
              </Message>
              <PromptResponse
                alt="Desenho humano enviado como resposta"
                response={selectedDetail.response}
              />
            </>
          )}
        </ConversationContent>
      </Conversation>
      <div className="flex flex-col gap-3 rounded-sm border border-border bg-background p-3">
        <Textarea
          className="min-h-28 resize-none border-none bg-transparent p-2 shadow-none"
          disabled={!canRespond || isSubmitting}
          onChange={(event) => onTextDraftChange(event.target.value)}
          onKeyDown={onComposerKeyDown}
          placeholder="Responda como humano."
          value={textDraft}
        />
        {imageDraftDataUrl && (
          <div className="space-y-2 rounded-sm border border-border bg-muted p-3">
            <p className="text-xs">Desenho pronto para enviar:</p>
            <Image
              alt="Preview do desenho"
              className="max-h-48 rounded-sm border border-border object-contain"
              height={220}
              src={imageDraftDataUrl}
              unoptimized
              width={360}
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-auto flex flex-wrap gap-2">
            <Button
              disabled={!canRespond || isSubmitting}
              onClick={onOpenCanvas}
              type="button"
              variant="outline"
            >
              <BrushIcon />
              Gerar imagem
            </Button>
            <Button
              disabled={!canRespond || isSubmitting}
              onClick={onClearImageDraft}
              type="button"
              variant="ghost"
            >
              Limpar rascunho
            </Button>
            <Button
              disabled={!canRespond || isSubmitting}
              onClick={() => void onReleasePrompt()}
              type="button"
              variant="ghost"
            >
              Devolver para fila
            </Button>
          </div>
          <p className="mr-2 ml-auto text-muted-foreground text-xs">Ctrl + Enter para enviar</p>
          <Button
            disabled={!draftReady || !canRespond || isSubmitting}
            onClick={() => void onSubmitWorkerResponse()}
            type="button"
          >
            <UserPenIcon />
            Responder
          </Button>
        </div>
      </div>
    </>
  );
}
