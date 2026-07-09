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
    redirect("/admin");
  }
  if (!clubId) redirect("/admin/athletes?error=club");

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? "");
  const gender = String(formData.get("gender") ?? "") as Gender;
  if (!firstName || !lastName || !birthDate || !["MALE", "FEMALE"].includes(gender)) {
    redirect("/admin/athletes?error=fields");
  }

  // MIN: next sequential federation number
  const last = await db.athlete.findFirst({
    orderBy: { minNumber: "desc" },
    select: { minNumber: true },
  });
  const nextNum = (parseInt(last?.minNumber.replace(/\D/g, "") ?? "1000", 10) || 1000) + 1;
  const minNumber = `GEO-${nextNum}`;

  const athlete = await db.athlete.create({
    data: {
      minNumber,
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
      detail: `${firstName} ${lastName} (${minNumber})`,
    },
  });

  revalidatePath("/admin/athletes");
  redirect("/admin/athletes?created=" + minNumber);
}
