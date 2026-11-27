"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, can, clubScope } from "@/lib/rbac";
import { uploadPhoto } from "@/lib/image";

// Forming a couple: SUPER_ADMIN/PRESIDENT/VICE_PRESIDENT may pair any two
// free athletes. A CLUB_MANAGER may pair two, but ONLY if both are
// currently active members of their own club — enforced server-side
// below, not just hidden in the UI (the free-agent pickers are already
// club-scoped, but a tampered form submission must still be rejected).
export async function formPartnership(formData: FormData) {
  const user = await requireUser();
  const canAny = can(user, "PARTNERSHIP_MANAGE_ALL");
  const canOwnClub = can(user, "PARTNERSHIP_MANAGE_OWN_CLUB");
  if (!canAny && !canOwnClub) redirect("/portal/partnerships?error=unauthorized");

  const leaderId = String(formData.get("leaderId") ?? "");
  const followerId = String(formData.get("followerId") ?? "");
  if (!leaderId || !followerId || leaderId === followerId) {
    redirect("/portal/partnerships?error=pick");
  }

  if (!canAny) {
    const scope = clubScope(user);
    const bothInClub = await db.athlete.count({
      where: {
        id: { in: [leaderId, followerId] },
        clubMemberships: { some: { clubId: scope?.clubId, endDate: null } },
      },
    });
    if (!scope || bothInClub !== 2) {
      redirect("/portal/partnerships?error=unauthorized");
    }
  }

  // Only federation-approved athletes can form a couple.
  const approved = await db.athlete.findMany({
    where: { id: { in: [leaderId, followerId] }, status: "APPROVED", isActive: true },
    include: { clubMemberships: { where: { endDate: null } } },
  });
  if (approved.length !== 2) redirect("/portal/partnerships?error=notapproved");

  // Which club(s) the couple represents: chosen when forming. A club
  // manager's couple always represents their own club.
  const partnerClubs = new Set(approved.flatMap((a) => a.clubMemberships.map((m) => m.clubId)));
  let clubId = canAny ? String(formData.get("clubId") ?? "") || null : clubScope(user)?.clubId ?? null;
  let secondClubId = canAny ? String(formData.get("secondClubId") ?? "") || null : null;
  if (clubId && !partnerClubs.has(clubId)) clubId = null;
  if (secondClubId && (!partnerClubs.has(secondClubId) || secondClubId === clubId)) secondClubId = null;
  if (!clubId) clubId = approved[0].clubMemberships[0]?.clubId ?? null;

  // Business rule: an athlete may have only ONE active partnership.
  const conflict = await db.partnership.findFirst({
    where: {
      endDate: null,
      OR: [
        { leaderId: { in: [leaderId, followerId] } },
        { followerId: { in: [leaderId, followerId] } },
      ],
    },
  });
  if (conflict) redirect("/portal/partnerships?error=busy");

  const p = await db.partnership.create({
    data: { leaderId, followerId, startDate: new Date(), clubId, secondClubId },
    include: { leader: true, follower: true },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "PARTNERSHIP_FORM",
      entity: "Partnership",
      entityId: p.id,
      detail: `${p.leader.lastName} · ${p.follower.lastName}`,
    },
  });

  revalidatePath("/portal/partnerships");
  redirect("/portal/partnerships?ok=formed");
}

// Splitting NEVER deletes — it closes the period. History stays intact.
export async function splitPartnership(formData: FormData) {
  const user = await requireUser();
  const canAny = can(user, "PARTNERSHIP_MANAGE_ALL");
  const canOwnClub = can(user, "PARTNERSHIP_MANAGE_OWN_CLUB");
  if (!canAny && !canOwnClub) redirect("/portal/partnerships?error=unauthorized");

  const id = String(formData.get("id") ?? "");

  if (!canAny) {
    const scope = clubScope(user);
    const existing = await db.partnership.findUnique({
      where: { id },
      select: { leaderId: true, followerId: true },
    });
    const bothInClub = existing
      ? await db.athlete.count({
          where: {
            id: { in: [existing.leaderId, existing.followerId] },
            clubMemberships: { some: { clubId: scope?.clubId, endDate: null } },
          },
        })
      : 0;
    if (!existing || !scope || bothInClub !== 2) {
      redirect("/portal/partnerships?error=unauthorized");
    }
  }

  const p = await db.partnership.update({
    where: { id },
    data: { endDate: new Date() },
    include: { leader: true, follower: true },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "PARTNERSHIP_SPLIT",
      entity: "Partnership",
      entityId: p.id,
      detail: `${p.leader.lastName} · ${p.follower.lastName}`,
    },
  });

  revalidatePath("/portal/partnerships");
  redirect("/portal/partnerships?ok=split");
}

// Couple photo: the club the couple represents, or the federation.
export async function uploadCouplePhoto(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const p = await db.partnership.findUniqueOrThrow({
    where: { id },
    include: { leader: { include: { clubMemberships: { where: { endDate: null } } } } },
  });
  const clubIds = [p.clubId, p.secondClubId, ...p.leader.clubMemberships.map((m) => m.clubId)];
  const allowed =
    can(user, "PARTNERSHIP_MANAGE_ALL") ||
    (can(user, "PARTNERSHIP_MANAGE_OWN_CLUB") && !!user.clubId && clubIds.includes(user.clubId));
  if (!allowed) redirect("/portal/partnerships?error=unauthorized");

  const url = await uploadPhoto(formData.get("photo"), `couples/${id}`);
  if (!url) redirect("/portal/partnerships?error=photo");
  await db.partnership.update({ where: { id }, data: { photoUrl: url } });
  revalidatePath("/portal/partnerships");
  revalidatePath(`/couples/${id}`);
  redirect("/portal/partnerships?ok=photo");
}
