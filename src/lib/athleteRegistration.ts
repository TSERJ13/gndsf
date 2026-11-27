// Athlete registration workflow shared by the portal actions:
// club submits → federation approves/returns → athlete (or parent) gets a
// cabinet invite with their E-CARD.
import type { Athlete } from "@prisma/client";
import { db } from "./db";
import { issueToken, unusablePassword } from "./tokens";
import { athleteApprovedToClub, athleteReturnedToClub, athleteWelcome } from "./notify";

export function isMinor(birthDate: Date, at = new Date()) {
  const adult = new Date(birthDate);
  adult.setFullYear(adult.getFullYear() + 18);
  return adult > at;
}

// Where the cabinet invite goes: the parent for minors, else the athlete.
export function contactEmailFor(a: Pick<Athlete, "birthDate" | "email" | "parentEmail">) {
  const email = isMinor(a.birthDate) ? a.parentEmail || a.email : a.email || a.parentEmail;
  return email?.toLowerCase().trim() || null;
}

async function clubManagerEmails(athleteId: string) {
  const managers = await db.user.findMany({
    where: {
      role: "CLUB_MANAGER",
      isActive: true,
      club: { memberships: { some: { athleteId, endDate: null } } },
    },
    select: { email: true },
  });
  return managers.map((m) => m.email);
}

export type InviteResult = "sent" | "no-email" | "email-taken";

// Creates the athlete's cabinet account if needed and e-mails a
// "set your password" link. Safe to call again to re-send the invite.
export async function inviteAthlete(athleteId: string, emailOverride?: string): Promise<InviteResult> {
  const athlete = await db.athlete.findUniqueOrThrow({ where: { id: athleteId }, include: { user: true } });
  const email = (emailOverride?.toLowerCase().trim() || contactEmailFor(athlete)) ?? null;
  if (!email) return "no-email";

  let user = athlete.user;
  if (!user) {
    const taken = await db.user.findUnique({ where: { email } });
    if (taken) return "email-taken";
    user = await db.user.create({
      data: {
        email,
        name: `${athlete.firstName} ${athlete.lastName}`,
        role: "ATHLETE",
        athleteId: athlete.id,
        passwordHash: unusablePassword(),
      },
    });
  }

  const link = await issueToken(user.id, "INVITE");
  await athleteWelcome(user.email, `${athlete.firstName} ${athlete.lastName}`, athlete.gid, link);
  return "sent";
}

export async function approveAthlete(athleteId: string, reviewerId: string) {
  const athlete = await db.athlete.update({
    where: { id: athleteId },
    data: { status: "APPROVED", reviewNote: null, reviewedById: reviewerId, reviewedAt: new Date() },
  });
  await db.auditLog.create({
    data: {
      userId: reviewerId,
      action: "ATHLETE_APPROVE",
      entity: "Athlete",
      entityId: athleteId,
      detail: `${athlete.firstName} ${athlete.lastName} (${athlete.gid})`,
    },
  });
  const invite = await inviteAthlete(athleteId);
  await athleteApprovedToClub(
    await clubManagerEmails(athleteId),
    `${athlete.firstName} ${athlete.lastName}`,
    athlete.gid,
  );
  return invite;
}

export async function returnAthlete(athleteId: string, reviewerId: string, note: string) {
  const athlete = await db.athlete.update({
    where: { id: athleteId },
    data: { status: "REJECTED", reviewNote: note, reviewedById: reviewerId, reviewedAt: new Date() },
  });
  await db.auditLog.create({
    data: {
      userId: reviewerId,
      action: "ATHLETE_RETURN",
      entity: "Athlete",
      entityId: athleteId,
      detail: `${athlete.firstName} ${athlete.lastName}: ${note}`,
    },
  });
  await athleteReturnedToClub(
    await clubManagerEmails(athleteId),
    `${athlete.firstName} ${athlete.lastName}`,
    note,
  );
}
