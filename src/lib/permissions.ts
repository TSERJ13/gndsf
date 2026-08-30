// ══════════════════════════════════════════════════════════════════════
// GNDSF — მოდულური უფლებების სისტემა (Capability-based permissions)
//
// ეს ფაილი არის ერთადერთი ადგილი, სადაც წერია "რომელ როლს რისი
// გაკეთება შეუძლია". ყველა დანარჩენი ფაილი (server actions, გვერდები,
// ნავიგაცია) ამ მატრიცას მიმართავს `can()`/`requireCapability()`-ს
// მეშვეობით — აღარ არის საჭირო როლების მასივების გამეორება ყველგან.
//
// მნიშვნელოვანი: ეს მატრიცა აგებულია არსებული (2026 წლის აგვისტოს
// მდგომარეობით) ქცევის ზუსტი ასახვით — არცერთი არსებული უფლება არ
// შეცვლილა/გაფართოვდა შემთხვევით. ერთადერთი დამატებულია საკუთარი
// კლუბის ფარგლებში მოქმედება კლუბის მენეჯერისთვის (*_OWN_CLUB
// კაპაბილითები) და სტუდიის რეგისტრაციის განხილვა.
//
// თუ მომავალში დაგჭირდება უფლების შეცვლა (მაგ. მდივანსაც მივცეთ
// წყვილების შეწყვილება) — საკმარისია მხოლოდ ROLE_CAPABILITIES
// მატრიცის ერთი სტრიქონის შეცვლა, აღარაფერი სხვა ფაილში.
// ══════════════════════════════════════════════════════════════════════

import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export type Capability =
  // კლუბები
  | "CLUB_MANAGE" // შექმნა/რედაქტირება/გათიშვა, პირდაპირი ტრანსფერი
  | "CLUB_SIGNUP_REVIEW" // სტუდიის თვითრეგისტრაციის მოთხოვნების განხილვა
  // სპორტსმენები
  | "ATHLETE_MANAGE_ALL" // ნებისმიერი კლუბის სპორტსმენის რეგისტრაცია + კაბინეტის ანგარიში
  | "ATHLETE_MANAGE_OWN_CLUB" // მხოლოდ საკუთარი კლუბის სპორტსმენის რეგისტრაცია
  | "ATHLETE_EDIT_DIRECT" // პროფილის პირდაპირი რედაქტირება (მოთხოვნის გარეშე)
  | "ATHLETE_EDIT_REQUEST" // რედაქტირების მოთხოვნის გაგზავნა (ნებისმიერი კლუბი)
  | "ATHLETE_EDIT_REQUEST_OWN_CLUB" // რედაქტირების მოთხოვნის გაგზავნა (მხოლოდ თავისი კლუბი)
  | "ATHLETE_EDIT_REVIEW" // რედაქტირების მოთხოვნების დამტკიცება/უარყოფა
  | "ATHLETE_DELETE"
  // წყვილები
  | "PARTNERSHIP_MANAGE_ALL" // ნებისმიერი ორი თავისუფალი სპორტსმენის შეწყვილება/გაყრა
  | "PARTNERSHIP_MANAGE_OWN_CLUB" // მხოლოდ საკუთარი კლუბის ორი სპორტსმენის შეწყვილება/გაყრა
  // ტრანსფერები
  | "TRANSFER_REQUEST" // ტრანსფერის მოთხოვნის შექმნა (ნებისმიერი/საკუთარი კლუბი — page-ში სქოუპდება)
  | "TRANSFER_REVIEW" // ტრანსფერის დამტკიცება/უარყოფა (registry — ნებისმიერი; club manager — საიდანაც გადის)
  // შეჯიბრებები
  | "COMPETITION_VIEW"
  | "COMPETITION_RESULT_MANAGE" // შეჯიბრების/ივენთის შექმნა + შედეგების შეყვანა
  // CMS
  | "NEWS_MANAGE"
  | "CALENDAR_MANAGE"
  | "DOCUMENT_MANAGE"
  // E-Card
  | "ECARD_REVIEW"
  // ფოსტა
  | "MAIL_ACCESS"
  // ადმინისტრირება
  | "USER_MANAGE"
  | "SETTINGS_ACCESS";

const ALL_STAFF: Role[] = [
  "SUPER_ADMIN",
  "PRESIDENT",
  "VICE_PRESIDENT",
  "GENERAL_SECRETARY",
  "REGIONAL_REP",
  "CLUB_MANAGER",
];

