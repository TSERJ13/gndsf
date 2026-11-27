"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/rbac";
import { sendMail } from "@/lib/mail";
import { uploadPhoto } from "@/lib/image";

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

// Admin/President: send a test email to check that outgoing mail works.
export async function sendTestMail(formData: FormData) {
  const user = await requireRole(["SUPER_ADMIN", "PRESIDENT"]);
  const to = String(formData.get("to") ?? "").trim();
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(to)) redirect("/portal/settings?mail=bad");
  try {
    await sendMail({
      to,
      subject: "GNDSF — სატესტო წერილი",
      text: `ეს სატესტო წერილია gndsf.ge-დან.\nგაგზავნა: ${user.email}\n\nთუ ამას კითხულობთ, ავტომატური ფოსტა მუშაობს.`,
    });
  } catch (e) {
    console.error("test mail failed:", e);
    redirect("/portal/settings?mail=fail");
  }
  redirect("/portal/settings?mail=ok");
}

// Club manager: edit their own club's public contact details and logo.
export async function updateOwnClub(formData: FormData) {
  const user = await requireRole(["CLUB_MANAGER"]);
  if (!user.clubId) redirect("/portal/settings");
  const val = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const city = val("city");
  if (!city) redirect("/portal/settings?club=fields");

  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const url = await uploadPhoto(logo, `clubs/${user.clubId}`, "logo");
    if (!url) redirect("/portal/settings?club=logo");
    logoUrl = url;
  }

  await db.club.update({
    where: { id: user.clubId },
    data: {
      city,
      nameEn: val("nameEn"),
      address: val("address"),
      phone: val("phone"),
      email: val("email"),
      ...(logoUrl ? { logoUrl } : {}),
    },
  });
  await db.auditLog.create({
    data: { userId: user.id, action: "CLUB_SELF_UPDATE", entity: "Club", entityId: user.clubId },
  });
  redirect("/portal/settings?club=ok");
}
