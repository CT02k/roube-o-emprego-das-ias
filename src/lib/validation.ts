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
