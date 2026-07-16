"use server";

import { redirect } from "next/navigation";
import { mailConfigured, sendContactMail } from "@/lib/mail";

export async function submitContact(formData: FormData) {
  // honeypot: real people never fill this hidden field
  if (String(formData.get("website") ?? "")) redirect("/contact?ok=1");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email.includes("@") || !subject || message.length < 10) {
    redirect("/contact?error=fields");
  }
  if (name.length > 100 || subject.length > 150 || message.length > 5000) {
    redirect("/contact?error=fields");
  }
  if (!mailConfigured()) redirect("/contact?error=config");

  try {
    await sendContactMail({ name, email, subject, message });
  } catch (e) {
    console.error("contact mail failed:", e);
    redirect("/contact?error=send");
  }
  redirect("/contact?ok=1");
}
