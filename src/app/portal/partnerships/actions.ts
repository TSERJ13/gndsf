"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";

// Forming a couple: only registry admins (cross-club operation).
export async function formPartnership(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const leaderId = String(formData.get("leaderId") ?? "");
  const followerId = String(formData.get("followerId") ?? "");
  if (!leaderId || !followerId || leaderId === followerId) {
    redirect("/portal/partnerships?error=pick");
  }

  // Business rule: an athlete may have only ONE active partnership.
  const conflict = await db.partnership.findFirst({
    where: {
      endDate: null,
      OR: [
        { leaderId: { in: [leaderId, followerId] } },
        { followerId: { in: [leaderId, followerId] } },
      ],
    },
  });
  if (conflict) redirect("/portal/partnerships?error=busy");

  const p = await db.partnership.create({
    data: { leaderId, followerId, startDate: new Date() },
    include: { leader: true, follower: true },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "PARTNERSHIP_FORM",
      entity: "Partnership",
      entityId: p.id,
      detail: `${p.leader.lastName} · ${p.follower.lastName}`,
    },
  });

  revalidatePath("/portal/partnerships");
  redirect("/portal/partnerships?ok=formed");
}

// Splitting NEVER deletes — it closes the period. History stays intact.
export async function splitPartnership(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const id = String(formData.get("id") ?? "");

  const p = await db.partnership.update({
    where: { id },
    data: { endDate: new Date() },
    include: { leader: true, follower: true },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "PARTNERSHIP_SPLIT",
      entity: "Partnership",
      entityId: p.id,
      detail: `${p.leader.lastName} · ${p.follower.lastName}`,
    },
  });

  revalidatePath("/portal/partnerships");
  redirect("/portal/partnerships?ok=split");
}
