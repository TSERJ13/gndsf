"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Public action — no auth required. Applicant sets their own email +
// password now; the password is hashed immediately and only the hash is
// stored, exactly like every other account in this system. Nothing is
// created in Club/User until a registry admin approves the request
// (see src/app/portal/club-registrations/actions.ts).
export async function submitClubRegistration(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const contactName = String(formData.get("contactName") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!name || !city || !contactName || !email) {
    redirect("/studio/apply?error=fields");
  }
  if (password.length < 8) redirect("/studio/apply?error=shortpass");
  if (password !== passwordConfirm) redirect("/studio/apply?error=mismatch");

  const [existingUser, existingReg] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.clubRegistration.findUnique({ where: { email } }),
  ]);
  if (existingUser || existingReg) {
    redirect("/studio/apply?error=exists");
  }

  await db.clubRegistration.create({
    data: {
      name,
      nameEn,
      city,
      address,
      phone,
      contactName,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      status: "PENDING",
    },
  });

  redirect("/studio/apply?ok=submitted");
}
