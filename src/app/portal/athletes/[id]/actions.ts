"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/rbac";

export async function requestAthleteEdit(formData: FormData) {
  const user = await requireStaff();
  
  const athleteId = formData.get("athleteId") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const firstNameEn = formData.get("firstNameEn") as string | null;
  const lastNameEn = formData.get("lastNameEn") as string | null;
  const birthDateStr = formData.get("birthDate") as string;

  if (!athleteId || !firstName || !lastName || !birthDateStr) {
    redirect(`/portal/athletes/${athleteId}?error=missing_fields`);
  }

  // Verify permission
  const athlete = await db.athlete.findUnique({
    where: { id: athleteId },
    include: { clubMemberships: { where: { endDate: null } } },
  });

  if (!athlete) throw new Error("Athlete not found");

  const isRegistry = ["SUPER_ADMIN", "PRESIDENT", "GENERAL_SECRETARY"].includes(user.role);
  if (!isRegistry) {
    const allowed = user.role === "CLUB_MANAGER" && athlete.clubMemberships.some((m) => m.clubId === user.clubId);
    if (!allowed) throw new Error("Unauthorized");
  }

  // Check if a pending request already exists
  const existing = await db.athleteEditRequest.findFirst({
    where: { athleteId, status: "PENDING" },
  });

  if (existing) {
    redirect(`/portal/athletes/${athleteId}?error=already_pending`);
  }

  await db.athleteEditRequest.create({
    data: {
      athleteId,
      firstName,
      lastName,
      firstNameEn: firstNameEn || null,
      lastNameEn: lastNameEn || null,
      birthDate: new Date(birthDateStr),
      status: "PENDING",
      requestedById: user.id,
    },
  });

  revalidatePath(`/portal/athletes/${athleteId}`);
  redirect(`/portal/athletes/${athleteId}?ok=requested`);
}

export async function deleteAthlete(athleteId: string) {
  const user = await requireStaff();
  
  if (!["SUPER_ADMIN", "PRESIDENT", "VICE_PRESIDENT"].includes(user.role)) {
    return { success: false, error: "უფლება არ გაქვთ" };
  }

  try {
    // Attempt to delete athlete and all safe related records
    await db.$transaction([
      db.clubMembership.deleteMany({ where: { athleteId } }),
      db.athleteDocument.deleteMany({ where: { athleteId } }),
      db.athleteEditRequest.deleteMany({ where: { athleteId } }),
      db.clubTransferRequest.deleteMany({ where: { athleteId } }),
      db.user.deleteMany({ where: { athleteId } }),
      db.partnership.deleteMany({ where: { OR: [{ leaderId: athleteId }, { followerId: athleteId }] } }),
      db.athlete.delete({ where: { id: athleteId } })
    ]);
    return { success: true };
  } catch (e: any) {
    console.error("Delete athlete error", e);
    return { success: false, error: "სპორტსმენის წაშლა შეუძლებელია, რადგან ის ფიქსირდება ტურნირებზე ან სხვა მნიშვნელოვან ჩანაწერებში." };
  }
}
