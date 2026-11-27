"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { consumeToken, findValidToken } from "@/lib/tokens";

export async function setPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const back = `/set-password?token=${encodeURIComponent(token)}`;

  if (password.length < 8) redirect(`${back}&error=short`);
  if (password !== confirm) redirect(`${back}&error=mismatch`);

  const row = await findValidToken(token);
  if (!row || !(await consumeToken(row.id))) redirect("/set-password?error=invalid");

  await db.user.update({
    where: { id: row.userId },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  await db.auditLog.create({
    data: {
      userId: row.userId,
      action: row.purpose === "INVITE" ? "INVITE_ACCEPTED" : "PASSWORD_RESET",
      entity: "User",
      entityId: row.userId,
      detail: row.user.email,
    },
  });
  redirect("/login?set=1");
}
