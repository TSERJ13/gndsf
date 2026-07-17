// ── Age-category transition tracking (WDSF: birth-year based) ──
// On 1 January every athlete whose age crosses a boundary moves up.
// This module answers: who moves at the START of NEXT year?
import { db } from "@/lib/db";
import { categoryForYear, CATEGORY_LABELS } from "@/lib/labels";
import type { AgeCategory } from "@prisma/client";

export type Transition = {
  athleteId: string;
  gid: string;
  name: string;
  clubName: string | null;
  from: AgeCategory;
  to: AgeCategory;
  effectiveYear: number; // category applies from 1 Jan of this year
};

// clubId: pass the manager's club to scope the list; null = whole federation
export async function upcomingTransitions(clubId: string | null): Promise<Transition[]> {
  const year = new Date().getFullYear();
  const athletes = await db.athlete.findMany({
    where: {
      isActive: true,
      ...(clubId
        ? { clubMemberships: { some: { clubId, endDate: null } } }
        : {}),
    },
    include: {
      clubMemberships: { where: { endDate: null }, include: { club: true } },
    },
    orderBy: { lastName: "asc" },
  });

  const out: Transition[] = [];
  for (const a of athletes) {
    const from = categoryForYear(a.birthDate, year);
    const to = categoryForYear(a.birthDate, year + 1);
    if (from !== to) {
      out.push({
        athleteId: a.id,
        gid: a.gid,
        name: `${a.firstName} ${a.lastName}`,
        clubName: a.clubMemberships[0]?.club.name ?? null,
        from,
        to,
        effectiveYear: year + 1,
      });
    }
  }
  return out;
}

export function transitionsEmailText(list: Transition[], clubName: string | null): string {
  const year = new Date().getFullYear() + 1;
  const lines = list.map(
    (t) =>
      `• ${t.name} (${t.gid})${clubName ? "" : t.clubName ? ` — ${t.clubName}` : ""}: ` +
      `${CATEGORY_LABELS[t.from]} → ${CATEGORY_LABELS[t.to]}`,
  );
  return (
    `${clubName ? `კლუბი: ${clubName}\n\n` : ""}` +
    `${year} წლის 1 იანვრიდან ასაკობრივ კატეგორიას იცვლიან:\n\n` +
    lines.join("\n") +
    `\n\nსულ: ${list.length} სპორტსმენი.\n\n—\nგაგზავნილია gndsf.ge-ს ადმინ პანელიდან`
  );
}
