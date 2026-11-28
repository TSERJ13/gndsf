-- Studio may attach its logo when applying; copied to the club on approval.
ALTER TABLE "ClubRegistration" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
