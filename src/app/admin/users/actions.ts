"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import type { Role } from "@prisma/client";

const STAFF_ROLES: Role[] = [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "GENERAL_SECRETARY",
  "REGIONAL_REP",
  "CLUB_MANAGER",
];

async function audit(userId: string, action: string, entityId: string, detail: string) {
  await db.auditLog.create({ data: { userId, action, entity: "User", entityId, detail } });
}

export async function createStaffUser(formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN"]);
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const role = String(formData.get("role") ?? "") as Role;
  const clubId = String(formData.get("clubId") ?? "") || null;
  const region = String(formData.get("region") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8 || !STAFF_ROLES.includes(role)) {
    redirect("/admin/users?error=fields");
  }
  if (role === "CLUB_MANAGER" && !clubId) redirect("/admin/users?error=club");
  if (await db.user.findUnique({ where: { email } })) {
    redirect("/admin/users?error=exists");
  }

  const u = await db.user.create({
    data: {
      name,
      email,
      role,
      clubId: role === "CLUB_MANAGER" ? clubId : null,
      region: role === "REGIONAL_REP" ? region : null,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  await audit(admin.id, "USER_CREATE", u.id, `${name} (${role})`);
  revalidatePath("/admin/users");
  redirect("/admin/users?ok=created");
}

export async function toggleUserActive(formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN"]);
  const id = String(formData.get("id"));
  if (id === admin.id) redirect("/admin/users?error=self");

  const target = await db.user.findUniqueOrThrow({ where: { id } });
  // never lock the federation out: the last active SuperAdmin stays
  if (target.role === "SUPER_ADMIN" && target.isActive) {
    const others = await db.user.count({
      where: { role: "SUPER_ADMIN", isActive: true, id: { not: id } },
    });
    if (others === 0) redirect("/admin/users?error=lastadmin");
  }

  const u = await db.user.update({
    where: { id },
    data: { isActive: !target.isActive },
  });
  await audit(admin.id, u.isActive ? "USER_ACTIVATE" : "USER_DEACTIVATE", id, u.email);
  revalidatePath("/admin/users");
  redirect("/admin/users?ok=toggled");
}

export async function resetUserPassword(formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN"]);
  const id = String(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) redirect("/admin/users?error=shortpass");

  const u = await db.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  await audit(admin.id, "USER_PASSWORD_RESET", id, u.email);
  revalidatePath("/admin/users");
  redirect("/admin/users?ok=reset");
}
