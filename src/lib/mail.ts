// ── Outgoing mail via the federation's own Titan mailbox ──
// Env (Vercel): SMTP_USER=contact@gndsf.ge, SMTP_PASS=<mailbox password>
// Optional overrides: SMTP_HOST (default smtp.titan.email),
// SMTP_PORT (default 465), SMTP_SECURE (default true), CONTACT_EMAIL.
import nodemailer from "nodemailer";

export function mailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.titan.email",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  });
}

export async function sendContactMail(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const to = process.env.CONTACT_EMAIL ?? "contact@gndsf.ge";
  await transporter().sendMail({
    from: `"gndsf.ge — საკონტაქტო ფორმა" <${process.env.SMTP_USER}>`,
    to,
    replyTo: `"${input.name}" <${input.email}>`,
    subject: `[საიტი] ${input.subject}`,
    text: `სახელი: ${input.name}\nელფოსტა: ${input.email}\n\n${input.message}\n\n—\nგაგზავნილია gndsf.ge-ს საკონტაქტო ფორმიდან`,
  });
}
