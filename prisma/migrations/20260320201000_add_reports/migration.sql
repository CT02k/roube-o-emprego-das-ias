-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('prompt', 'response');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('spam', 'harassment', 'hateful', 'sexual', 'violence', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'dismissed', 'actioned');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reporterSessionId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "promptId" TEXT,
    "responseId" TEXT,
    "snapshotPromptText" TEXT,
    "snapshotResponseText" TEXT,
    "snapshotResponseType" "ResponseType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBySessionId" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_reporterSessionId_targetType_targetId_key" ON "Report"("reporterSessionId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Report_promptId_idx" ON "Report"("promptId");

-- CreateIndex
CREATE INDEX "Report_responseId_idx" ON "Report"("responseId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "PromptResponse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterSessionId_fkey" FOREIGN KEY ("reporterSessionId") REFERENCES "SessionIdentity"("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE;
