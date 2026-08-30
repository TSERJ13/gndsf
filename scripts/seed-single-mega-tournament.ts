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

async function main() {
  console.log('=== CREATING 1 MEGA TOURNAMENT WITH MANY CATEGORIES & SOLO GIRLS ONLY ===');

  // 1. Fetch active female athletes ONLY for SOLO events
  const femaleSoloists = await prisma.athlete.findMany({
    where: { isActive: true, gender: Gender.FEMALE },
  });

  // Fetch active partnerships for COUPLE events
  const partnerships = await prisma.partnership.findMany({
    where: { endDate: null },
    include: { leader: true, follower: true },
  });

  console.log(`Found ${femaleSoloists.length} female soloists and ${partnerships.length} couples in DB.`);

  // 2. Create the Mega Tournament
  const megaComp = await prisma.competition.create({
    data: {
      name: 'საქართველოს ეროვნული თასი 2026',
      nameEn: 'Georgian National Cup 2026',
      type: CompetitionType.NATIONAL,
      city: 'თბილისი',
      venue: 'თბილისის ოლიმპიური სასახლე (დიდი დარბაზი)',
      startDate: new Date('2026-11-28T00:00:00Z'),
      endDate: new Date('2026-11-29T00:00:00Z'),
      pointsCoefficient: 1.5,
      isPublished: true,
    },
  });

  console.log(`✓ Created Mega Tournament: "${megaComp.name}" (ID: ${megaComp.id})`);

  // Define Category subsets
  const adultCouples = partnerships.slice(0, 5);
  const youthCouples = partnerships.slice(5, 9);
  const junior2Couples = partnerships.slice(9, 13);
  const junior1Couples = partnerships.slice(13, 17);
  const juvenileCouples = partnerships.slice(17, 24);

  // Helper function to setup event, register entries, and commit results
  async function addMegaEvent(
    ageCategory: AgeCategory,
    discipline: Discipline,
    format: Format,
    danceClass: DanceClass | null,
    coupleCategory: CoupleCategory | null,
    coupleList: typeof partnerships,
    soloList: typeof femaleSoloists,
    desiredSoloCount: number = 6,
  ) {
    const event = await prisma.compEvent.create({
      data: {
        competitionId: megaComp.id,
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
      // SOLO — STRICTLY FEMALE ATHLETES ONLY
      const femaleCandidates = soloList.filter((a) => a.gender === Gender.FEMALE);
      const count = Math.min(desiredSoloCount, femaleCandidates.length);

      for (let i = 0; i < count; i++) {
        const a = femaleCandidates[i];
        const entry = await prisma.entry.create({
          data: {
            eventId: event.id,
            athleteId: a.id,
            ageCategorySnapshot: ageCategory,
            startNumber: 300 + i + 1,
          },
        });
        entries.push(entry);
      }

      // Submit placements for top 6 places (as defined in official scoring table)
      const placements = entries.slice(0, 6).map((e, idx) => ({
        entryId: e.id,
        placement: idx + 1,
      }));

      await commitEventResults(event.id, placements, null, false);
    }

    const label = `${ageCategory} · ${discipline} · ${format}${
      danceClass ? ` (Class ${danceClass})` : coupleCategory ? ` (Category ${coupleCategory})` : ''
    }`;
    console.log(`  ✓ Event Created & Results Committed: ${label}`);
  }

  console.log('\nAdding 12 Categories to Mega Tournament...');

  // 12 Events in 1 Tournament
  await addMegaEvent(AgeCategory.ADULT, Discipline.LATIN, Format.COUPLE, null, CoupleCategory.ADULT, adultCouples, []);
  await addMegaEvent(AgeCategory.ADULT, Discipline.STANDARD, Format.COUPLE, null, CoupleCategory.ADULT, adultCouples, []);
  await addMegaEvent(AgeCategory.YOUTH, Discipline.LATIN, Format.COUPLE, null, CoupleCategory.YOUTH, youthCouples, []);
  await addMegaEvent(AgeCategory.YOUTH, Discipline.STANDARD, Format.COUPLE, null, CoupleCategory.YOUTH, youthCouples, []);
  await addMegaEvent(AgeCategory.JUNIOR_II, Discipline.LATIN, Format.COUPLE, null, CoupleCategory.JUNIOR_2, junior2Couples, []);
  await addMegaEvent(AgeCategory.JUNIOR_I, Discipline.LATIN, Format.COUPLE, null, CoupleCategory.JUNIOR_1, junior1Couples, []);
  await addMegaEvent(AgeCategory.JUVENILE_II, Discipline.LATIN, Format.COUPLE, null, CoupleCategory.JUVENILE_1_2, juvenileCouples, []);

  // SOLO Events (FEMALE GIRLS ONLY)
  await addMegaEvent(AgeCategory.ADULT, Discipline.LATIN, Format.SOLO, DanceClass.A, null, [], femaleSoloists, 6);
  await addMegaEvent(AgeCategory.YOUTH, Discipline.LATIN, Format.SOLO, DanceClass.B, null, [], femaleSoloists, 8);
  await addMegaEvent(AgeCategory.JUNIOR_II, Discipline.LATIN, Format.SOLO, DanceClass.C, null, [], femaleSoloists, 15);
  await addMegaEvent(AgeCategory.JUNIOR_I, Discipline.LATIN, Format.SOLO, DanceClass.D, null, [], femaleSoloists, 15);
  await addMegaEvent(AgeCategory.JUVENILE_II, Discipline.LATIN, Format.SOLO, DanceClass.D, null, [], femaleSoloists, 15);

  // 3. Final Recompute of National Rankings
  console.log('\nRecomputing final National Rankings leaderboard...');
  await recomputeRankings(prisma);

  console.log('\n================================================================');
  console.log('=== MEGA TOURNAMENT SEEDING COMPLETE! ===');
  console.log(`Tournament: ${megaComp.name} (${megaComp.id})`);
  console.log(`Total Events in Tournament: 12`);
  console.log(`Total National Rankings Entries: ${await prisma.rankingEntry.count()}`);
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('Mega Tournament Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
