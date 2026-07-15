"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";

function refresh() {
  for (const p of ["/admin/calendar", "/calendar", "/"]) revalidatePath(p);
}

export async function createEvent(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const title = String(formData.get("title") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const link = String(formData.get("link") ?? "").trim() || null;
  const isIntl = formData.get("isIntl") === "on";
  if (!title || !city || !date) redirect("/admin/calendar?error=fields");

  const e = await db.calendarEvent.create({
    data: { title, city, date: new Date(date), isIntl, link },
  });
  await db.auditLog.create({
    data: { userId: user.id, action: "CALENDAR_CREATE", entity: "CalendarEvent", entityId: e.id, detail: title },
  });
  refresh();
  redirect("/admin/calendar?ok=created");
}

export async function deleteEvent(formData: FormData) {
  const user = await requireRole(REGISTRY_ADMINS);
  const id = String(formData.get("id"));
  const e = await db.calendarEvent.delete({ where: { id } });
  await db.auditLog.create({
    data: { userId: user.id, action: "CALENDAR_DELETE", entity: "CalendarEvent", entityId: id, detail: e.title },
  });
  refresh();
  redirect("/admin/calendar?ok=deleted");
}
