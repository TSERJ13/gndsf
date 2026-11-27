// Derived leaderboards: truncate + rebuild. Idempotent by design.
//
// Rules (agreed with the federation):
// - Separate boards per format × discipline × age category.
// - Solo board: only points from the athlete's SOLO entries in that
//   discipline.
// - Couple board: only points the CURRENT partnership earned together in
//   that discipline. A new couple starts from zero; partners' earlier
//   points stay in their personal history but do not carry over.
// - Only points still inside their 12-month validity window count.
import type { AgeCategory, Discipline, PrismaClient } from "@prisma/client";
import { categoryFor } from "./labels";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;
type Row = { partnershipId?: string; athleteId?: string; total: number };

const DISCIPLINES: Discipline[] = ["STANDARD", "LATIN"];

export async function recomputeRankings(db: Tx) {
  const now = new Date();

  const previous = await db.rankingEntry.findMany({
    select: { athleteId: true, partnershipId: true, ageCategory: true, discipline: true, format: true, position: true },
  });
  const prevPos = new Map(
    previous.map((r) => [
      `${r.partnershipId ?? r.athleteId}|${r.ageCategory}|${r.discipline}|${r.format}`,
      r.position,
    ]),
  );

  const boards = new Map<string, Row[]>();
  const push = (key: string, row: Row) => {
    if (!boards.has(key)) boards.set(key, []);
    boards.get(key)!.push(row);
  };

  // ── Couple boards ──
  const couples = await db.partnership.findMany({
    where: { endDate: null },
    include: { leader: true, follower: true },
  });
  for (const p of couples) {
    const cat = categoryFor(new Date(Math.min(+p.leader.birthDate, +p.follower.birthDate)));
    for (const disc of DISCIPLINES) {
      // Both partners get the same points per result; count the leader's
      // rows only, so the couple total equals the table value.
      const agg = await db.rankingPoint.aggregate({
        where: {
          athleteId: p.leaderId,
          validUntil: { gte: now },
          result: { entry: { partnershipId: p.id, event: { discipline: disc } } },
        },
        _sum: { points: true },
      });
      const total = agg._sum.points ?? 0;
      if (total > 0) push(`${cat}|${disc}|COUPLE`, { partnershipId: p.id, total });
    }
  }

  // ── Solo boards ──
  const soloists = await db.athlete.findMany({
    where: { isActive: true, soloEntries: { some: {} } },
    select: { id: true, birthDate: true },
  });
  for (const a of soloists) {
    const cat = categoryFor(a.birthDate);
    for (const disc of DISCIPLINES) {
      const agg = await db.rankingPoint.aggregate({
        where: {
          athleteId: a.id,
          validUntil: { gte: now },
          result: { entry: { athleteId: a.id, event: { discipline: disc } } },
        },
        _sum: { points: true },
      });
      const total = agg._sum.points ?? 0;
      if (total > 0) push(`${cat}|${disc}|SOLO`, { athleteId: a.id, total });
    }
  }

  await db.rankingEntry.deleteMany();

  for (const [key, rows] of boards) {
    const [cat, disc, fmt] = key.split("|") as [AgeCategory, Discipline, "SOLO" | "COUPLE"];
    rows.sort((a, b) => b.total - a.total);
    // Competition ranking: equal totals share a position (1, 2, 2, 4…).
    let position = 0;
    let lastTotal: number | null = null;
    await db.rankingEntry.createMany({
      data: rows.map((r, i) => {
        if (r.total !== lastTotal) {
          position = i + 1;
          lastTotal = r.total;
        }
        return {
          ageCategory: cat,
          discipline: disc,
          format: fmt,
          athleteId: r.athleteId,
          partnershipId: r.partnershipId,
          totalPoints: r.total,
          position,
          prevPosition: prevPos.get(`${r.partnershipId ?? r.athleteId}|${cat}|${disc}|${fmt}`) ?? null,
        };
      }),
    });
  }
}
