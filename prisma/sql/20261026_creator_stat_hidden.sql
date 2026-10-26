-- Additive: creators removed from the stats pages (left the agency).
-- No stats rows are deleted — the profile is filtered out of every stats
-- view and future imports skip it. Owner can restore (row deleted here).
-- Created automatically by `prisma db push` on deploy; kept for reference.

CREATE TABLE IF NOT EXISTS "creator_stat_hidden" (
    "id" SERIAL PRIMARY KEY,
    "backstageCreatorId" VARCHAR(40) NOT NULL,
    "hiddenBy" INTEGER,
    "hiddenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "creator_stat_hidden_backstageCreatorId_key"
  ON "creator_stat_hidden"("backstageCreatorId");
