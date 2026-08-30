"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/permissions";
import { encrypt } from "@/lib/crypto";
import { verifyLogin, sendFromMailbox, deleteMessage } from "@/lib/mailbox";
import { decrypt } from "@/lib/crypto";

export async function connectMailbox(formData: FormData) {
  const user = await requireCapability("MAIL_ACCESS");
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!email.endsWith("@gndsf.ge") || !password) redirect("/portal/mail?error=fields");

  // prove the credentials against Titan BEFORE storing anything
  const ok = await verifyLogin(email, password);
  if (!ok) redirect("/portal/mail?error=login");

  await db.mailAccount.upsert({
    where: { userId: user.id },
    create: { userId: user.id, email, encSecret: encrypt(password) },
    update: { email, encSecret: encrypt(password) },
  });
  await db.auditLog.create({
    data: { userId: user.id, action: "MAILBOX_CONNECT", entity: "MailAccount", detail: email },
  });
  revalidatePath("/portal/mail");
  redirect("/portal/mail?ok=connected");
}

export async function disconnectMailbox() {
  const user = await requireCapability("MAIL_ACCESS");
  await db.mailAccount.deleteMany({ where: { userId: user.id } });
  await db.auditLog.create({
    data: { userId: user.id, action: "MAILBOX_DISCONNECT", entity: "MailAccount" },
  });
  revalidatePath("/portal/mail");
  redirect("/portal/mail?ok=disconnected");
}

export async function composeMail(formData: FormData) {
  const user = await requireCapability("MAIL_ACCESS");
  const to = String(formData.get("to") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!to.includes("@") || !subject || !body) redirect("/portal/mail?error=compose");

  const acc = await db.mailAccount.findUnique({ where: { userId: user.id } });
  if (!acc) redirect("/portal/mail");

  try {
    await sendFromMailbox(acc.email, decrypt(acc.encSecret), { to, subject, body });
  } catch (e) {
    console.error("mail send failed:", e);
    redirect("/portal/mail?error=send");
  }
  await db.auditLog.create({
    data: { userId: user.id, action: "MAIL_SEND", entity: "MailAccount", detail: `→ ${to}: ${subject}` },
  });
  redirect("/portal/mail?box=sent&ok=sent");
}

export async function deleteMailAction(uid: number, box: "inbox" | "sent" | "spam" | "trash") {
  const user = await requireCapability("MAIL_ACCESS");
  const acc = await db.mailAccount.findUnique({ where: { userId: user.id } });
  if (!acc) redirect("/portal/mail");

  try {
    await deleteMessage(acc.email, decrypt(acc.encSecret), box, uid);
  } catch (e) {
    console.error("mail delete failed:", e);
    redirect(`/portal/mail?error=delete&box=${box}`);
  }
  
  await db.auditLog.create({
    data: { userId: user.id, action: "MAIL_DELETE", entity: "MailAccount", detail: `UID: ${uid}` },
  });
  
  redirect(`/portal/mail?box=${box}&ok=deleted`);
}
