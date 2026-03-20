import { z } from "zod";

export const createPromptSchema = z.object({
  text: z.string().trim().min(1, "Prompt vazio."),
});

export const submitResponseSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string().trim().min(1, "Resposta vazia."),
  }),
  z.object({
    type: z.literal("image"),
    imageDataUrl: z.string().startsWith("data:image/", "Imagem invalida."),
  }),
]);

export const createReportSchema = z.object({
  targetType: z.enum(["prompt", "response"]),
  targetId: z.string().trim().min(1, "Alvo inválido."),
  reason: z.enum(["spam", "harassment", "hateful", "sexual", "violence", "other"]),
  details: z.string().trim().max(1000, "Detalhes muito longos.").optional(),
});

export const reviewReportSchema = z.object({
  status: z.enum(["open", "dismissed", "actioned"]),
});
