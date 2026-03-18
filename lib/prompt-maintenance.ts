import { CLAIM_TTL_MS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const releaseExpiredPromptClaims = async (now = new Date()) => {
  const cutoff = new Date(now.getTime() - CLAIM_TTL_MS);

  await prisma.prompt.updateMany({
    where: {
      status: "in_progress",
      claimedAt: {
        lt: cutoff,
      },
    },
    data: {
      status: "pending",
      claimedAt: null,
      claimedBySessionId: null,
    },
  });
};
