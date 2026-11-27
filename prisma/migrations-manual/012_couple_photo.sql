-- MIGRATION: couple photo. Idempotent.
ALTER TABLE "Partnership" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
