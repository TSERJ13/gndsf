"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";

async function audit(userId: string, action: string, entityId: string, detail: string) {
  await db.auditLog.create({ data: { userId, action, entity: "Club", entityId, detail } });
}

function refresh(id?: string) {
  for (const p of ["/admin/clubs", "/clubs", "/"]) revalidatePath(p);
  if (id) revalidatePath(`/admin/clubs/${id}`);
}

function fields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    nameEn: String(formData.get("nameEn") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
  };
}

export async function createClub(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const f = fields(formData);
  if (!f.name || !f.city) redirect("/admin/clubs?error=fields");

  const c = await db.club.create({ data: f });
  await audit(user.id, "CLUB_CREATE", c.id, f.name);
  refresh();
  redirect("/admin/clubs?ok=created");
}

export async function updateClub(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const id = String(formData.get("id"));
  const f = fields(formData);
  if (!f.name || !f.city) redirect(`/admin/clubs/${id}?error=fields`);

  await db.club.update({ where: { id }, data: f });
  await audit(user.id, "CLUB_UPDATE", id, f.name);
  refresh(id);
  redirect(`/admin/clubs/${id}?ok=updated`);
}

// Deactivation hides the club from public pages and forms;
// history (memberships, entry snapshots) is untouched by design.
export async function toggleClubActive(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const id = String(formData.get("id"));

  const club = await db.club.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { memberships: { where: { endDate: null } } } } },
  });
  if (club.isActive && club._count.memberships > 0) {
    redirect(`/admin/clubs/${id}?error=hasathletes`);
  }

  const c = await db.club.update({ where: { id }, data: { isActive: !club.isActive } });
  await audit(user.id, c.isActive ? "CLUB_ACTIVATE" : "CLUB_DEACTIVATE", id, c.name);
  refresh(id);
  redirect(`/admin/clubs/${id}?ok=toggled`);
}

// The transfer: closes the current membership period, opens a new one.
// Past entry snapshots keep pointing at the old club — history intact.
export async function transferAthlete(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const athleteId = String(formData.get("athleteId"));
  const clubId = String(formData.get("clubId"));
  if (!athleteId || !clubId) redirect("/admin/clubs?error=transfer");

  const current = await db.clubMembership.findFirst({
    where: { athleteId, endDate: null },
    include: { club: true },
  });
  if (current?.clubId === clubId) redirect("/admin/clubs?error=sameclub");

  const [athlete, newClub] = await Promise.all([
    db.athlete.findUniqueOrThrow({ where: { id: athleteId } }),
    db.club.findUniqueOrThrow({ where: { id: clubId } }),
  ]);

  await db.$transaction(async (tx) => {
    if (current) {
      await tx.clubMembership.update({
        where: { id: current.id },
        data: { endDate: new Date() },
      });
    }
    await tx.clubMembership.create({
      data: { athleteId, clubId, startDate: new Date() },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "ATHLETE_TRANSFER",
        entity: "Athlete",
        entityId: athleteId,
        detail: `${athlete.gid}: ${current?.club.name ?? "—"} → ${newClub.name}`,
      },
    });
  });

  refresh();
  revalidatePath("/admin/athletes");
  revalidatePath(`/athletes/${athleteId}`);
  redirect("/admin/clubs?ok=transferred");
}
