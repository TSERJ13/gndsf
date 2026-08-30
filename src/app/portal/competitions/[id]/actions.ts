"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, RESULT_ADMINS } from "@/lib/rbac";
import { categoryFor } from "@/lib/labels";
import { commitEventResults } from "@/lib/results";
import type { AgeCategory, Discipline, Format, DanceClass, CoupleCategory } from "@prisma/client";

export async function addEvent(formData: FormData) {
  await requireRole(RESULT_ADMINS);
  const competitionId = String(formData.get("competitionId"));
  const ageCategory = String(formData.get("ageCategory")) as AgeCategory;
  const discipline = String(formData.get("discipline")) as Discipline;
  const format = String(formData.get("format")) as Format;
  // Only one of these applies depending on `format` — the unused select
  // is ignored below. Both are required for scoring at result-commit time
  // (see commitResults), but left optional here so an event can still be
  // created and entries registered before the class/category is decided.
  const danceClassRaw = String(formData.get("danceClass") ?? "");
  const coupleCategoryRaw = String(formData.get("coupleCategory") ?? "");
  const danceClass = (format === "SOLO" && danceClassRaw ? danceClassRaw : null) as DanceClass | null;
  const coupleCategory = (format === "COUPLE" && coupleCategoryRaw ? coupleCategoryRaw : null) as CoupleCategory | null;

  await db.compEvent.upsert({
    where: {
      CompEventScoring: {
        competitionId, ageCategory, discipline, format, danceClass, coupleCategory,
      },
    },
    create: { competitionId, ageCategory, discipline, format, danceClass, coupleCategory },
    update: { danceClass, coupleCategory },
  });
  revalidatePath(`/portal/competitions/${competitionId}`);
  redirect(`/portal/competitions/${competitionId}`);
}

// Registration snapshots BOTH the age category and the club — as of today.
// This is what keeps history truthful after future transfers/splits.
export async function addEntry(formData: FormData) {
  await requireRole(RESULT_ADMINS);
  const eventId = String(formData.get("eventId"));
  const participant = String(formData.get("participant") ?? ""); // "P:<id>" | "A:<id>"

  const event = await db.compEvent.findUniqueOrThrow({
    where: { id: eventId },
    select: { competitionId: true, format: true },
  });
  const back = `/portal/competitions/${event.competitionId}`;
  if (!participant.includes(":")) redirect(`${back}?error=pick`);
  const [kind, id] = participant.split(":");

  if (kind === "P") {
    const p = await db.partnership.findUniqueOrThrow({
      where: { id },
      include: { leader: true, follower: true },
    });
    // category: the OLDER partner decides (WDSF rule)
    const cat = categoryFor(
      new Date(Math.min(+p.leader.birthDate, +p.follower.birthDate)),
    );
    const leaderClub = await db.clubMembership.findFirst({
      where: { athleteId: p.leaderId, endDate: null },
    });
    await db.entry.create({
      data: {
        eventId,
        partnershipId: p.id,
        ageCategorySnapshot: cat,
        clubIdSnapshot: leaderClub?.clubId ?? null,
      },
    });
  } else {
    const a = await db.athlete.findUniqueOrThrow({ where: { id } });
    const club = await db.clubMembership.findFirst({
      where: { athleteId: a.id, endDate: null },
    });
    await db.entry.create({
      data: {
        eventId,
        athleteId: a.id,
        ageCategorySnapshot: categoryFor(a.birthDate),
        clubIdSnapshot: club?.clubId ?? null,
      },
    });
  }
  revalidatePath(back);
  redirect(back);
}

export async function commitResults(formData: FormData) {
  const user = await requireRole(RESULT_ADMINS);
  const eventId = String(formData.get("eventId"));
  const event = await db.compEvent.findUniqueOrThrow({
    where: { id: eventId },
    select: { competitionId: true, entries: { select: { id: true } } },
  });

  const placements: { entryId: string; placement: number }[] = [];
  for (const e of event.entries) {
    const raw = formData.get(`placement_${e.id}`);
    const n = Number(raw);
    if (raw && Number.isInteger(n) && n >= 1) placements.push({ entryId: e.id, placement: n });
  }

  try {
    await commitEventResults(eventId, placements, user.id);
  } catch (err) {
    // getSoloScore/getCoupleScore throw a descriptive message when the
    // event is missing its class/category, or the place/class/field-size
    // combination isn't in the federation's confirmed points table —
    // surface that to the admin instead of a raw 500.
    const detail = err instanceof Error ? err.message : "უცნობი შეცდომა ქულების დათვლისას.";
    redirect(
      `/portal/competitions/${event.competitionId}?error=scoring&detail=${encodeURIComponent(detail)}`,
    );
  }

  // public pages read live data (force-dynamic), admin path revalidated
  revalidatePath(`/portal/competitions/${event.competitionId}`);
  redirect(`/portal/competitions/${event.competitionId}?ok=committed`);
}

export async function publishCompetition(formData: FormData) {
  const user = await requireRole(RESULT_ADMINS);
  const id = String(formData.get("id"));
  const comp = await db.competition.update({
    where: { id },
    data: { isPublished: true },
  });
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "COMPETITION_PUBLISH",
      entity: "Competition",
      entityId: id,
      detail: comp.name,
    },
  });
  revalidatePath(`/portal/competitions/${id}`);
  redirect(`/portal/competitions/${id}`);
}
