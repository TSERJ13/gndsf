import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Applying migration 009_scoring_categories.sql to database...');

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "DanceClass" AS ENUM ('A','B','C','D');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "CoupleCategory" AS ENUM (
        'SIX_DANCE','RIZING_STAR','JUVENILE_1_2','JUNIOR_1','JUNIOR_2','YOUTH','ADULT'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CompEvent" ADD COLUMN IF NOT EXISTS "danceClass" "DanceClass";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CompEvent" ADD COLUMN IF NOT EXISTS "coupleCategory" "CoupleCategory";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CompEvent" DROP CONSTRAINT IF EXISTS "CompEvent_competitionId_ageCategory_discipline_format_key";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CompEvent" DROP CONSTRAINT IF EXISTS "CompEvent_scoring_key";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CompEvent" ADD CONSTRAINT "CompEvent_scoring_key"
      UNIQUE ("competitionId","ageCategory","discipline","format","danceClass","coupleCategory");
  `);

  console.log('✓ Successfully applied migration 009_scoring_categories.sql!');
}

main()
  .catch((e) => {
    console.error('Migration 009 failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
