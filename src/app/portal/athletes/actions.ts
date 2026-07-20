"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, REGISTRY_ADMINS } from "@/lib/rbac";
import type { Gender } from "@prisma/client";

// CLUB_MANAGER may register athletes ONLY into their own club;
// registry admins may register into any club.
export async function createAthlete(formData: FormData) {
  const user = await requireUser();

  const requestedClubId = String(formData.get("clubId") ?? "");
  const clubId =
    user.role === "CLUB_MANAGER"
      ? user.clubId // scope override — form value is ignored on purpose
      : requestedClubId;

  if (!REGISTRY_ADMINS.includes(user.role) && user.role !== "CLUB_MANAGER") {
    redirect("/portal");
  }
  if (!clubId) redirect("/portal/athletes?error=club");

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? "");
  const gender = String(formData.get("gender") ?? "") as Gender;
  if (!firstName || !lastName || !birthDate || !["MALE", "FEMALE"].includes(gender)) {
    redirect("/portal/athletes?error=fields");
  }

  // MIN: next sequential federation number
  const last = await db.athlete.findFirst({
    orderBy: { gid: "desc" },
    select: { gid: true },
  });
  const nextNum = (parseInt(last?.gid.replace(/\D/g, "") ?? "1000", 10) || 1000) + 1;
  const gid = `GID-${nextNum}`;

  const athlete = await db.athlete.create({
    data: {
      gid,
      firstName,
      lastName,
      birthDate: new Date(birthDate),
      gender,
      clubMemberships: {
        create: { clubId, startDate: new Date() },
      },
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "ATHLETE_CREATE",
      entity: "Athlete",
      entityId: athlete.id,
      detail: `${firstName} ${lastName} (${gid})`,
    },
  });

  revalidatePath("/portal/athletes");
  redirect("/portal/athletes?created=" + gid);
}

// ── Athlete portal account (email + password → /cabinet access) ──
export async function createPortalAccount(formData: FormData) {
  const { requireRole, REGISTRY_ADMINS } = await import("@/lib/rbac");
  const bcrypt = (await import("bcryptjs")).default;
  const user = await requireRole(REGISTRY_ADMINS);

  const athleteId = String(formData.get("athleteId") ?? "");
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!athleteId || !email || password.length < 8) {
    redirect("/portal/athletes?error=portal");
  }

  const athlete = await db.athlete.findUniqueOrThrow({ where: { id: athleteId } });
  const exists = await db.user.findFirst({
    where: { OR: [{ email }, { athleteId }] },
  });
  if (exists) redirect("/portal/athletes?error=portalexists");

  await db.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      name: `${athlete.firstName} ${athlete.lastName}`,
      role: "ATHLETE",
      athleteId,
    },
  });
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "PORTAL_ACCOUNT_CREATE",
      entity: "User",
      entityId: athleteId,
      detail: `${athlete.gid} → ${email}`,
    },
  });
  revalidatePath("/portal/athletes");
  redirect("/portal/athletes?created=portal");
}
