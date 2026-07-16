-- MIGRATION: in-admin mailbox (v0.15). Run once on production before deploy.
CREATE TABLE "MailAccount" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id"),
  "email" TEXT NOT NULL,
  "encSecret" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
