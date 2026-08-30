"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/permissions";

// Approving a studio signup does two things in one transaction: creates
// the Club (from the applicant's submitted details) and a CLUB_MANAGER
// User for it, reusing the passwordHash the applicant already set at
// signup — so no separate "temporary password" hand-off is needed, the
// applicant logs in immediately with what they submitted.
export async function approveClubRegistration(formData: FormData) {
  const admin = await requireCapability("CLUB_SIGNUP_REVIEW");
  const id = String(formData.get("id") ?? "");

  const reg = await db.clubRegistration.findUniqueOrThrow({ where: { id } });
  if (reg.status !== "PENDING") redirect("/portal/club-registrations");

  await db.$transaction(async (tx) => {
    const club = await tx.club.create({
      data: {
        name: reg.name,
        nameEn: reg.nameEn,
        city: reg.city,
        address: reg.address,
        phone: reg.phone,
        email: reg.email,
      },
    });

    await tx.user.create({
      data: {
        name: reg.contactName,
        email: reg.email,
        passwordHash: reg.passwordHash,
        role: "CLUB_MANAGER",
        clubId: club.id,
      },
    });

    await tx.clubRegistration.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedById: admin.id,
        createdClubId: club.id,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: admin.id,
        action: "CLUB_SIGNUP_APPROVE",
        entity: "Club",
        entityId: club.id,
        detail: `${reg.name} (${reg.email}) — სტუდიის თვითრეგისტრაცია დამტკიცდა`,
      },
    });
  });

  revalidatePath("/portal/club-registrations");
  revalidatePath("/portal/clubs");
  revalidatePath("/clubs");
  redirect("/portal/club-registrations?ok=approved");
}

export async function rejectClubRegistration(formData: FormData) {
  const admin = await requireCapability("CLUB_SIGNUP_REVIEW");
  const id = String(formData.get("id") ?? "");

  const reg = await db.clubRegistration.findUniqueOrThrow({ where: { id } });
  if (reg.status !== "PENDING") redirect("/portal/club-registrations");

  await db.clubRegistration.update({
    where: { id },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewedById: admin.id },
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "CLUB_SIGNUP_REJECT",
      entity: "ClubRegistration",
      entityId: id,
      detail: `${reg.name} (${reg.email})`,
    },
  });

  revalidatePath("/portal/club-registrations");
  redirect("/portal/club-registrations?ok=rejected");
}
