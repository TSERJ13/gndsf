import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const comp = await prisma.competition.create({
    data: {
      name: "თბილისის ღია პირველობა",
      nameEn: "Tbilisi Open",
      city: "თბილისი",
      type: "NATIONAL",
      startDate: new Date("2026-08-09T00:00:00Z"),
      isPublished: true,
      events: {
        create: [
          { ageCategory: "ADULT", discipline: "LATIN", format: "COUPLE" },
          { ageCategory: "JUNIOR_II", discipline: "STANDARD", format: "COUPLE" },
        ]
      }
    }
  });
  console.log("Created competition:", comp);
}

main().catch(console.error).finally(() => prisma.$disconnect());
