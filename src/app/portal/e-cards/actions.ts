"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function approveRegistration(id: string) {
  await requireRole(["SUPER_ADMIN", "VICE_PRESIDENT", "PRESIDENT"]);

  await db.athleteRegistration.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  revalidatePath("/portal/e-cards");
}

export async function rejectRegistration(id: string) {
  await requireRole(["SUPER_ADMIN", "VICE_PRESIDENT", "PRESIDENT"]);

  await db.athleteRegistration.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  revalidatePath("/portal/e-cards");
}
