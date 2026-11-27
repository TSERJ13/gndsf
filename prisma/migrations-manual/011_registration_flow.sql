-- MIGRATION: registration workflow, half points, couple clubs, invites.
-- Idempotent. Run on production BEFORE deploying the code that uses it.

-- 1) Points tables contain 0.5 values: points must not be integers.
ALTER TABLE "RankingPoint" ALTER COLUMN "points" TYPE DOUBLE PRECISION;
ALTER TABLE "RankingEntry" ALTER COLUMN "totalPoints" TYPE DOUBLE PRECISION;

-- 2) Athlete registration status + contact (existing athletes = approved).
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "status" "RegistrationStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "reviewNote" TEXT;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "submittedById" TEXT;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "parentName" TEXT;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "parentEmail" TEXT;
ALTER TABLE "Athlete" ADD COLUMN IF NOT EXISTS "parentPhone" TEXT;
CREATE INDEX IF NOT EXISTS "Athlete_status_idx" ON "Athlete"("status");

-- 3) The club(s) a couple represents.
ALTER TABLE "Partnership" ADD COLUMN IF NOT EXISTS "clubId" TEXT;
ALTER TABLE "Partnership" ADD COLUMN IF NOT EXISTS "secondClubId" TEXT;
DO $$ BEGIN
  ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_clubId_fkey"
    FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_secondClubId_fkey"
    FOREIGN KEY ("secondClubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Existing active couples: represent the leader's current club.
UPDATE "Partnership" p SET "clubId" = m."clubId"
FROM "ClubMembership" m
WHERE p."clubId" IS NULL AND m."athleteId" = p."leaderId" AND m."endDate" IS NULL;

-- 4) Reason shown to a studio whose application was rejected.
ALTER TABLE "ClubRegistration" ADD COLUMN IF NOT EXISTS "rejectReason" TEXT;

-- 5) One-time invite / password-reset links (hash only).
CREATE TABLE IF NOT EXISTS "AuthToken" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "purpose"   TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AuthToken_userId_idx" ON "AuthToken"("userId");
-- Supabase exposes "public" over its REST API; the app uses Prisma as
-- "postgres" (bypasses RLS), so RLS without policies locks the API out.
ALTER TABLE "AuthToken" ENABLE ROW LEVEL SECURITY;
