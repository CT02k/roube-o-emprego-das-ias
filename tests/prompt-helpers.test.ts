import { describe, expect, it } from "vitest";
import { normalizeStatus, isClaimExpired, toPromptListItem } from "@/lib/prompt-helpers";

const basePrompt = {
  id: "prompt_1",
  text: "Explique computacao quantica com uma receita de bolo.",
  status: "pending" as const,
  requesterSessionId: "humano_1",
  claimedBySessionId: null,
  claimedAt: null,
  createdAt: new Date("2026-01-10T12:00:00.000Z"),
  updatedAt: new Date("2026-01-10T12:00:00.000Z"),
};

describe("prompt helpers", () => {
  it("marca claim como expirado apos 5 minutos", () => {
    const claimedAt = new Date("2026-01-10T12:00:00.000Z");
    const now = new Date("2026-01-10T12:05:01.000Z");
    expect(isClaimExpired(claimedAt, now)).toBe(true);
  });

  it("normaliza status in_progress expirado para pending", () => {
    const status = normalizeStatus({
      ...basePrompt,
      status: "in_progress",
      claimedAt: new Date("2026-01-10T12:00:00.000Z"),
    });

    expect(status).toBe("pending");
  });

  it("inclui responseType e respondedAt quando ja respondido", () => {
    const item = toPromptListItem({
      ...basePrompt,
      status: "responded",
      response: {
        id: "resp_1",
        promptId: "prompt_1",
        type: "image",
        text: null,
        imageDataUrl: "data:image/png;base64,abc",
        responderSessionId: "humano_2",
        createdAt: new Date("2026-01-10T12:03:00.000Z"),
      },
    });

    expect(item.status).toBe("responded");
    expect(item.responseType).toBe("image");
    expect(item.respondedAt).toBe("2026-01-10T12:03:00.000Z");
  });
});