const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  SUPER_ADMIN: [
    "CLUB_MANAGE",
    "CLUB_SIGNUP_REVIEW",
    "ATHLETE_MANAGE_ALL",
    "ATHLETE_EDIT_DIRECT",
    "ATHLETE_EDIT_REQUEST",
    "ATHLETE_EDIT_REVIEW",
    "ATHLETE_DELETE",
    "PARTNERSHIP_MANAGE_ALL",
    "TRANSFER_REQUEST",
    "TRANSFER_REVIEW",
    "COMPETITION_VIEW",
    "COMPETITION_RESULT_MANAGE",
    "NEWS_MANAGE",
    "CALENDAR_MANAGE",
    "DOCUMENT_MANAGE",
    "ECARD_REVIEW",
    "MAIL_ACCESS",
    "USER_MANAGE",
    "SETTINGS_ACCESS",
  ],
  PRESIDENT: [
    "CLUB_MANAGE",
    "CLUB_SIGNUP_REVIEW",
    "ATHLETE_MANAGE_ALL",
    "ATHLETE_EDIT_DIRECT",
    "ATHLETE_EDIT_REQUEST",
    "ATHLETE_EDIT_REVIEW",
    "ATHLETE_DELETE",
    "PARTNERSHIP_MANAGE_ALL",
    "TRANSFER_REQUEST",
    "TRANSFER_REVIEW",
    "COMPETITION_VIEW",
    "NEWS_MANAGE",
    "CALENDAR_MANAGE",
    "DOCUMENT_MANAGE",
    "ECARD_REVIEW",
    "SETTINGS_ACCESS",
  ],
  VICE_PRESIDENT: [
    "CLUB_MANAGE",
    "CLUB_SIGNUP_REVIEW",
    "ATHLETE_MANAGE_ALL",
    "ATHLETE_EDIT_DIRECT",
    "ATHLETE_DELETE",
    "PARTNERSHIP_MANAGE_ALL",
    "TRANSFER_REQUEST",
    "TRANSFER_REVIEW",
    "COMPETITION_VIEW",
    "NEWS_MANAGE",
    "CALENDAR_MANAGE",
    "DOCUMENT_MANAGE",
    "ECARD_REVIEW",
    "SETTINGS_ACCESS",
  ],
  GENERAL_SECRETARY: [
    "CLUB_MANAGE",
    "CLUB_SIGNUP_REVIEW",
    "ATHLETE_MANAGE_ALL",
    "ATHLETE_EDIT_DIRECT",
    "ATHLETE_EDIT_REQUEST",
    "ATHLETE_EDIT_REVIEW",
    "TRANSFER_REQUEST",
    "TRANSFER_REVIEW",
    "COMPETITION_VIEW",
    "COMPETITION_RESULT_MANAGE",
    "NEWS_MANAGE",
    "CALENDAR_MANAGE",
    "DOCUMENT_MANAGE",
    "MAIL_ACCESS",
    "SETTINGS_ACCESS",
  ],
  REGIONAL_REP: ["SETTINGS_ACCESS"],
  CLUB_MANAGER: [
    "ATHLETE_MANAGE_OWN_CLUB",
    "ATHLETE_EDIT_REQUEST_OWN_CLUB",
    "PARTNERSHIP_MANAGE_OWN_CLUB",
    "TRANSFER_REQUEST",
    "TRANSFER_REVIEW",
    "SETTINGS_ACCESS",
  ],
  ATHLETE: [],
};

export function rolesWithCapability(cap: Capability): Role[] {
  return (Object.keys(ROLE_CAPABILITIES) as Role[]).filter((r) =>
    ROLE_CAPABILITIES[r].includes(cap),
  );
}

export function can(
  user: { role: Role } | null | undefined,
  cap: Capability,
): boolean {
  if (!user) return false;
  return ROLE_CAPABILITIES[user.role]?.includes(cap) ?? false;
}

// გვერდის/action-ის დასაწყისში: თუ არ აქვს კაპაბილითი — /portal-ზე გადაისვრება.
export async function requireCapability(cap: Capability) {
  const session = await auth();
  const user = session?.user as
    | { id: string; role: Role; clubId: string | null; athleteId?: string | null }
    | undefined;
  if (!user) redirect("/login");
  if (!can(user, cap)) redirect("/portal");
  return user;
}

export { ALL_STAFF };
