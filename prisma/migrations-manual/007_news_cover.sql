-- MIGRATION: news cover images for the WDSF-style redesign. Idempotent.
ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "coverUrl" TEXT;
