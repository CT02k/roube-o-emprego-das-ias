-- AlterTable
ALTER TABLE "PromptResponse" ADD COLUMN     "upvotesCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PromptResponseVote" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptResponseVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromptResponseVote_responseId_idx" ON "PromptResponseVote"("responseId");

-- CreateIndex
CREATE INDEX "PromptResponseVote_createdAt_idx" ON "PromptResponseVote"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PromptResponseVote_responseId_sessionId_key" ON "PromptResponseVote"("responseId", "sessionId");

-- AddForeignKey
ALTER TABLE "PromptResponseVote" ADD CONSTRAINT "PromptResponseVote_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "PromptResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
