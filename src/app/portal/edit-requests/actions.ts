"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/rbac";

const REGISTRY = ["SUPER_ADMIN", "PRESIDENT", "GENERAL_SECRETARY"];

export async function approveEditRequest(formData: FormData) {
  const user = await requireStaff();
  if (!REGISTRY.includes(user.role)) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  if (!id) return;

  const req = await db.athleteEditRequest.findUnique({ where: { id } });
  if (!req || req.status !== "PENDING") return;

  // Update athlete details
  await db.$transaction([
    db.athleteEditRequest.update({
      where: { id },
      data: { status: "APPROVED" },
    }),
    db.athlete.update({
      where: { id: req.athleteId },
      data: {
        firstName: req.firstName,
        lastName: req.lastName,
        ...(req.firstNameEn && { firstNameEn: req.firstNameEn }),
        ...(req.lastNameEn && { lastNameEn: req.lastNameEn }),
      },
    }),
    db.auditLog.create({
      data: {
        userId: user.id,
        action: "ATHLETE_EDIT_APPROVED",
        entity: "Athlete",
        entityId: req.athleteId,
        detail: `Name changed to ${req.firstName} ${req.lastName}`,
      },
    }),
  ]);

  revalidatePath("/portal/edit-requests");
  revalidatePath("/portal/athletes");
  revalidatePath(`/portal/athletes/${req.athleteId}`);
  revalidatePath("/athletes");
}

export async function rejectEditRequest(formData: FormData) {
  const user = await requireStaff();
  if (!REGISTRY.includes(user.role)) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  if (!id) return;

  const req = await db.athleteEditRequest.findUnique({ where: { id } });
  if (!req || req.status !== "PENDING") return;

  await db.$transaction([
    db.athleteEditRequest.update({
      where: { id },
      data: { status: "REJECTED" },
    }),
    db.auditLog.create({
      data: {
        userId: user.id,
        action: "ATHLETE_EDIT_REJECTED",
        entity: "Athlete",
        entityId: req.athleteId,
        detail: `Rejected name change to ${req.firstName} ${req.lastName}`,
      },
    }),
  ]);

  revalidatePath("/portal/edit-requests");
  revalidatePath(`/portal/athletes/${req.athleteId}`);
}
