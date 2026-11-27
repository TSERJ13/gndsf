// ── Result commit: the crown-jewel operation ──
// One transaction: results + points + ranking rebuild + audit.
// Re-committing an event replaces its results cleanly (idempotent).
import { db } from "./db";
import { getSoloScore, getCoupleScore, coupleColumnFor, validUntilFrom } from "./points";
import { recomputeRankings } from "./rankings";

export async function commitEventResults(
  eventId: string,
  placements: { entryId: string; placement: number; roundsReached?: number }[],
  userId: string | null,
  recompute: boolean = true,
) {
  return db.$transaction(async (tx) => {
    const event = await tx.compEvent.findUniqueOrThrow({
      where: { id: eventId },
      include: { competition: true, entries: { include: { partnership: true } } },
    });
    const byId = new Map(event.entries.map((e) => [e.id, e]));
    // Field size = registered entries, but never smaller than the worst
    // placement being committed (e.g. a late entry added at the venue).
    const participants = Math.max(
      event.entries.length,
      ...placements.map((p) => p.placement),
    );

    // wipe previous results for this event (points cascade via resultId)
    const oldResults = await tx.result.findMany({
      where: { entry: { eventId } },
      select: { id: true },
    });
    if (oldResults.length) {
      await tx.rankingPoint.deleteMany({
        where: { resultId: { in: oldResults.map((r) => r.id) } },
      });
      await tx.result.deleteMany({ where: { id: { in: oldResults.map((r) => r.id) } } });
    }

    const earnedAt = event.competition.startDate;
    const validUntil = validUntilFrom(earnedAt);

    for (const { entryId, placement, roundsReached } of placements) {
      const entry = byId.get(entryId);
      if (!entry || placement < 1) continue;
      const result = await tx.result.create({
        data: {
          entryId,
          placement,
          roundsReached: roundsReached && roundsReached > 0 ? roundsReached : null,
        },
      });

      const pts =
        event.format === "SOLO"
          ? getSoloScore(participants, placement)
          : getCoupleScore(coupleColumnFor(event), placement);

      const athleteIds = entry.partnership
        ? [entry.partnership.leaderId, entry.partnership.followerId]
        : entry.athleteId
          ? [entry.athleteId]
          : [];
      if (pts > 0 && athleteIds.length) {
        await tx.rankingPoint.createMany({
          data: athleteIds.map((athleteId) => ({
            resultId: result.id,
            athleteId,
            points: pts,
            earnedAt,
            validUntil,
          })),
        });
      }
    }

    if (recompute) {
      await recomputeRankings(tx);
    }

    await tx.auditLog.create({
      data: {
        userId,
        action: "RESULT_COMMIT",
        entity: "CompEvent",
        entityId: eventId,
        detail: `${event.competition.name}: ${placements.length} შედეგი, რეიტინგი გადაითვალა`,
      },
    });
  }, { timeout: 30000 });
}
