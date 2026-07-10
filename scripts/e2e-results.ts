// End-to-end business-logic test of the Phase 2 pipeline:
// new competition → event → entries → commit → rankings must update,
// with prevPosition arrows and idempotent re-commit.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { commitEventResults } from "../src/lib/results";
import { categoryFor } from "../src/lib/labels";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const before = await db.rankingEntry.findMany({
    where: { format: "COUPLE", discipline: "LATIN" },
    include: { partnership: { include: { leader: true } } },
    orderBy: { position: "asc" },
  });
  console.log("BEFORE:", before.map(r => `#${r.position} ${r.partnership?.leader.lastName} ${r.totalPoints}pts (${r.ageCategory})`));

  // Autumn Cup: Saba+Elene WIN against Giorgi+Mariam... but they're in
  // different age categories, so let's make it same-category instead:
  // register Giorgi+Mariam (YOUTH) and give them 2nd place vs nobody —
  // better test: give sabaElene a big win, verify their board updates.
  const comp = await db.competition.create({
    data: {
      name: "შემოდგომის თასი 2026 (ტესტი)", type: "INTERNATIONAL",
      city: "ქუთაისი", startDate: new Date(), pointsCoefficient: 1.5,
    },
  });
  const giorgiMariam = await db.partnership.findFirstOrThrow({
    where: { endDate: null, leader: { gid: "GID-1001" } },
    include: { leader: true, follower: true },
  });
  const sabaElene = await db.partnership.findFirstOrThrow({
    where: { endDate: null, leader: { gid: "GID-1006" } },
    include: { leader: true, follower: true },
  });

  const ev = await db.compEvent.create({
    data: { competitionId: comp.id, ageCategory: "YOUTH", discipline: "LATIN", format: "COUPLE" },
  });
  const mkEntry = async (p: typeof giorgiMariam) =>
    db.entry.create({
      data: {
        eventId: ev.id, partnershipId: p.id,
        ageCategorySnapshot: categoryFor(new Date(Math.min(+p.leader.birthDate, +p.follower.birthDate))),
        clubIdSnapshot: (await db.clubMembership.findFirst({ where: { athleteId: p.leaderId, endDate: null } }))?.clubId,
      },
    });
  const e1 = await mkEntry(giorgiMariam);
  const e2 = await mkEntry(sabaElene);

  // Commit: sabaElene 1st (100×1.5=150 each), giorgiMariam 2nd (85×1.5=128 each)
  await commitEventResults(ev.id, [
    { entryId: e2.id, placement: 1 },
    { entryId: e1.id, placement: 2 },
  ], null);

  const after = await db.rankingEntry.findMany({
    where: { format: "COUPLE", discipline: "LATIN" },
    include: { partnership: { include: { leader: true } } },
    orderBy: [{ ageCategory: "asc" }, { position: "asc" }],
  });
  console.log("AFTER: ", after.map(r => `#${r.position}${r.prevPosition ? `(was ${r.prevPosition})` : "(new)"} ${r.partnership?.leader.lastName} ${r.totalPoints}pts (${r.ageCategory})`));

  // Idempotency: re-commit same results — totals must not double
  await commitEventResults(ev.id, [
    { entryId: e2.id, placement: 1 },
    { entryId: e1.id, placement: 2 },
  ], null);
  const again = await db.rankingEntry.findMany({
    where: { format: "COUPLE", discipline: "LATIN" },
    orderBy: [{ ageCategory: "asc" }, { position: "asc" }],
  });
  const sameTotals = JSON.stringify(after.map(r => r.totalPoints)) === JSON.stringify(again.map(r => r.totalPoints));
  console.log("IDEMPOTENT RE-COMMIT:", sameTotals ? "PASS" : "FAIL");

  // Correction scenario: secretary fixes a mistake — placements swapped
  await commitEventResults(ev.id, [
    { entryId: e1.id, placement: 1 },
    { entryId: e2.id, placement: 2 },
  ], null);
  const fixed = await db.rankingEntry.findMany({
    where: { format: "COUPLE", discipline: "LATIN", ageCategory: "YOUTH" },
    include: { partnership: { include: { leader: true } } },
    orderBy: { position: "asc" },
  });
  console.log("AFTER FIX:", fixed.map(r => `#${r.position} ${r.partnership?.leader.lastName} ${r.totalPoints}pts`));
}

main().finally(() => db.$disconnect());
