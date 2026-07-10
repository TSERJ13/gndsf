-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Athlete Portal (GID + ATHLETE role)  ·  v0.3 → v0.4
-- Run this ONCE against the production database BEFORE deploying
-- the new code (Neon/Vercel Postgres → SQL Editor, or:
--   psql "$DATABASE_URL" -f prisma/migrations-manual/001_athlete_portal.sql )
-- Safe: renames one column, adds one enum value, adds one column.
-- No data is modified or deleted.
-- ═══════════════════════════════════════════════════════════════

-- 1) MIN → GID (values like GEO-1001 keep working; only the column
--    name changes — update stored values separately if you want the
--    GID- prefix, see step 3)
ALTER TABLE "Athlete" RENAME COLUMN "minNumber" TO "gid";

-- 2) New role + portal link
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ATHLETE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "athleteId" TEXT UNIQUE REFERENCES "Athlete"("id");

-- 3) OPTIONAL: rebrand existing numbers from GEO- to GID- prefix
UPDATE "Athlete" SET "gid" = REPLACE("gid", 'GEO-', 'GID-') WHERE "gid" LIKE 'GEO-%';
