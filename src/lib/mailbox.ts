// ── In-admin webmail over the official's own Titan mailbox ──
// IMAP for reading (INBOX / Sent), SMTP for sending; sent messages are
// appended to the Sent folder so Titan webmail stays in sync.
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";

const IMAP_HOST = process.env.IMAP_HOST ?? "imap.titan.email";
const IMAP_PORT = Number(process.env.IMAP_PORT ?? 993);
const IMAP_SECURE = process.env.IMAP_SECURE !== "false";
const SMTP_HOST = process.env.SMTP_HOST ?? "smtp.titan.email";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 465);
const SMTP_SECURE = process.env.SMTP_SECURE !== "false";

export type MailListItem = {
  uid: number;
  from: string;
  to: string;
  subject: string;
  date: Date | null;
  seen: boolean;
};

function client(email: string, password: string) {
  const c = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: IMAP_SECURE,
    auth: { user: email, pass: password },
    logger: false,
  });
  // imapflow emits async errors (e.g. server closing after failed auth);
  // without a listener these crash the whole process
  c.on("error", (err) => console.error("imap error:", err?.message));
  return c;
}

// Used on connect: prove the credentials actually work before saving.
export async function verifyLogin(email: string, password: string): Promise<boolean> {
  const c = client(email, password);
  try {
    await c.connect();
    await c.logout();
    return true;
  } catch {
    return false;
  }
}

async function resolveSentPath(c: ImapFlow): Promise<string> {
  try {
    const boxes = await c.list();
    const bySpecial = boxes.find((b) => b.specialUse === "\\Sent");
    if (bySpecial) return bySpecial.path;
    const byName = boxes.find((b) => /^sent/i.test(b.name));
    if (byName) return byName.path;
  } catch {}
  return "Sent";
}

async function resolveSpamPath(c: ImapFlow): Promise<string> {
  try {
    const boxes = await c.list();
    const bySpecial = boxes.find((b) => b.specialUse === "\\Junk");
    if (bySpecial) return bySpecial.path;
    const byName = boxes.find((b) => /spam|junk/i.test(b.name));
    if (byName) return byName.path;
  } catch {}
  return "Spam";
}

async function resolveTrashPath(c: ImapFlow): Promise<string> {
  try {
    const boxes = await c.list();
    const bySpecial = boxes.find((b) => b.specialUse === "\\Trash");
    if (bySpecial) return bySpecial.path;
    const byName = boxes.find((b) => /trash|deleted|bin/i.test(b.name));
    if (byName) return byName.path;
  } catch {}
  return "Trash";
}

export async function listMessages(
  email: string,
  password: string,
  box: "inbox" | "sent" | "spam" | "trash",
  limit = 20,
): Promise<MailListItem[]> {
  const c = client(email, password);
  await c.connect();
  try {
    const path = box === "inbox" ? "INBOX" : box === "sent" ? await resolveSentPath(c) : box === "spam" ? await resolveSpamPath(c) : await resolveTrashPath(c);
    const lock = await c.getMailboxLock(path);
    try {
      const total = typeof c.mailbox === "object" ? c.mailbox.exists : 0;
      if (!total) return [];
      const from = Math.max(1, total - limit + 1);
      const out: MailListItem[] = [];
      for await (const msg of c.fetch(`${from}:*`, { uid: true, envelope: true, flags: true })) {
        const env = msg.envelope;
        out.push({
          uid: msg.uid,
          from: env?.from?.[0] ? `${env.from[0].name || env.from[0].address}` : "—",
          to: env?.to?.[0] ? `${env.to[0].name || env.to[0].address}` : "—",
          subject: env?.subject || "(უთემო)",
          date: env?.date ?? null,
          seen: msg.flags?.has("\\Seen") ?? false,
        });
      }
      return out.reverse();
    } finally {
      lock.release();
    }
  } finally {
    await c.logout().catch(() => {});
  }
}

// Full message as SAFE PLAIN TEXT — HTML is never rendered in the admin.
export async function readMessage(
  email: string,
  password: string,
  box: "inbox" | "sent" | "spam" | "trash",
  uid: number,
) {
  const c = client(email, password);
  await c.connect();
  try {
    const path = box === "inbox" ? "INBOX" : box === "sent" ? await resolveSentPath(c) : box === "spam" ? await resolveSpamPath(c) : await resolveTrashPath(c);
    const lock = await c.getMailboxLock(path);
    try {
      const dl = await c.download(String(uid), undefined, { uid: true });
      if (!dl) return null;
      const chunks: Buffer[] = [];
      for await (const chunk of dl.content) chunks.push(chunk as Buffer);
      const parsed = await simpleParser(Buffer.concat(chunks));
      if (box === "inbox" || box === "spam") {
        await c.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
      }
      return {
        from: parsed.from?.text ?? "—",
        to: Array.isArray(parsed.to) ? parsed.to.map((t) => t.text).join(", ") : parsed.to?.text ?? "—",
        subject: parsed.subject ?? "(უთემო)",
        date: parsed.date ?? null,
        html: parsed.html || "",
        // text part if present, otherwise HTML stripped to text
        text:
          parsed.text ??
          (parsed.html ? parsed.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : ""),
        attachments: parsed.attachments.map((a) => a.filename ?? "attachment"),
      };
    } finally {
      lock.release();
    }
  } finally {
    await c.logout().catch(() => {});
  }
}

export async function deleteMessage(
  email: string,
  password: string,
  box: "inbox" | "sent" | "spam" | "trash",
  uid: number,
) {
  const c = client(email, password);
  await c.connect();
  try {
    const path = box === "inbox" ? "INBOX" : box === "sent" ? await resolveSentPath(c) : box === "spam" ? await resolveSpamPath(c) : await resolveTrashPath(c);
    const lock = await c.getMailboxLock(path);
    try {
      if (box === "trash") {
        // Permanently delete
        await c.messageFlagsAdd(String(uid), ["\\Deleted"], { uid: true });
      } else {
        // Move to trash
        const trashPath = await resolveTrashPath(c);
        if (path !== trashPath) {
          await c.messageMove(String(uid), trashPath, { uid: true });
        } else {
          await c.messageFlagsAdd(String(uid), ["\\Deleted"], { uid: true });
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await c.logout().catch(() => {});
  }
}

export async function sendFromMailbox(
  email: string,
  password: string,
  input: { to: string; subject: string; body: string },
) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: email, pass: password },
  });
  const info = await transporter.sendMail({
    from: email,
    to: input.to,
    subject: input.subject,
    text: input.body,
  });

  // mirror into the Sent folder so Titan webmail shows it too
  const raw = [
    `From: ${email}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${info.messageId}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    input.body,
  ].join("\r\n");
  const c = client(email, password);
  await c.connect();
  try {
    await c.append(await resolveSentPath(c), raw, ["\\Seen"]);
  } finally {
    await c.logout().catch(() => {});
  }
}
