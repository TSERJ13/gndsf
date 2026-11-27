// One-time links for "set your password" (cabinet invite) and password
// reset. The raw token only ever lives in the e-mailed URL; the database
// keeps its SHA-256 hash, so a database leak cannot be turned into logins.
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

export type TokenPurpose = "INVITE" | "RESET";

const TTL_HOURS: Record<TokenPurpose, number> = {
  INVITE: 24 * 7, // a week to accept the invite
  RESET: 2,
};

const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");

export function siteUrl() {
  return (process.env.SITE_URL ?? "https://gndsf.ge").replace(/\/+$/, "");
}

export async function issueToken(userId: string, purpose: TokenPurpose) {
  const raw = randomBytes(32).toString("base64url");
  // Only the newest link of a kind stays valid.
  await db.authToken.updateMany({
    where: { userId, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });
  await db.authToken.create({
    data: {
      userId,
      purpose,
      tokenHash: hash(raw),
      expiresAt: new Date(Date.now() + TTL_HOURS[purpose] * 3600_000),
    },
  });
  return `${siteUrl()}/set-password?token=${raw}`;
}

// Returns the token row if it is valid (unused, not expired), else null.
export async function findValidToken(raw: string) {
  if (!raw || raw.length > 200) return null;
  const row = await db.authToken.findUnique({
    where: { tokenHash: hash(raw) },
    include: { user: true },
  });
  if (!row || row.usedAt || row.expiresAt < new Date() || !row.user.isActive) return null;
  return row;
}

export async function consumeToken(id: string) {
  // Atomic: only succeeds once even if the form is submitted twice.
  const { count } = await db.authToken.updateMany({
    where: { id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return count === 1;
}

// A password nobody knows, for accounts created before the owner sets one.
export function unusablePassword() {
  return randomBytes(32).toString("hex");
}
