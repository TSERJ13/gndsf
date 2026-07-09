-- Bootstrap DDL matching prisma/schema.prisma (for environments where the
-- Prisma schema engine is unavailable). On a normal machine, prefer:
--   npx prisma migrate dev
-- Includes the Entry XOR check constraint mentioned in the schema comments.

CREATE TYPE "Gender" AS ENUM ('MALE','FEMALE');
CREATE TYPE "AgeCategory" AS ENUM ('JUVENILE_I','JUVENILE_II','JUNIOR_I','JUNIOR_II','YOUTH','ADULT');
CREATE TYPE "Discipline" AS ENUM ('STANDARD','LATIN');
CREATE TYPE "Format" AS ENUM ('SOLO','COUPLE');
CREATE TYPE "CompetitionType" AS ENUM ('NATIONAL','REGIONAL','INTERNATIONAL');
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN','PRESIDENT','VICE_PRESIDENT','GENERAL_SECRETARY','REGIONAL_REP','CLUB_MANAGER');

CREATE TABLE "Athlete" (
  "id" TEXT PRIMARY KEY,
  "minNumber" TEXT NOT NULL UNIQUE,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "firstNameEn" TEXT,
  "lastNameEn" TEXT,
  "birthDate" TIMESTAMP(3) NOT NULL,
  "gender" "Gender" NOT NULL,
  "photoUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Athlete_lastName_firstName_idx" ON "Athlete"("lastName","firstName");

CREATE TABLE "Club" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "nameEn" TEXT,
  "city" TEXT NOT NULL,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "logoUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ClubMembership" (
  "id" TEXT PRIMARY KEY,
  "athleteId" TEXT NOT NULL REFERENCES "Athlete"("id"),
  "clubId" TEXT NOT NULL REFERENCES "Club"("id"),
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3)
);
CREATE INDEX "ClubMembership_athleteId_endDate_idx" ON "ClubMembership"("athleteId","endDate");
CREATE INDEX "ClubMembership_clubId_endDate_idx" ON "ClubMembership"("clubId","endDate");

CREATE TABLE "Partnership" (
  "id" TEXT PRIMARY KEY,
  "leaderId" TEXT NOT NULL REFERENCES "Athlete"("id"),
  "followerId" TEXT NOT NULL REFERENCES "Athlete"("id"),
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3)
);
CREATE INDEX "Partnership_leaderId_endDate_idx" ON "Partnership"("leaderId","endDate");
CREATE INDEX "Partnership_followerId_endDate_idx" ON "Partnership"("followerId","endDate");

CREATE TABLE "Competition" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "nameEn" TEXT,
  "type" "CompetitionType" NOT NULL,
  "city" TEXT NOT NULL,
  "venue" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "pointsCoefficient" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CompEvent" (
  "id" TEXT PRIMARY KEY,
  "competitionId" TEXT NOT NULL REFERENCES "Competition"("id"),
  "ageCategory" "AgeCategory" NOT NULL,
  "discipline" "Discipline" NOT NULL,
  "format" "Format" NOT NULL,
  UNIQUE ("competitionId","ageCategory","discipline","format")
);

CREATE TABLE "Entry" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL REFERENCES "CompEvent"("id"),
  "athleteId" TEXT REFERENCES "Athlete"("id"),
  "partnershipId" TEXT REFERENCES "Partnership"("id"),
  "clubIdSnapshot" TEXT REFERENCES "Club"("id"),
  "ageCategorySnapshot" "AgeCategory" NOT NULL,
  "startNumber" INTEGER,
  -- exactly one participant kind per entry: solo XOR couple
  CONSTRAINT "Entry_participant_xor" CHECK (
    ("athleteId" IS NOT NULL AND "partnershipId" IS NULL) OR
    ("athleteId" IS NULL AND "partnershipId" IS NOT NULL)
  )
);
CREATE INDEX "Entry_eventId_idx" ON "Entry"("eventId");
CREATE INDEX "Entry_athleteId_idx" ON "Entry"("athleteId");
CREATE INDEX "Entry_partnershipId_idx" ON "Entry"("partnershipId");

CREATE TABLE "Result" (
  "id" TEXT PRIMARY KEY,
  "entryId" TEXT NOT NULL UNIQUE REFERENCES "Entry"("id"),
  "placement" INTEGER NOT NULL,
  "roundsReached" INTEGER
);

CREATE TABLE "RankingPoint" (
  "id" TEXT PRIMARY KEY,
  "resultId" TEXT NOT NULL REFERENCES "Result"("id"),
  "athleteId" TEXT NOT NULL REFERENCES "Athlete"("id"),
  "points" INTEGER NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL,
  "validUntil" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "RankingPoint_athleteId_validUntil_idx" ON "RankingPoint"("athleteId","validUntil");

CREATE TABLE "RankingEntry" (
  "id" TEXT PRIMARY KEY,
  "ageCategory" "AgeCategory" NOT NULL,
  "discipline" "Discipline" NOT NULL,
  "format" "Format" NOT NULL,
  "athleteId" TEXT REFERENCES "Athlete"("id"),
  "partnershipId" TEXT REFERENCES "Partnership"("id"),
  "totalPoints" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "prevPosition" INTEGER,
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "RankingEntry_board_idx" ON "RankingEntry"("ageCategory","discipline","format","position");

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "clubId" TEXT REFERENCES "Club"("id"),
  "region" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "News" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "titleEn" TEXT,
  "excerpt" TEXT,
  "body" TEXT NOT NULL,
  "bodyEn" TEXT,
  "coverUrl" TEXT,
  "publishedAt" TIMESTAMP(3),
  "authorId" TEXT REFERENCES "User"("id")
);
CREATE INDEX "News_publishedAt_idx" ON "News"("publishedAt");

CREATE TABLE "CalendarEvent" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "titleEn" TEXT,
  "city" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "isIntl" BOOLEAN NOT NULL DEFAULT false,
  "link" TEXT
);

CREATE TABLE "Document" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id"),
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
