-- CreateTable
CREATE TABLE "SessionIdentity" (
    "sessionId" TEXT NOT NULL,
    "ipHash" TEXT,
    "ipSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastIpAt" TIMESTAMP(3),

    CONSTRAINT "SessionIdentity_pkey" PRIMARY KEY ("sessionId")
);

-- CreateIndex
CREATE INDEX "SessionIdentity_ipHash_idx" ON "SessionIdentity"("ipHash");

-- CreateIndex
CREATE INDEX "SessionIdentity_lastSeenAt_idx" ON "SessionIdentity"("lastSeenAt" DESC);
