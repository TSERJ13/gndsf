"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/rbac";
import { upcomingTransitions, transitionsEmailText } from "@/lib/transitions";
import { mailConfigured, sendLeadershipNotice } from "@/lib/mail";

// Trainer (club manager) → president / vice-president / general secretary:
// "these athletes of my club change age category on 1 January".
export async function notifyTransitions() {
  const user = await requireStaff();
  if (user.role !== "CLUB_MANAGER" || !user.clubId) redirect("/portal");
  if (!mailConfigured()) redirect("/portal?notify=config");

  const list = await upcomingTransitions(user.clubId);
  if (list.length === 0) redirect("/portal");

  const club = await db.club.findUnique({ where: { id: user.clubId } });
  const year = new Date().getFullYear() + 1;

  try {
    await sendLeadershipNotice({
      senderName: user.name ?? user.email ?? "კლუბის მენეჯერი",
      subject: `კატეგორიის ცვლილება ${year} — ${club?.name ?? "კლუბი"} (${list.length} სპორტსმენი)`,
      text: transitionsEmailText(list, club?.name ?? null),
    });
  } catch (e) {
    console.error("transition notice failed:", e);
    redirect("/portal?notify=failed");
  }

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "TRANSITIONS_NOTIFY",
      entity: "Club",
      entityId: user.clubId,
      detail: `${list.length} athletes → leadership`,
    },
  });
  redirect("/portal?notify=sent");
}
