"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, can, clubScope } from "@/lib/rbac";

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
    data: { leaderId, followerId, startDate: new Date() },
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
