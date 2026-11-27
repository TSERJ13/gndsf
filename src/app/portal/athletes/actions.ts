"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, can } from "@/lib/rbac";
import type { Gender } from "@prisma/client";
import { isMinor, approveAthlete, returnAthlete, inviteAthlete } from "@/lib/athleteRegistration";
import { federationNewApplication } from "@/lib/notify";

const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const MAX_PHOTO = 4 * 1024 * 1024;

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => text(fd, k) || null;

async function savePhoto(file: FormDataEntryValue | null, gid: string): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!PHOTO_TYPES[file.type] || file.size > MAX_PHOTO) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { put } = await import("@vercel/blob");
    const blob = await put(`athletes/${gid}${PHOTO_TYPES[file.type]}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return blob.url;
  } catch (e) {
    console.error("athlete photo upload failed:", e);
    return null;
  }
}

// Clubs register athletes into their own club; the athlete starts as
// PENDING until the federation (president or admin) approves. Federation
// staff who can approve register athletes as already approved.
export async function createAthlete(formData: FormData) {
  const user = await requireUser();

  const canAny = can(user, "ATHLETE_MANAGE_ALL");
  const canOwnClub = can(user, "ATHLETE_MANAGE_OWN_CLUB");
  if (!canAny && !canOwnClub) redirect("/portal");
  const autoApprove = can(user, "ATHLETE_APPROVE");

  // A club manager's submitted clubId is ignored: always their own club.
  const clubId = canAny ? text(formData, "clubId") : user.clubId ?? "";
  if (!clubId) redirect("/portal/athletes?error=club");

  const firstName = text(formData, "firstName");
  const lastName = text(formData, "lastName");
  const birthDateRaw = text(formData, "birthDate");
  const gender = text(formData, "gender") as Gender;
  const personalNumber = text(formData, "personalNumber");
  if (!firstName || !lastName || !birthDateRaw || !["MALE", "FEMALE"].includes(gender) || !personalNumber) {
    redirect("/portal/athletes?error=fields");
  }
  const birthDate = new Date(birthDateRaw);
  if (Number.isNaN(+birthDate) || birthDate > new Date()) redirect("/portal/athletes?error=fields");

  const email = opt(formData, "email")?.toLowerCase() ?? null;
  const parentName = opt(formData, "parentName");
  const parentEmail = opt(formData, "parentEmail")?.toLowerCase() ?? null;
  const minor = isMinor(birthDate);
  // The invite needs an address: the parent's for minors, else the athlete's.
  if (minor ? !parentName || !parentEmail : !email) redirect("/portal/athletes?error=contact");

  // One person = one athlete record (personal number is unique).
  const existing = await db.athlete.findUnique({ where: { personalNumber } });
  if (existing) redirect(`/portal/athletes?error=exists&gid=${encodeURIComponent(existing.gid)}`);

  const last = await db.athlete.findFirst({ orderBy: { gid: "desc" }, select: { gid: true } });
  const nextNum = (parseInt(last?.gid.replace(/\D/g, "") ?? "1000", 10) || 1000) + 1;
  const gid = `GID-${nextNum}`;
  const photoUrl = await savePhoto(formData.get("photo"), gid);

  const athlete = await db.athlete.create({
    data: {
      gid,
      firstName,
      lastName,
      firstNameEn: opt(formData, "firstNameEn"),
      lastNameEn: opt(formData, "lastNameEn"),
      birthDate,
      gender,
      personalNumber,
      photoUrl,
      email,
      phone: opt(formData, "phone"),
      parentName,
      parentEmail,
      parentPhone: opt(formData, "parentPhone"),
      status: autoApprove ? "APPROVED" : "PENDING",
      submittedById: user.id,
      ...(autoApprove ? { reviewedById: user.id, reviewedAt: new Date() } : {}),
      clubMemberships: { create: { clubId, startDate: new Date() } },
    },
    include: { clubMemberships: { include: { club: true } } },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "ATHLETE_CREATE",
      entity: "Athlete",
      entityId: athlete.id,
      detail: `${firstName} ${lastName} (${gid})${autoApprove ? "" : " — განხილვაზე"}`,
    },
  });

  if (autoApprove) {
    await inviteAthlete(athlete.id);
  } else {
    await federationNewApplication(
      "athlete",
      `${firstName} ${lastName}`,
      `ათლეტი: ${firstName} ${lastName} (${gid})\nკლუბი: ${athlete.clubMemberships[0]?.club.name ?? "—"}\nდაბადების თარიღი: ${birthDateRaw}`,
    );
  }

  revalidatePath("/portal/athletes");
  // Next step for the club: upload the ID document on the athlete's page.
  redirect(`/portal/athletes/${athlete.id}?created=${autoApprove ? "approved" : "pending"}`);
}

// Club edits an athlete that is still pending or was returned, and sends
// it (back) to the federation.
export async function updatePendingAthlete(formData: FormData) {
  const user = await requireUser();
  const id = text(formData, "id");
  const athlete = await db.athlete.findUniqueOrThrow({
    where: { id },
    include: { clubMemberships: { where: { endDate: null } } },
  });
  const ownClub = athlete.clubMemberships.some((m) => m.clubId === user.clubId);
  if (!(can(user, "ATHLETE_MANAGE_ALL") || (can(user, "ATHLETE_MANAGE_OWN_CLUB") && ownClub))) redirect("/portal");
  if (athlete.status === "APPROVED") redirect(`/portal/athletes/${id}`);

  const birthDateRaw = text(formData, "birthDate");
  const birthDate = new Date(birthDateRaw);
  const personalNumber = text(formData, "personalNumber");
  if (!text(formData, "firstName") || !text(formData, "lastName") || Number.isNaN(+birthDate) || !personalNumber) {
    redirect(`/portal/athletes/${id}?error=fields`);
  }
  const clash = await db.athlete.findFirst({ where: { personalNumber, id: { not: id } } });
  if (clash) redirect(`/portal/athletes/${id}?error=exists`);

  const parentEmail = opt(formData, "parentEmail")?.toLowerCase() ?? null;
  const email = opt(formData, "email")?.toLowerCase() ?? null;
  if (isMinor(birthDate) ? !opt(formData, "parentName") || !parentEmail : !email) {
    redirect(`/portal/athletes/${id}?error=contact`);
  }

  const photoUrl = await savePhoto(formData.get("photo"), athlete.gid);
  await db.athlete.update({
    where: { id },
    data: {
      firstName: text(formData, "firstName"),
      lastName: text(formData, "lastName"),
      firstNameEn: opt(formData, "firstNameEn"),
      lastNameEn: opt(formData, "lastNameEn"),
      birthDate,
      personalNumber,
      email,
      phone: opt(formData, "phone"),
      parentName: opt(formData, "parentName"),
      parentEmail,
      parentPhone: opt(formData, "parentPhone"),
      ...(photoUrl ? { photoUrl } : {}),
      status: "PENDING",
    },
  });
  await db.auditLog.create({
    data: { userId: user.id, action: "ATHLETE_RESUBMIT", entity: "Athlete", entityId: id, detail: athlete.gid },
  });
  if (athlete.status === "REJECTED") {
    await federationNewApplication(
      "athlete",
      `${athlete.firstName} ${athlete.lastName}`,
      `შესწორებული განაცხადი ხელახლა გამოიგზავნა: ${athlete.gid}`,
    );
  }
  revalidatePath(`/portal/athletes/${id}`);
  redirect(`/portal/athletes/${id}?saved=1`);
}

export async function approveAthleteAction(formData: FormData) {
  const user = await requireUser();
  if (!can(user, "ATHLETE_APPROVE")) redirect("/portal");
  const id = text(formData, "id");
  const athlete = await db.athlete.findUniqueOrThrow({ where: { id } });
  if (athlete.status === "APPROVED") redirect(`/portal/athletes/${id}`);
  const invite = await approveAthlete(id, user.id);
  revalidatePath("/portal/athletes");
  redirect(`/portal/athletes/${id}?approved=${invite}`);
}

export async function returnAthleteAction(formData: FormData) {
  const user = await requireUser();
  if (!can(user, "ATHLETE_APPROVE")) redirect("/portal");
  const id = text(formData, "id");
  const note = text(formData, "note").slice(0, 1000);
  if (!note) redirect(`/portal/athletes/${id}?error=note`);
  await returnAthlete(id, user.id, note);
  revalidatePath("/portal/athletes");
  redirect(`/portal/athletes/${id}?returned=1`);
}

// (Re)send the cabinet invite — e.g. the first e-mail got lost, or the
// address changed. Optional override address.
export async function sendInviteAction(formData: FormData) {
  const user = await requireUser();
  if (!can(user, "ATHLETE_MANAGE_ALL")) redirect("/portal");
  const id = text(formData, "id");
  const athlete = await db.athlete.findUniqueOrThrow({ where: { id } });
  if (athlete.status !== "APPROVED") redirect(`/portal/athletes/${id}`);
  const result = await inviteAthlete(id, opt(formData, "email") ?? undefined);
  await db.auditLog.create({
    data: { userId: user.id, action: "ATHLETE_INVITE", entity: "Athlete", entityId: id, detail: `${athlete.gid}: ${result}` },
  });
  redirect(`/portal/athletes/${id}?invite=${result}`);
}
