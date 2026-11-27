// ── Outgoing mail ──
// Automatic mail (notifications, approvals, invites, the contact form
// relay) goes out through Resend from no-reply@gndsf.ge:
//   RESEND_API_KEY   — required (Vercel env, secret)
//   MAIL_FROM        — optional, default "GNDSF <no-reply@gndsf.ge>"
// If RESEND_API_KEY is missing, it falls back to the federation's Titan
// mailbox over SMTP (SMTP_USER / SMTP_PASS, optional SMTP_HOST/PORT/SECURE).
import nodemailer from "nodemailer";

type Mail = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  fromName?: string;
};

function resendConfigured() {
  return !!process.env.RESEND_API_KEY;
}

function smtpConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function mailConfigured(): boolean {
  return resendConfigured() || smtpConfigured();
}

const DEFAULT_FROM_ADDRESS = "no-reply@gndsf.ge";

function fromHeader(name?: string) {
  const configured = process.env.MAIL_FROM;
  if (configured && !name) return configured;
  const address = configured?.match(/<([^>]+)>/)?.[1] ?? configured ?? DEFAULT_FROM_ADDRESS;
  return `${(name ?? "GNDSF").replace(/["<>]/g, "")} <${address}>`;
}

async function sendViaResend(mail: Mail) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromHeader(mail.fromName),
      to: Array.isArray(mail.to) ? mail.to : [mail.to],
      subject: mail.subject,
      text: mail.text,
      ...(mail.html ? { html: mail.html } : {}),
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
}

async function sendViaSmtp(mail: Mail) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.titan.email",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  });
  await transporter.sendMail({
    from: `"${(mail.fromName ?? "GNDSF").replace(/"/g, "")}" <${process.env.SMTP_USER}>`,
    to: mail.to,
    replyTo: mail.replyTo,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
}

export async function sendMail(mail: Mail) {
  if (resendConfigured()) return sendViaResend(mail);
  if (smtpConfigured()) return sendViaSmtp(mail);
  throw new Error("mail is not configured (set RESEND_API_KEY)");
}

export async function sendContactMail(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  await sendMail({
    to: process.env.CONTACT_EMAIL ?? "contact@gndsf.ge",
    fromName: "gndsf.ge — საკონტაქტო ფორმა",
    replyTo: `${input.name.replace(/["<>]/g, "")} <${input.email}>`,
    subject: `[საიტი] ${input.subject}`,
    text: `სახელი: ${input.name}\nელფოსტა: ${input.email}\n\n${input.message}\n\n—\nგაგზავნილია gndsf.ge-ს საკონტაქტო ფორმიდან`,
  });
}

// Recipients for internal leadership notifications (trainer → leadership).
const LEADERSHIP = (process.env.LEADERSHIP_EMAILS ??
  "president@gndsf.ge,vicepresident@gndsf.ge,secretary@gndsf.ge")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function sendLeadershipNotice(input: {
  subject: string;
  text: string;
  senderName: string;
}) {
  await sendMail({
    to: LEADERSHIP,
    fromName: `${input.senderName} — gndsf.ge`,
    subject: input.subject,
    text: input.text,
  });
}
