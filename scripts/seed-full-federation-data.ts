import {
  PrismaClient,
  AgeCategory,
  Discipline,
  Format,
  CompetitionType,
  Gender,
  DanceClass,
  CoupleCategory,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { commitEventResults } from '../src/lib/results';
import { recomputeRankings } from '../src/lib/rankings';

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Helper to pick random element
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Date builder helper
const date = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

async function main() {
  console.log('=== STARTING FULL FEDERATION SEEDING (48 ATHLETES, MULTIPLE TOURNAMENTS & FULL RANKINGS) ===');

  // 1. Ensure 3 Main Dance Clubs
  let club1 = await prisma.club.findFirst({ where: { name: 'კლუბი ელიტი' } });
  if (!club1) {
    club1 = await prisma.club.create({
      data: {
        name: 'კლუბი ელიტი',
        nameEn: 'Studio Elite',
        city: 'თბილისი',
        address: 'ი. ჭავჭავაძის გამზირი 34',
        phone: '+995 599 112 233',
        email: 'elite@gndsf.ge',
        isActive: true,
      },
    });
  }

  let club2 = await prisma.club.findFirst({ where: { name: 'კლუბი რითმი' } });
  if (!club2) {
    club2 = await prisma.club.create({
      data: {
        name: 'კლუბი რითმი',
        nameEn: 'Club Rhythm',
        city: 'ბათუმი',
        address: 'რუსთაველის გამზირი 18',
        phone: '+995 595 445 566',
        email: 'rhythm@gndsf.ge',
        isActive: true,
      },
    });
  }

  let club3 = await prisma.club.findFirst({ where: { name: 'კლუბი დინამო' } });
  if (!club3) {
    club3 = await prisma.club.create({
      data: {
        name: 'კლუბი დინამო',
        nameEn: 'Studio Dinamo',
        city: 'ქუთაისი',
        address: 'აკაკი წერეთლის ქუჩა 12',
        phone: '+995 577 889 900',
        email: 'dinamo@gndsf.ge',
        isActive: true,
      },
    });
  }

  const clubs = [club1, club2, club3];

  // 2. Georgian Names Pools (24 Males & 24 Females = 48 Dancers)
  const maleFirstNames = [
    'გიორგი', 'დავით', 'ლაშა', 'ნიკოლოზ', 'ალექსანდრე', 'ირაკლი', 'საბა', 'თორნიკე',
    'ლუკა', 'ზურაბ', 'ანდრია', 'ვახტანგ', 'დემეტრე', 'დაჩი', 'გიგა', 'ოთარ',
    'შოთა', 'მიხეილ', 'ერეკლე', 'სანდრო', 'ილია', 'რეზი', 'კოტე', 'ნიკა',
  ];

  const femaleFirstNames = [
    'ნინო', 'მარიამ', 'ანა', 'ელენე', 'თამარ', 'სალომე', 'ქეთევან', 'ნათია',
    'ლიზა', 'თათია', 'სოფიო', 'ანი', 'მეგანა', 'ბარბარე', 'მარიკა', 'ნუცა',
    'ეკატერინე', 'ლილე', 'მარი', 'თინათინ', 'ხატია', 'დიანა', 'ნინი', 'მარიამი',
  ];

  const lastNames = [
    'გიორგაძე', 'ბერიძე', 'კაპანაძე', 'მელაძე', 'კვარაცხელია', 'წერეთელი', 'ჯაფარიძე', 'ლომიძე',
    'წიკლაური', 'მაისურაძე', 'გელაშვილი', 'ხარაძე', 'შენგელია', 'აბაშიძე', 'ჩხეიძე', 'გაბუნია',
    'ქობალია', 'მგელაძე', 'ჯანელიძე', 'კახიძე', 'ნადირაძე', 'დავლაშერიძე', 'გოგოლაძე', 'ქანთარია',
  ];

  const birthYears = [
    2001, 2002, 2003, 2004, 2005, 2007, 2007, 2008,
    2008, 2009, 2009, 2010, 2010, 2011, 2011, 2012,
    2012, 2013, 2013, 2014, 2014, 2015, 2015, 2015,
  ];

  console.log('Generating 48 Athletes (24 Males & 24 Females)...');

  const maleAthletes = [];
  const femaleAthletes = [];

  for (let i = 0; i < 24; i++) {
    const club = clubs[i % 3];
    const birthYear = birthYears[i];

    const m = await prisma.athlete.create({
      data: {
        gid: `GEO-M${Math.floor(10000 + Math.random() * 90000)}`,
        firstName: maleFirstNames[i],
        lastName: pick(lastNames),
        birthDate: date(birthYear, (i % 12) + 1, (i % 28) + 1),
        gender: Gender.MALE,
        personalNumber: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
        isActive: true,
        clubMemberships: { create: { clubId: club.id, startDate: date(2023, 1, 1) } },
      },
    });
    maleAthletes.push(m);

    const f = await prisma.athlete.create({
      data: {
        gid: `GEO-F${Math.floor(10000 + Math.random() * 90000)}`,
        firstName: femaleFirstNames[i],
        lastName: pick(lastNames),
        birthDate: date(birthYear, ((i + 3) % 12) + 1, ((i + 5) % 28) + 1),
        gender: Gender.FEMALE,
        personalNumber: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
        isActive: true,
        clubMemberships: { create: { clubId: club.id, startDate: date(2023, 1, 1) } },
      },
    });
    femaleAthletes.push(f);
  }

  console.log(`✓ Successfully created ${maleAthletes.length + femaleAthletes.length} athletes!`);

  // 3. Form 24 Active Partnerships
  console.log('Forming 24 Active Partnerships...');
  const partnerships = [];
  for (let i = 0; i < 24; i++) {
    const p = await prisma.partnership.create({
      data: {
        leaderId: maleAthletes[i].id,
        followerId: femaleAthletes[i].id,
        startDate: date(2024, 1, 1),
      },
    });
    partnerships.push(p);
  }
  console.log(`✓ Successfully created ${partnerships.length} active partnerships!`);

  // 4. Create Major Tournaments
  console.log('Creating 3 Major Tournaments...');

  const t1 = await prisma.competition.create({
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

  const t2 = await prisma.competition.create({
    data: {
      name: 'შავი ზღვის საერთაშორისო თასი 2026',
      nameEn: 'Black Sea International Open 2026',
      type: CompetitionType.INTERNATIONAL,
      city: 'ბათუმი',
      venue: 'ბათუმის ახალი სპორტული კომპლექსი',
      startDate: date(2026, 10, 15),
      endDate: date(2026, 10, 16),
      pointsCoefficient: 2.0,
      isPublished: true,
    },
  });

  const t3 = await prisma.competition.create({
    data: {
      name: 'იმერეთის ღია პირველობა 2026',
      nameEn: 'Imereti Regional Championship 2026',
      type: CompetitionType.REGIONAL,
      city: 'ქუთაისი',
      venue: 'ქუთაისის სპორტის სასახლე',
      startDate: date(2026, 11, 10),
      endDate: date(2026, 11, 10),
      pointsCoefficient: 1.0,
      isPublished: true,
    },
  });

  const adultCouples = partnerships.slice(0, 5);
  const youthCouples = partnerships.slice(5, 9);
  const junior2Couples = partnerships.slice(9, 13);
  const junior1Couples = partnerships.slice(13, 17);
  const juvenileCouples = partnerships.slice(17, 24);

  async function setupAndCommitEvent(
    compId: string,
    ageCategory: AgeCategory,
    discipline: Discipline,
    format: Format,
    danceClass: DanceClass | null,
    coupleCategory: CoupleCategory | null,
    coupleList: typeof partnerships,
    soloList: typeof femaleAthletes,
    desiredSoloCount: number = 6,
  ) {
    const event = await prisma.compEvent.create({
      data: {
        competitionId: compId,
        ageCategory,
        discipline,
        format,
        danceClass,
        coupleCategory,
      },
    });

    const entries = [];

    if (format === Format.COUPLE) {
      for (let i = 0; i < coupleList.length; i++) {
        const p = coupleList[i];
        const entry = await prisma.entry.create({
          data: {
            eventId: event.id,
            partnershipId: p.id,
            ageCategorySnapshot: ageCategory,
            startNumber: 100 + i + 1,
          },
        });
        entries.push(entry);
      }

      const placements = entries.map((e, idx) => ({
        entryId: e.id,
        placement: idx + 1,
      }));

      await commitEventResults(event.id, placements, null, false);
    } else {
      // SOLO
      const count = Math.min(desiredSoloCount, soloList.length);
      for (let i = 0; i < count; i++) {
        const a = soloList[i];
        const entry = await prisma.entry.create({
          data: {
            eventId: event.id,
            athleteId: a.id,
            ageCategorySnapshot: ageCategory,
            startNumber: 200 + i + 1,
          },
        });
        entries.push(entry);
      }

      // Submit placements for top 6 places (defined in table)
      const placements = entries.slice(0, 6).map((e, idx) => ({
        entryId: e.id,
        placement: idx + 1,
      }));

      await commitEventResults(event.id, placements, null, false);
    }
    console.log(`  ✓ Event Committed: ${ageCategory} · ${discipline} · ${format}`);
  }

  // Populate events for Tournament 1 (Championship)
  console.log(`Populating events & results for Tournament 1: ${t1.name}...`);
  await setupAndCommitEvent(t1.id, AgeCategory.ADULT, Discipline.LATIN, Format.COUPLE, null, CoupleCategory.ADULT, adultCouples, []);
  await setupAndCommitEvent(t1.id, AgeCategory.ADULT, Discipline.STANDARD, Format.COUPLE, null, CoupleCategory.ADULT, adultCouples, []);
  await setupAndCommitEvent(t1.id, AgeCategory.YOUTH, Discipline.LATIN, Format.COUPLE, null, CoupleCategory.YOUTH, youthCouples, []);
  await setupAndCommitEvent(t1.id, AgeCategory.JUNIOR_II, Discipline.LATIN, Format.COUPLE, null, CoupleCategory.JUNIOR_2, junior2Couples, []);
  await setupAndCommitEvent(t1.id, AgeCategory.JUNIOR_I, Discipline.STANDARD, Format.COUPLE, null, CoupleCategory.JUNIOR_1, junior1Couples, []);
  await setupAndCommitEvent(t1.id, AgeCategory.JUVENILE_II, Discipline.LATIN, Format.COUPLE, null, CoupleCategory.JUVENILE_1_2, juvenileCouples, []);

  // Class A (0-6), Class B (7-12), Class C (13-24), Class D (13-24)
  await setupAndCommitEvent(t1.id, AgeCategory.ADULT, Discipline.LATIN, Format.SOLO, DanceClass.A, null, [], femaleAthletes, 6);
  await setupAndCommitEvent(t1.id, AgeCategory.YOUTH, Discipline.LATIN, Format.SOLO, DanceClass.B, null, [], femaleAthletes, 8);
  await setupAndCommitEvent(t1.id, AgeCategory.JUNIOR_II, Discipline.LATIN, Format.SOLO, DanceClass.C, null, [], femaleAthletes, 15);
  await setupAndCommitEvent(t1.id, AgeCategory.JUVENILE_II, Discipline.LATIN, Format.SOLO, DanceClass.D, null, [], femaleAthletes, 15);

  // Populate events for Tournament 2 (Black Sea Open)
  console.log(`Populating events & results for Tournament 2: ${t2.name}...`);
  await setupAndCommitEvent(t2.id, AgeCategory.ADULT, Discipline.LATIN, Format.COUPLE, null, CoupleCategory.ADULT, adultCouples, []);
  await setupAndCommitEvent(t2.id, AgeCategory.YOUTH, Discipline.LATIN, Format.COUPLE, null, CoupleCategory.YOUTH, youthCouples, []);
  await setupAndCommitEvent(t2.id, AgeCategory.JUNIOR_II, Discipline.STANDARD, Format.COUPLE, null, CoupleCategory.JUNIOR_2, junior2Couples, []);

  // Populate events for Tournament 3 (Imereti Cup)
  console.log(`Populating events & results for Tournament 3: ${t3.name}...`);
  await setupAndCommitEvent(t3.id, AgeCategory.JUNIOR_I, Discipline.LATIN, Format.COUPLE, null, CoupleCategory.JUNIOR_1, junior1Couples, []);
  await setupAndCommitEvent(t3.id, AgeCategory.JUVENILE_II, Discipline.STANDARD, Format.COUPLE, null, CoupleCategory.JUVENILE_1_2, juvenileCouples, []);

  // 5. Final Recompute of National Rankings once at the end
  console.log('Recomputing final National Rankings...');
  await recomputeRankings(prisma);

  // Print Summary
  const totalRankings = await prisma.rankingEntry.count();
  const totalCompetitions = await prisma.competition.count();
  const totalResults = await prisma.result.count();

  console.log('\n================================================================');
  console.log(`=== FULL SEEDING COMPLETE! ===`);
  console.log(`Total Competitions: ${totalCompetitions}`);
  console.log(`Total Athletes: ${await prisma.athlete.count()}`);
  console.log(`Total Partnerships: ${await prisma.partnership.count()}`);
  console.log(`Total Results Recorded: ${totalResults}`);
  console.log(`Total National Ranking Leaderboard Entries: ${totalRankings}`);
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('Full Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
