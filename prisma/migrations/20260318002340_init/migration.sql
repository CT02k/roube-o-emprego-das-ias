-- CreateEnum
CREATE TYPE "PromptStatus" AS ENUM ('pending', 'in_progress', 'responded');

-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('text', 'image');

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "PromptStatus" NOT NULL DEFAULT 'pending',
    "requesterSessionId" TEXT NOT NULL,
    "claimedBySessionId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptResponse" (
    "id" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "type" "ResponseType" NOT NULL,
    "text" TEXT,
    "imageDataUrl" TEXT,
    "responderSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prompt_requesterSessionId_createdAt_idx" ON "Prompt"("requesterSessionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Prompt_status_createdAt_idx" ON "Prompt"("status", "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PromptResponse_promptId_key" ON "PromptResponse"("promptId");

-- AddForeignKey
ALTER TABLE "PromptResponse" ADD CONSTRAINT "PromptResponse_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
