"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/rbac";
import { aiConfigured, extractBirthDate, decideVerification, type Extraction } from "@/lib/docai";
import { mailConfigured, sendLeadershipNotice } from "@/lib/mail";
import { CATEGORY_LABELS, categoryForYear } from "@/lib/labels";

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
  // auto-run AI birth-date verification when the key is configured
  if (aiConfigured()) {
    const created = await db.athleteDocument.findFirst({
      where: { athleteId: input.athleteId, url: input.url },
      orderBy: { createdAt: "desc" },
    });
    if (created) {
      try {
        await runDocVerification(created.id);
      } catch (e) {
        console.error("auto verification failed:", e);
      }
    }
  }
  revalidatePath(`/admin/athletes/${input.athleteId}/documents`);
}

// ── AI verification core (extractor injectable for tests) ──
export async function runDocVerification(
  docId: string,
  extractor: (url: string, contentType: string) => Promise<Extraction> = extractBirthDate,
) {
  const doc = await db.athleteDocument.findUniqueOrThrow({
    where: { id: docId },
    include: { athlete: { include: { clubMemberships: { where: { endDate: null }, include: { club: true } } } } },
  });
  const extraction = await extractor(doc.url, doc.contentType);
  const verdict = decideVerification(extraction, doc.athlete.birthDate);

  await db.athleteDocument.update({
    where: { id: docId },
    data: {
      verifyStatus: verdict.status,
      verifyNote: verdict.note,
      extractedBirthDate: verdict.extracted,
    },
  });

  if (verdict.status === "MISMATCH") {
    await db.auditLog.create({
      data: {
        action: "ATHLETE_DOC_MISMATCH",
        entity: "Athlete",
        entityId: doc.athleteId,
        detail: `${doc.athlete.gid}: ${verdict.note}`,
      },
    });
    if (mailConfigured() && verdict.extracted) {
      const a = doc.athlete;
      const year = new Date().getFullYear();
      const catNow = CATEGORY_LABELS[categoryForYear(a.birthDate, year)];
      const catDoc = CATEGORY_LABELS[categoryForYear(verdict.extracted, year)];
      try {
        await sendLeadershipNotice({
          senderName: "gndsf.ge სისტემა",
          subject: `⚠ დაბადების თარიღის შეუსაბამობა — ${a.firstName} ${a.lastName} (${a.gid})`,
          text:
            `AI-შემოწმებამ აღმოაჩინა შეუსაბამობა სპორტსმენის დოკუმენტში.

` +
            `სპორტსმენი: ${a.firstName} ${a.lastName} (${a.gid})
` +
            `კლუბი: ${a.clubMemberships[0]?.club.name ?? "—"}
` +
            `დოკუმენტი: ${doc.name}

${verdict.note}

` +
            `კატეგორია ბაზის თარიღით: ${catNow}
` +
            `კატეგორია დოკუმენტის თარიღით: ${catDoc}

` +
            `გთხოვთ გადაამოწმოთ: gndsf.ge/admin/athletes/${a.id}/documents

—
gndsf.ge ავტომატური შეტყობინება`,
        });
      } catch (e) {
        console.error("mismatch notice failed:", e);
      }
    }
  }
  return verdict.status;
}

// per-document "AI შემოწმება" button
export async function verifyAthleteDoc(formData: FormData) {
  const id = String(formData.get("id"));
  const doc = await db.athleteDocument.findUniqueOrThrow({ where: { id } });
  await assertAccess(doc.athleteId);
  if (!aiConfigured()) redirect(`/admin/athletes/${doc.athleteId}/documents?ai=off`);
  await runDocVerification(id);
  revalidatePath(`/admin/athletes/${doc.athleteId}/documents`);
  redirect(`/admin/athletes/${doc.athleteId}/documents?ai=done`);
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
