ALTER TABLE "interviews"
  ADD COLUMN "candidateJoinTokenHash" TEXT,
  ADD COLUMN "candidateJoinExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "interviews_candidateJoinTokenHash_key"
  ON "interviews"("candidateJoinTokenHash");
