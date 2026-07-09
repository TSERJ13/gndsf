// ── The ranking engine ──
// Derived data only: truncate + rebuild, idempotent by construction.
// Called inside the same transaction that commits results, so the
// public leaderboard can never be out of sync with results.
import type { PrismaClient, AgeCategory, Discipline } from "@prisma/client";
import { categoryFor } from "./labels";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function recomputeRankings(db: Tx) {
  const prev = await db.rankingEntry.findMany({
    select: { athleteId: true, partnershipId: true, ageCategory: true, discipline: true, format: true, position: true },
  });
  const prevPos = new Map(
    prev.map((r) => [
      `${r.partnershipId ?? r.athleteId}|${r.ageCategory}|${r.discipline}|${r.format}`,
      r.position,
    ]),
  );

  await db.rankingEntry.deleteMany();
  const now = new Date();

  const boards = new Map<
    string,
    { partnershipId?: string; athleteId?: string; total: number }[]
  >();
  const push = (key: string, row: { partnershipId?: string; athleteId?: string; total: number }) => {
    if (!boards.has(key)) boards.set(key, []);
    boards.get(key)!.push(row);
  };

  // Couple boards: points follow athletes; couple score = average of the
  // pair's valid points. Category = the OLDER partner's current category.
  const couples = await db.partnership.findMany({
    where: { endDate: null },
    include: { leader: true, follower: true },
  });
  for (const p of couples) {
    const agg = await db.rankingPoint.aggregate({
      where: { athleteId: { in: [p.leaderId, p.followerId] }, validUntil: { gte: now } },
      _sum: { points: true },
    });
    const total = Math.round((agg._sum.points ?? 0) / 2);
    if (total === 0) continue;
    const cat = categoryFor(new Date(Math.min(+p.leader.birthDate, +p.follower.birthDate)));
    for (const disc of ["STANDARD", "LATIN"] as const) {
      const danced = await db.entry.findFirst({
        where: { partnershipId: p.id, event: { discipline: disc } },
        select: { id: true },
      });
      if (danced) push(`${cat}|${disc}|COUPLE`, { partnershipId: p.id, total });
    }
  }

  // Solo boards: only points earned in solo entries count here.
  const soloists = await db.athlete.findMany({
    where: { isActive: true, soloEntries: { some: {} } },
    select: { id: true, birthDate: true },
  });
  for (const a of soloists) {
    const agg = await db.rankingPoint.aggregate({
      where: { athleteId: a.id, validUntil: { gte: now }, result: { entry: { athleteId: a.id } } },
      _sum: { points: true },
    });
    const total = agg._sum.points ?? 0;
    if (total === 0) continue;
    const cat = categoryFor(a.birthDate);
    for (const disc of ["STANDARD", "LATIN"] as const) {
      const danced = await db.entry.findFirst({
        where: { athleteId: a.id, event: { discipline: disc } },
        select: { id: true },
      });
      if (danced) push(`${cat}|${disc}|SOLO`, { athleteId: a.id, total });
    }
  }

  for (const [key, rows] of boards) {
    const [cat, disc, fmt] = key.split("|") as [AgeCategory, Discipline, "SOLO" | "COUPLE"];
    rows.sort((a, b) => b.total - a.total);
    await db.rankingEntry.createMany({
      data: rows.map((r, i) => ({
        ageCategory: cat,
        discipline: disc,
        format: fmt,
        athleteId: r.athleteId,
        partnershipId: r.partnershipId,
        totalPoints: r.total,
        position: i + 1,
        prevPosition:
          prevPos.get(`${r.partnershipId ?? r.athleteId}|${cat}|${disc}|${fmt}`) ?? null,
      })),
    });
  }
}
