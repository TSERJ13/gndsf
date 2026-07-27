"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function approveRegistration(id: string) {
  const user = await requireRole(["SUPER_ADMIN", "VICE_PRESIDENT", "PRESIDENT"]);

  const reg = await db.athleteRegistration.findUnique({ where: { id } });
  if (!reg) throw new Error("Registration not found");

  // 1. Try to find by personalNumber
  let athlete = await db.athlete.findUnique({
    where: { personalNumber: reg.personalNumber }
  });

  // 2. Fallback to name and birthdate
  if (!athlete) {
    athlete = await db.athlete.findFirst({
      where: {
        firstName: reg.firstName,
        lastName: reg.lastName,
        birthDate: reg.birthDate
      }
    });
  }

  if (athlete) {
    // Update existing athlete's personalNumber and photoUrl
    await db.athlete.update({
      where: { id: athlete.id },
      data: {
        personalNumber: reg.personalNumber,
        photoUrl: reg.profilePictureUrl || athlete.photoUrl
      }
    });

    // Add to club if clubId exists and not already active in this club
    if (reg.clubId) {
      const activeMembership = await db.clubMembership.findFirst({
        where: {
          athleteId: athlete.id,
          clubId: reg.clubId,
          endDate: null
        }
      });
      if (!activeMembership) {
        await db.clubMembership.create({
          data: {
            athleteId: athlete.id,
            clubId: reg.clubId,
            startDate: new Date(),
          }
        });
      }
    }
  } else {
    // Generate new GID
    const last = await db.athlete.findFirst({
      orderBy: { gid: "desc" },
      select: { gid: true },
    });
    const nextNum = (parseInt(last?.gid.replace(/\D/g, "") ?? "1000", 10) || 1000) + 1;
    const gid = `GID-${nextNum}`;

    // Create new athlete
    athlete = await db.athlete.create({
      data: {
        gid,
        firstName: reg.firstName,
        lastName: reg.lastName,
        firstNameEn: reg.firstNameEn,
        lastNameEn: reg.lastNameEn,
        birthDate: reg.birthDate,
        gender: reg.gender,
        personalNumber: reg.personalNumber,
        photoUrl: reg.profilePictureUrl,
        clubMemberships: reg.clubId ? {
          create: { clubId: reg.clubId, startDate: new Date() },
        } : undefined,
      }
    });
    
    // Audit Log for Athlete Create
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "ATHLETE_CREATE",
        entity: "Athlete",
        entityId: athlete.id,
        detail: `Auto-created from e-Card: ${reg.firstName} ${reg.lastName} (${gid})`,
      },
    });
  }

  // Mark registration as approved
  await db.athleteRegistration.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  revalidatePath("/portal/e-cards");
  revalidatePath("/portal/athletes");
}

export async function rejectRegistration(id: string) {
  await requireRole(["SUPER_ADMIN", "VICE_PRESIDENT", "PRESIDENT"]);

  await db.athleteRegistration.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  revalidatePath("/portal/e-cards");
}
