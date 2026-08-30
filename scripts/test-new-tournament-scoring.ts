import { PrismaClient, AgeCategory, Discipline, Format, CompetitionType, DanceClass, CoupleCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { commitEventResults } from '../src/lib/results';
import { recomputeRankings } from '../src/lib/rankings';

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- TEST: Creating New Competition, Committing Results with New Scoring Engine, & Recomputing Rankings ---');

  // 1. Create New Competition: Caucasus Grand Prix 2026
  const comp = await prisma.competition.create({
    data: {
      name: 'კავკასიის გრან პრი 2026',
      nameEn: 'Caucasus Grand Prix 2026',
      type: CompetitionType.NATIONAL,
      city: 'თბილისი',
      venue: 'ოლიმპიური სასახლე',
      startDate: new Date('2026-12-05T00:00:00Z'),
      endDate: new Date('2026-12-06T00:00:00Z'),
      pointsCoefficient: 1.5,
      isPublished: true,
    },
  });
  console.log(`✓ Created Competition: "${comp.name}" (ID: ${comp.id})`);

  // 2. Fetch existing athletes & partnerships for entries
  const partnerships = await prisma.partnership.findMany({
    where: { endDate: null },
    include: { leader: true, follower: true },
    take: 3,
  });

  const athletes = await prisma.athlete.findMany({
    where: { isActive: true },
    take: 7,
  });

  if (partnerships.length === 0 || athletes.length === 0) {
    throw new Error('No active partnerships or athletes found in database. Run seed script first.');
  }

  // 3. Create COUPLE Event: Youth Latin (Category: YOUTH)
  const coupleEvent = await prisma.compEvent.create({
    data: {
      competitionId: comp.id,
      ageCategory: AgeCategory.YOUTH,
      discipline: Discipline.LATIN,
      format: Format.COUPLE,
      coupleCategory: CoupleCategory.YOUTH,
    },
  });
  console.log(`✓ Created COUPLE Event: Youth · Latin (Category: ${coupleEvent.coupleCategory})`);

  // Register entries for COUPLE Event
  const coupleEntries = [];
  for (let i = 0; i < Math.min(3, partnerships.length); i++) {
    const p = partnerships[i];
    const entry = await prisma.entry.create({
      data: {
        eventId: coupleEvent.id,
        partnershipId: p.id,
        ageCategorySnapshot: AgeCategory.YOUTH,
        startNumber: 501 + i,
      },
    });
    coupleEntries.push(entry);
  }

  // Commit COUPLE Event Results using new scoring engine
  const couplePlacements = coupleEntries.map((e, idx) => ({
    entryId: e.id,
    placement: idx + 1, // 1st, 2nd, 3rd place
  }));

  console.log(`Committing ${couplePlacements.length} couple placements...`);
  await commitEventResults(coupleEvent.id, couplePlacements, null);
  console.log(`✓ Successfully committed COUPLE Event Results with getCoupleScore()!`);

  // 4. Create SOLO Event: Junior I Latin (Class: CLASS_A)
  const soloEvent = await prisma.compEvent.create({
    data: {
      competitionId: comp.id,
      ageCategory: AgeCategory.JUNIOR_I,
      discipline: Discipline.LATIN,
      format: Format.SOLO,
      danceClass: DanceClass.A,
    },
  });
  console.log(`✓ Created SOLO Event: Junior I · Latin (Class: ${soloEvent.danceClass})`);

  // Register entries for SOLO Event (7 participants)
  const soloEntries = [];
  for (let i = 0; i < Math.min(7, athletes.length); i++) {
    const a = athletes[i];
    const entry = await prisma.entry.create({
      data: {
        eventId: soloEvent.id,
        athleteId: a.id,
        ageCategorySnapshot: AgeCategory.JUNIOR_I,
        startNumber: 601 + i,
      },
    });
    soloEntries.push(entry);
  }

  // Commit SOLO Event Results (top 6 placements get points in 7-12 range according to PDF rules!)
  const soloPlacements = soloEntries.slice(0, 6).map((e, idx) => ({
    entryId: e.id,
    placement: idx + 1,
  }));

  console.log(`Committing ${soloPlacements.length} solo placements (Class A, places 1-6)...`);
  await commitEventResults(soloEvent.id, soloPlacements, null);
  console.log(`✓ Successfully committed SOLO Event Results with getSoloScore()!`);

  // 5. Display National Rankings Leaderboard
  const rankingEntries = await prisma.rankingEntry.findMany({
    orderBy: [{ ageCategory: 'asc' }, { position: 'asc' }],
    include: {
      partnership: { include: { leader: true, follower: true } },
      athlete: true,
    },
  });

  console.log('\n================ OFFICIAL NATIONAL RANKINGS LEADERBOARD ================');
  for (const r of rankingEntries) {
    const name = r.partnership
      ? `${r.partnership.leader.firstName} ${r.partnership.leader.lastName} & ${r.partnership.follower.firstName} ${r.partnership.follower.lastName}`
      : `${r.athlete?.firstName} ${r.athlete?.lastName}`;
    console.log(`#${r.position} [${r.ageCategory} · ${r.discipline} · ${r.format}] ${name} — ${r.totalPoints} pts`);
  }
  console.log('========================================================================\n');
}

main()
  .catch((e) => {
    console.error('Test execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
