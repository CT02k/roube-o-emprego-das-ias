"use client";

import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import type { PromptDetail } from "@/lib/types";
import Image from "next/image";
import type { ReactNode } from "react";

type PromptResponseProps = {
  response: PromptDetail["response"];
  alt: string;
  footer?: ReactNode;
};

export function PromptResponse({ response, alt, footer }: PromptResponseProps) {
  if (!response) {
    return null;
  }

  return (
    <Message from="assistant">
      <MessageContent>
        {response.type === "text" ? (
          <MessageResponse>{response.text}</MessageResponse>
        ) : response.imageDataUrl ? (
          <Image
            alt={alt}
            className="max-h-[420px] w-full rounded-sm border border-border object-contain"
            height={420}
            src={response.imageDataUrl}
            unoptimized
            width={720}
          />
        ) : (
          <p className="text-muted-foreground text-sm">Resposta de imagem indisponivel.</p>
        )}
        {footer ? <div className="mt-3 flex justify-start">{footer}</div> : null}
      </MessageContent>
    </Message>
  );
}
