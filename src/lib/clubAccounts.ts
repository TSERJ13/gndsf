// The federation registers studios itself: it creates the club and its
// manager's account, and the manager gets an e-mail with a one-time link
// to set their own password (nobody else ever knows it). They can change
// it later in the portal settings, or use "forgot password".
import { db } from "./db";
import { issueToken, unusablePassword } from "./tokens";
import { mailConfigured } from "./mail";
import { clubInvite } from "./notify";

export type ManagerInviteResult = "sent" | "mail-off" | "email-taken" | "bad-email";

export const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

// Creates (or reuses) the club's manager account for this e-mail and sends
// the set-password link. Safe to call again to re-send the invite.
export async function inviteClubManager(
  clubId: string,
  rawEmail: string,
  rawName: string | null,
): Promise<ManagerInviteResult> {
  const email = rawEmail.toLowerCase().trim();
  if (!EMAIL_RE.test(email)) return "bad-email";
  const club = await db.club.findUniqueOrThrow({ where: { id: clubId } });

  let user = await db.user.findUnique({ where: { email } });
  if (user && !(user.role === "CLUB_MANAGER" && user.clubId === clubId)) return "email-taken";
  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name: rawName?.trim() || club.name,
        role: "CLUB_MANAGER",
        clubId,
        passwordHash: unusablePassword(),
      },
    });
  }
  if (!club.email) await db.club.update({ where: { id: clubId }, data: { email } });

  const link = await issueToken(user.id, "INVITE");
  if (!mailConfigured()) return "mail-off";
  await clubInvite(email, club.name, user.name, link);
  return "sent";
}

// Has this manager ever set a password (accepted the invite or logged in)?
export async function managerStatus(userIds: string[]) {
  const accepted = await db.auditLog.findMany({
    where: { userId: { in: userIds }, action: { in: ["INVITE_ACCEPTED", "PASSWORD_RESET", "PASSWORD_CHANGE"] } },
    select: { userId: true },
  });
  return new Set(accepted.map((a) => a.userId));
}

export type BulkRow = { line: number; name: string; city: string; email: string; manager: string | null };

// One studio per line: name; city; e-mail; manager name (optional).
// Commas or tabs work too (pasted from Excel).
export function parseBulk(text: string): { rows: BulkRow[]; bad: number[] } {
  const rows: BulkRow[] = [];
  const bad: number[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const parts = line.split(/\s*[;\t]\s*|\s*,\s*/).map((p) => p.trim());
    const [name, city, email, manager] = parts;
    if (!name || !city || !email || !EMAIL_RE.test(email)) bad.push(i + 1);
    else rows.push({ line: i + 1, name, city, email: email.toLowerCase(), manager: manager || null });
  });
  return { rows, bad };
}
