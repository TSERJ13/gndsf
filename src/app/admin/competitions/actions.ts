"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, RESULT_ADMINS } from "@/lib/rbac";
import { TYPE_COEFFICIENTS } from "@/lib/points";
import type { CompetitionType } from "@prisma/client";

export async function createCompetition(formData: FormData) {
  const user = await requireRole(RESULT_ADMINS);
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const type = String(formData.get("type") ?? "NATIONAL") as CompetitionType;
  const startDate = String(formData.get("startDate") ?? "");
  if (!name || !city || !startDate) redirect("/admin/competitions?error=fields");

  const comp = await db.competition.create({
    data: {
      name,
      city,
      type,
      startDate: new Date(startDate),
      pointsCoefficient: TYPE_COEFFICIENTS[type] ?? 1.0,
    },
  });
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "COMPETITION_CREATE",
      entity: "Competition",
      entityId: comp.id,
      detail: name,
    },
  });
  revalidatePath("/admin/competitions");
  redirect(`/admin/competitions/${comp.id}`);
}
