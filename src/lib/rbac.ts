import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  clubId: string | null;
  athleteId?: string | null;
};

// Roles allowed to manage the athlete registry (full scope)
export const REGISTRY_ADMINS: Role[] = [
  "SUPER_ADMIN",
  "PRESIDENT",
  "VICE_PRESIDENT",
  "GENERAL_SECRETARY",
];

// Roles allowed to enter competition results
export const RESULT_ADMINS: Role[] = ["SUPER_ADMIN", "GENERAL_SECRETARY"];

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

// Admin-area gate: athletes belong in their cabinet, not the back office.
export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role === "ATHLETE") redirect("/cabinet");
  return user;
}

export async function requireAthlete(): Promise<SessionUser & { athleteId: string }> {
  const user = await requireUser();
  if (user.role !== "ATHLETE" || !user.athleteId) redirect("/portal");
  return user as SessionUser & { athleteId: string };
}

export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/portal");
  return user;
}

// CLUB_MANAGER sees only their own club; everyone else sees everything.
export function clubScope(user: SessionUser) {
  return user.role === "CLUB_MANAGER" && user.clubId
    ? { clubId: user.clubId }
    : null;
}
