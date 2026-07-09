"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, RESULT_ADMINS } from "@/lib/rbac";
import { categoryFor } from "@/lib/labels";
import { commitEventResults } from "@/lib/results";
import type { AgeCategory, Discipline, Format } from "@prisma/client";

export async function addEvent(formData: FormData) {
  await requireRole(RESULT_ADMINS);
  const competitionId = String(formData.get("competitionId"));
  const ageCategory = String(formData.get("ageCategory")) as AgeCategory;
  const discipline = String(formData.get("discipline")) as Discipline;
  const format = String(formData.get("format")) as Format;

  await db.compEvent.upsert({
    where: {
      competitionId_ageCategory_discipline_format: {
        competitionId, ageCategory, discipline, format,
      },
    },
    create: { competitionId, ageCategory, discipline, format },
    update: {},
  });
  revalidatePath(`/admin/competitions/${competitionId}`);
  redirect(`/admin/competitions/${competitionId}`);
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
  const back = `/admin/competitions/${event.competitionId}`;
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

  await commitEventResults(eventId, placements, user.id);

  // public pages read live data (force-dynamic), admin path revalidated
  revalidatePath(`/admin/competitions/${event.competitionId}`);
  redirect(`/admin/competitions/${event.competitionId}?ok=committed`);
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
  revalidatePath(`/admin/competitions/${id}`);
  redirect(`/admin/competitions/${id}`);
}
