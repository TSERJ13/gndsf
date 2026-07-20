"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";

// Shared by staff (/portal/settings) and athletes (/cabinet):
// verify current password, set a new one, audit it.
export async function changeOwnPassword(formData: FormData) {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const back = user.role === "ATHLETE" ? "/cabinet" : "/portal/settings";

  if (next.length < 8) redirect(`${back}?perror=short`);

  const dbUser = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  const ok = await bcrypt.compare(current, dbUser.passwordHash);
  if (!ok) redirect(`${back}?perror=wrong`);

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });
  await db.auditLog.create({
    data: { userId: user.id, action: "PASSWORD_CHANGE", entity: "User", entityId: user.id, detail: dbUser.email },
  });
  redirect(`${back}?pok=1`);
}
