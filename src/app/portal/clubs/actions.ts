"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";
import { inviteClubManager, parseBulk, EMAIL_RE } from "@/lib/clubAccounts";

async function audit(userId: string, action: string, entityId: string, detail: string) {
  await db.auditLog.create({ data: { userId, action, entity: "Club", entityId, detail } });
}

function refresh(id?: string) {
  for (const p of ["/portal/clubs", "/clubs", "/"]) revalidatePath(p);
  if (id) revalidatePath(`/portal/clubs/${id}`);
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
  if (!f.name || !f.city) redirect("/portal/clubs?error=fields");

  const managerEmail = String(formData.get("managerEmail") ?? "").trim().toLowerCase();
  const managerName = String(formData.get("managerName") ?? "").trim() || null;
  if (managerEmail && !EMAIL_RE.test(managerEmail)) redirect("/portal/clubs?error=email");

  const c = await db.club.create({ data: { ...f, email: f.email ?? (managerEmail || null) } });
  await audit(user.id, "CLUB_CREATE", c.id, f.name);
  let invite = "";
  if (managerEmail) {
    invite = await inviteClubManager(c.id, managerEmail, managerName);
    await audit(user.id, "CLUB_MANAGER_INVITE", c.id, `${managerEmail}: ${invite}`);
  }
  refresh();
  redirect(`/portal/clubs/${c.id}?ok=created${invite ? `&invite=${invite}` : ""}`);
}

// Register many studios at once: one per line "name; city; e-mail; manager".
// An existing club with the same name is reused (only the invite is sent).
export async function bulkCreateClubs(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const { rows, bad } = parseBulk(String(formData.get("list") ?? ""));
  const tally = { created: 0, sent: 0, failed: 0 };
  const failedLines = [...bad];

  for (const r of rows) {
    let club = await db.club.findFirst({ where: { name: { equals: r.name, mode: "insensitive" } } });
    if (!club) {
      club = await db.club.create({ data: { name: r.name, city: r.city, email: r.email } });
      await audit(user.id, "CLUB_CREATE", club.id, `${r.name} (სიით)`);
      tally.created++;
    }
    const result = await inviteClubManager(club.id, r.email, r.manager);
    await audit(user.id, "CLUB_MANAGER_INVITE", club.id, `${r.email}: ${result}`);
    if (result === "sent" || result === "mail-off") tally.sent++;
    else {
      tally.failed++;
      failedLines.push(r.line);
    }
  }
  refresh();
  const q = new URLSearchParams({
    ok: "bulk",
    created: String(tally.created),
    sent: String(tally.sent),
    ...(failedLines.length ? { bad: failedLines.sort((a, b) => a - b).join(",") } : {}),
  });
  redirect(`/portal/clubs?${q}`);
}

// Create the manager account for an existing club, or re-send the invite.
export async function inviteManagerAction(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const id = String(formData.get("id"));
  const email = String(formData.get("email") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;
  const result = await inviteClubManager(id, email, name);
  await audit(user.id, "CLUB_MANAGER_INVITE", id, `${email}: ${result}`);
  refresh(id);
  redirect(`/portal/clubs/${id}?invite=${result}`);
}

export async function updateClub(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const id = String(formData.get("id"));
  const f = fields(formData);
  if (!f.name || !f.city) redirect(`/portal/clubs/${id}?error=fields`);

  await db.club.update({ where: { id }, data: f });
  await audit(user.id, "CLUB_UPDATE", id, f.name);
  refresh(id);
  redirect(`/portal/clubs/${id}?ok=updated`);
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
    redirect(`/portal/clubs/${id}?error=hasathletes`);
  }

  const c = await db.club.update({ where: { id }, data: { isActive: !club.isActive } });
  await audit(user.id, c.isActive ? "CLUB_ACTIVATE" : "CLUB_DEACTIVATE", id, c.name);
  refresh(id);
  redirect(`/portal/clubs/${id}?ok=toggled`);
}

// The transfer: closes the current membership period, opens a new one.
// Past entry snapshots keep pointing at the old club — history intact.
export async function transferAthlete(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const athleteId = String(formData.get("athleteId"));
  const clubId = String(formData.get("clubId"));
  if (!athleteId || !clubId) redirect("/portal/clubs?error=transfer");

  const current = await db.clubMembership.findFirst({
    where: { athleteId, endDate: null },
    include: { club: true },
  });
  if (current?.clubId === clubId) redirect("/portal/clubs?error=sameclub");

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
  revalidatePath("/portal/athletes");
  revalidatePath(`/athletes/${athleteId}`);
  redirect("/portal/clubs?ok=transferred");
}
