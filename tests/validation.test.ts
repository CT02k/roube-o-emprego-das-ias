import { describe, expect, it } from "vitest";
import { createPromptSchema, submitResponseSchema } from "@/lib/validation";

describe("validation", () => {
  it("aceita prompt com texto nao vazio", () => {
    const parsed = createPromptSchema.safeParse({ text: "Oi humano" });
    expect(parsed.success).toBe(true);
  });

  it("rejeita resposta sem payload valido", () => {
    const parsed = submitResponseSchema.safeParse({
      type: "image",
      imageDataUrl: "http://example.com/image.png",
    });
    expect(parsed.success).toBe(false);
  });

  it("aceita resposta de texto", () => {
    const parsed = submitResponseSchema.safeParse({
      type: "text",
      text: "Resposta artesanal.",
    });
    expect(parsed.success).toBe(true);
  });
});
