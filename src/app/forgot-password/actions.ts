"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { issueToken } from "@/lib/tokens";
import { passwordReset } from "@/lib/notify";

export async function requestReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (email.includes("@") && email.length <= 200) {
    const user = await db.user.findUnique({ where: { email } });
    if (user?.isActive) {
      const link = await issueToken(user.id, "RESET");
      await passwordReset(user.email, link);
    }
  }
  // Same answer whether or not the account exists (no account probing).
  redirect("/forgot-password?sent=1");
}
