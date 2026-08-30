-- MIGRATION: dance class (solo) and couple category fields on CompEvent,
-- needed so result-commit can look up points in the federation's
-- confirmed scoring table (src/lib/points.ts). Idempotent.
-- Run this on production BEFORE deploying the code that uses it.

DO $$ BEGIN
  CREATE TYPE "DanceClass" AS ENUM ('A','B','C','D');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CoupleCategory" AS ENUM (
    'SIX_DANCE','RIZING_STAR','JUVENILE_1_2','JUNIOR_1','JUNIOR_2','YOUTH','ADULT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CompEvent" ADD COLUMN IF NOT EXISTS "danceClass" "DanceClass";
ALTER TABLE "CompEvent" ADD COLUMN IF NOT EXISTS "coupleCategory" "CoupleCategory";

-- Widen the old 4-column unique constraint to include the two new columns,
-- so distinct classes/categories can coexist as separate events.
-- (Short, explicit name — the auto-generated 6-column name is over the
-- 63-byte Postgres identifier limit and gets silently truncated, which
-- breaks the "already exists" check on a second run.)
ALTER TABLE "CompEvent"
  DROP CONSTRAINT IF EXISTS "CompEvent_competitionId_ageCategory_discipline_format_key";

ALTER TABLE "CompEvent" DROP CONSTRAINT IF EXISTS "CompEvent_scoring_key";
ALTER TABLE "CompEvent" ADD CONSTRAINT "CompEvent_scoring_key"
  UNIQUE ("competitionId","ageCategory","discipline","format","danceClass","coupleCategory");
