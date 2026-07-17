"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/rbac";

const REGISTRY = ["SUPER_ADMIN", "PRESIDENT", "GENERAL_SECRETARY"];

async function assertAccess(athleteId: string) {
  const user = await requireStaff();
  if (REGISTRY.includes(user.role)) return user;
  if (user.role === "CLUB_MANAGER" && user.clubId) {
    const inClub = await db.clubMembership.findFirst({
      where: { athleteId, clubId: user.clubId, endDate: null },
    });
    if (inClub) return user;
  }
  redirect("/admin/athletes");
}

export async function registerAthleteDoc(input: {
  athleteId: string;
  name: string;
  size: number;
  contentType: string;
  url: string;
}) {
  const user = await assertAccess(input.athleteId);
  if (!input.url.includes(".blob.vercel-storage.com/") || input.size > 10 * 1024 * 1024) {
    throw new Error("invalid file");
  }
  await db.athleteDocument.create({
    data: {
      athleteId: input.athleteId,
      name: input.name.slice(0, 200),
      size: input.size,
      contentType: input.contentType,
      url: input.url,
      uploadedById: user.id,
    },
  });
  await db.auditLog.create({
    data: { userId: user.id, action: "ATHLETE_DOC_UPLOAD", entity: "Athlete", entityId: input.athleteId, detail: input.name },
  });
  revalidatePath(`/admin/athletes/${input.athleteId}/documents`);
}

export async function deleteAthleteDoc(formData: FormData) {
  const id = String(formData.get("id"));
  const doc = await db.athleteDocument.findUniqueOrThrow({ where: { id } });
  const user = await assertAccess(doc.athleteId);

  await db.athleteDocument.delete({ where: { id } });
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { del } = await import("@vercel/blob");
      await del(doc.url);
    } catch (e) {
      console.error("blob delete failed:", e);
    }
  }
  await db.auditLog.create({
    data: { userId: user.id, action: "ATHLETE_DOC_DELETE", entity: "Athlete", entityId: doc.athleteId, detail: doc.name },
  });
  revalidatePath(`/admin/athletes/${doc.athleteId}/documents`);
  redirect(`/admin/athletes/${doc.athleteId}/documents?ok=deleted`);
}
