-- MIGRATION: public studio (club) self-registration + approval workflow.
-- Idempotent. Run this on production BEFORE deploying the code that uses it.
CREATE TABLE IF NOT EXISTS "ClubRegistration" (
  "id"            TEXT PRIMARY KEY,
  "status"        "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
  "name"          TEXT NOT NULL,
  "nameEn"        TEXT,
  "city"          TEXT NOT NULL,
  "address"       TEXT,
  "phone"         TEXT,
  "contactName"   TEXT NOT NULL,
  "email"         TEXT NOT NULL UNIQUE,
  "passwordHash"  TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt"    TIMESTAMP(3),
  "reviewedById"  TEXT REFERENCES "User"("id"),
  "createdClubId" TEXT REFERENCES "Club"("id")
);

CREATE INDEX IF NOT EXISTS "ClubRegistration_status_idx" ON "ClubRegistration"("status");
