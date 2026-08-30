import { PrismaClient, AgeCategory, Discipline, Format, CompetitionType, Gender } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting DB seeding for 3 Dance Studios and Competitions with Results...');

  // 1. Create 3 Dance Studios / Clubs
  const club1 = await prisma.club.create({
    data: {
      name: 'კლუბი ელიტი',
      nameEn: 'Studio Elite',
      city: 'თბილისი',
      address: 'ი. ჭავჭავაძის გამზირი 34',
      phone: '+995 599 112 233',
      email: 'elite@gndsf.ge',
      logoUrl: '/brand/logo-header@2x.png',
      isActive: true,
    },
  });

  const club2 = await prisma.club.create({
    data: {
      name: 'კლუბი რითმი',
      nameEn: 'Club Rhythm',
      city: 'ბათუმი',
      address: 'რუსთაველის გამზირი 18',
      phone: '+995 595 445 566',
      email: 'rhythm@gndsf.ge',
      logoUrl: '/brand/logo-header@2x.png',
      isActive: true,
    },
  });

  const club3 = await prisma.club.create({
    data: {
      name: 'კლუბი დინამო',
      nameEn: 'Studio Dinamo',
      city: 'ქუთაისი',
      address: 'აკაკი წერეთლის ქუჩა 12',
      phone: '+995 577 889 900',
      email: 'dinamo@gndsf.ge',
      logoUrl: '/brand/logo-header@2x.png',
      isActive: true,
    },
  });

  console.log(`Created 3 Clubs: ${club1.name}, ${club2.name}, ${club3.name}`);

  // Helper date function
  const date = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

  // 2. Create Test Athletes
  // Pair 1 (Club 1 - Elite) - Adult
  const a1 = await prisma.athlete.create({
    data: {
      gid: `GEO-${Math.floor(100000 + Math.random() * 900000)}`,
      firstName: 'დავით',
      lastName: 'გიორგაძე',
      firstNameEn: 'Davit',
      lastNameEn: 'Giorgadze',
      birthDate: date(2000, 5, 12),
      gender: Gender.MALE,
      personalNumber: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
      isActive: true,
      clubMemberships: { create: { clubId: club1.id, startDate: date(2022, 1, 1) } },
    },
  });

  const a2 = await prisma.athlete.create({
    data: {
      gid: `GEO-${Math.floor(100000 + Math.random() * 900000)}`,
      firstName: 'ნინო',
      lastName: 'ბერიძე',
      firstNameEn: 'Nino',
      lastNameEn: 'Beridze',
      birthDate: date(2001, 8, 20),
      gender: Gender.FEMALE,
      personalNumber: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
      isActive: true,
      clubMemberships: { create: { clubId: club1.id, startDate: date(2022, 1, 1) } },
    },
  });

  // Pair 2 (Club 2 - Rhythm) - Adult
  const a3 = await prisma.athlete.create({
    data: {
      gid: `GEO-${Math.floor(100000 + Math.random() * 900000)}`,
      firstName: 'გიორგი',
      lastName: 'კაპანაძე',
      firstNameEn: 'Giorgi',
      lastNameEn: 'Kapanadze',
      birthDate: date(1999, 11, 4),
      gender: Gender.MALE,
      personalNumber: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
      isActive: true,
      clubMemberships: { create: { clubId: club2.id, startDate: date(2023, 3, 15) } },
    },
  });

  const a4 = await prisma.athlete.create({
    data: {
      gid: `GEO-${Math.floor(100000 + Math.random() * 900000)}`,
      firstName: 'ანი',
      lastName: 'მელაძე',
      firstNameEn: 'Ani',
      lastNameEn: 'Meladze',
      birthDate: date(2002, 2, 18),
      gender: Gender.FEMALE,
      personalNumber: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
      isActive: true,
      clubMemberships: { create: { clubId: club2.id, startDate: date(2023, 3, 15) } },
    },
  });

  // Pair 3 (Club 3 - Dinamo) - Junior II
  const a5 = await prisma.athlete.create({
    data: {
      gid: `GEO-${Math.floor(100000 + Math.random() * 900000)}`,
      firstName: 'ლაშა',
      lastName: 'კვარაცხელია',
      firstNameEn: 'Lasha',
      lastNameEn: 'Kvaratskhelia',
      birthDate: date(2010, 7, 9),
      gender: Gender.MALE,
      personalNumber: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
      isActive: true,
      clubMemberships: { create: { clubId: club3.id, startDate: date(2024, 1, 10) } },
    },
  });

  const a6 = await prisma.athlete.create({
    data: {
      gid: `GEO-${Math.floor(100000 + Math.random() * 900000)}`,
      firstName: 'მარიამ',
      lastName: 'წერეთელი',
      firstNameEn: 'Mariam',
      lastNameEn: 'Tsereteli',
      birthDate: date(2011, 4, 30),
      gender: Gender.FEMALE,
      personalNumber: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
      isActive: true,
      clubMemberships: { create: { clubId: club3.id, startDate: date(2024, 1, 10) } },
    },
  });

  console.log('Created 6 Test Athletes');

  // Create Active Partnerships
  const p1 = await prisma.partnership.create({
    data: { leaderId: a1.id, followerId: a2.id, startDate: date(2022, 1, 1) },
  });

  const p2 = await prisma.partnership.create({
    data: { leaderId: a3.id, followerId: a4.id, startDate: date(2023, 3, 15) },
  });

  const p3 = await prisma.partnership.create({
    data: { leaderId: a5.id, followerId: a6.id, startDate: date(2024, 1, 10) },
  });

  console.log('Created 3 Active Partnerships');

  // 3. Create Competitions with Categories & Results
  // Competition 1: Georgian National Championship 2026 (Tbilisi)
  const comp1 = await prisma.competition.create({
    data: {
      name: 'საქართველოს ეროვნული ჩემპიონატი 2026',
      nameEn: 'Georgian National Championship 2026',
      type: CompetitionType.NATIONAL,
      city: 'თბილისი',
      venue: 'თბილისის სპორტის სასახლე',
      startDate: date(2026, 9, 20),
      endDate: date(2026, 9, 21),
      pointsCoefficient: 1.5,
      isPublished: true,
    },
  });

  // Events for Competition 1
  const event1 = await prisma.compEvent.create({
    data: {
      competitionId: comp1.id,
      ageCategory: AgeCategory.ADULT,
      discipline: Discipline.LATIN,
      format: Format.COUPLE,
    },
  });

  const event2 = await prisma.compEvent.create({
    data: {
      competitionId: comp1.id,
      ageCategory: AgeCategory.JUNIOR_II,
      discipline: Discipline.STANDARD,
      format: Format.COUPLE,
    },
  });

  // Entry & Result for Event 1 (Adult Latin Couple)
  const entry1 = await prisma.entry.create({
    data: {
      eventId: event1.id,
      partnershipId: p1.id,
      clubIdSnapshot: club1.id,
      ageCategorySnapshot: AgeCategory.ADULT,
      startNumber: 101,
      result: {
        create: {
          placement: 1,
          roundsReached: 3,
        },
      },
    },
    include: { result: true },
  });

  const entry2 = await prisma.entry.create({
    data: {
      eventId: event1.id,
      partnershipId: p2.id,
      clubIdSnapshot: club2.id,
      ageCategorySnapshot: AgeCategory.ADULT,
      startNumber: 102,
      result: {
        create: {
          placement: 2,
          roundsReached: 3,
        },
      },
    },
    include: { result: true },
  });

  // Entry & Result for Event 2 (Junior II Standard)
  const entry3 = await prisma.entry.create({
    data: {
      eventId: event2.id,
      partnershipId: p3.id,
      clubIdSnapshot: club3.id,
      ageCategorySnapshot: AgeCategory.JUNIOR_II,
      startNumber: 201,
      result: {
        create: {
          placement: 1,
          roundsReached: 2,
        },
      },
    },
    include: { result: true },
  });

  // Ranking Points & RankingEntries
  const oneYearLater = new Date(Date.now() + 365 * 86400 * 1000);

  if (entry1.result) {
    await prisma.rankingPoint.createMany({
      data: [
        { resultId: entry1.result.id, athleteId: a1.id, points: 150, earnedAt: date(2026, 9, 20), validUntil: oneYearLater },
        { resultId: entry1.result.id, athleteId: a2.id, points: 150, earnedAt: date(2026, 9, 20), validUntil: oneYearLater },
      ],
    });
  }

  if (entry2.result) {
    await prisma.rankingPoint.createMany({
      data: [
        { resultId: entry2.result.id, athleteId: a3.id, points: 120, earnedAt: date(2026, 9, 20), validUntil: oneYearLater },
        { resultId: entry2.result.id, athleteId: a4.id, points: 120, earnedAt: date(2026, 9, 20), validUntil: oneYearLater },
      ],
    });
  }

  if (entry3.result) {
    await prisma.rankingPoint.createMany({
      data: [
        { resultId: entry3.result.id, athleteId: a5.id, points: 100, earnedAt: date(2026, 9, 20), validUntil: oneYearLater },
        { resultId: entry3.result.id, athleteId: a6.id, points: 100, earnedAt: date(2026, 9, 20), validUntil: oneYearLater },
      ],
    });
  }

  // Competition 2: Black Sea Open Cup 2026 (Batumi)
  const comp2 = await prisma.competition.create({
    data: {
      name: 'შავი ზღვის საერთაშორისო თასი 2026',
      nameEn: 'Black Sea International Cup 2026',
      type: CompetitionType.INTERNATIONAL,
      city: 'ბათუმი',
      venue: 'ბათუმის ახალი სპორტული კომპლექსი',
      startDate: date(2026, 10, 15),
      endDate: date(2026, 10, 16),
      pointsCoefficient: 2.0,
      isPublished: true,
    },
  });

  const event3 = await prisma.compEvent.create({
    data: {
      competitionId: comp2.id,
      ageCategory: AgeCategory.ADULT,
      discipline: Discipline.LATIN,
      format: Format.COUPLE,
    },
  });

  const entry4 = await prisma.entry.create({
    data: {
      eventId: event3.id,
      partnershipId: p2.id,
      clubIdSnapshot: club2.id,
      ageCategorySnapshot: AgeCategory.ADULT,
      startNumber: 301,
      result: {
        create: {
          placement: 1,
          roundsReached: 4,
        },
      },
    },
    include: { result: true },
  });

  if (entry4.result) {
    await prisma.rankingPoint.createMany({
      data: [
        { resultId: entry4.result.id, athleteId: a3.id, points: 200, earnedAt: date(2026, 10, 15), validUntil: oneYearLater },
        { resultId: entry4.result.id, athleteId: a4.id, points: 200, earnedAt: date(2026, 10, 15), validUntil: oneYearLater },
      ],
    });
  }

  // Competition 3: Imereti Open Cup 2026 (Kutaisi)
  const comp3 = await prisma.competition.create({
    data: {
      name: 'იმერეთის ღია პირველობა 2026',
      nameEn: 'Imereti Open Cup 2026',
      type: CompetitionType.REGIONAL,
      city: 'ქუთაისი',
      venue: 'ქუთაისის სპორტის სასახლე',
      startDate: date(2026, 11, 10),
      endDate: date(2026, 11, 10),
      pointsCoefficient: 1.0,
      isPublished: true,
    },
  });

  const event4 = await prisma.compEvent.create({
    data: {
      competitionId: comp3.id,
      ageCategory: AgeCategory.JUNIOR_II,
      discipline: Discipline.STANDARD,
      format: Format.COUPLE,
    },
  });

  await prisma.entry.create({
    data: {
      eventId: event4.id,
      partnershipId: p3.id,
      clubIdSnapshot: club3.id,
      ageCategorySnapshot: AgeCategory.JUNIOR_II,
      startNumber: 401,
      result: {
        create: {
          placement: 1,
          roundsReached: 2,
        },
      },
    },
  });

  // Re-populate RankingEntries for National Rankings Page
  await prisma.rankingEntry.deleteMany({});

  await prisma.rankingEntry.createMany({
    data: [
      {
        ageCategory: AgeCategory.ADULT,
        discipline: Discipline.LATIN,
        format: Format.COUPLE,
        partnershipId: p2.id,
        totalPoints: 320,
        position: 1,
      },
      {
        ageCategory: AgeCategory.ADULT,
        discipline: Discipline.LATIN,
        format: Format.COUPLE,
        partnershipId: p1.id,
        totalPoints: 150,
        position: 2,
      },
      {
        ageCategory: AgeCategory.JUNIOR_II,
        discipline: Discipline.STANDARD,
        format: Format.COUPLE,
        partnershipId: p3.id,
        totalPoints: 100,
        position: 1,
      },
    ],
  });

  console.log('Successfully seeded 3 Studios, 3 Competitions, Events, Entries, Results, and Rankings!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
