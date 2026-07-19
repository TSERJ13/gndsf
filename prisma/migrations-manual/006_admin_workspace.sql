-- MIGRATION: admin workspace tasks (matches schema.prisma AdminTask). Idempotent.
CREATE TABLE IF NOT EXISTS "AdminTask" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "text" TEXT NOT NULL,
  "isDone" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AdminTask_userId_idx" ON "AdminTask"("userId");
