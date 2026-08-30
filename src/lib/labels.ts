import type { AgeCategory, Discipline, Format, DanceClass, CoupleCategory } from "@prisma/client";

export const CATEGORY_LABELS: Record<AgeCategory, string> = {
  JUVENILE_I: "Juvenile I",
  JUVENILE_II: "Juvenile II",
  JUNIOR_I: "Junior I",
  JUNIOR_II: "Junior II",
  YOUTH: "Youth",
  ADULT: "Adult",
};

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  STANDARD: "Standard",
  LATIN: "Latin",
};

export const FORMAT_LABELS: Record<Format, string> = {
  SOLO: "სოლო გოგონები",
  COUPLE: "წყვილები",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as AgeCategory[];

// Solo scoring class (A/B/C/D) — see src/lib/points.ts for the points table.
export const DANCE_CLASS_LABELS: Record<DanceClass, string> = {
  A: "A კლასი",
  B: "B კლასი",
  C: "C კლასი",
  D: "D კლასი",
};
export const DANCE_CLASSES = Object.keys(DANCE_CLASS_LABELS) as DanceClass[];

// Couple scoring category — see src/lib/points.ts for the points table.
// Distinct from AgeCategory: "6 dance"/"rizing star" don't correspond to
// an age bracket, so this is its own field on CompEvent.
export const COUPLE_CATEGORY_LABELS: Record<CoupleCategory, string> = {
  SIX_DANCE: "6 Dance",
  RIZING_STAR: "Rising Star",
  JUVENILE_1_2: "Juvenile I+II",
  JUNIOR_1: "Junior I",
  JUNIOR_2: "Junior II",
  YOUTH: "Youth",
  ADULT: "Adult",
};
export const COUPLE_CATEGORIES = Object.keys(COUPLE_CATEGORY_LABELS) as CoupleCategory[];

// WDSF convention: category depends on the year the athlete TURNS an age,
// so it is a function of (birth year, competition year) — never stored.
export function categoryForYear(birthDate: Date, year: number): AgeCategory {
  const age = year - birthDate.getFullYear();
  if (age <= 9) return "JUVENILE_I";
  if (age <= 11) return "JUVENILE_II";
  if (age <= 13) return "JUNIOR_I";
  if (age <= 15) return "JUNIOR_II";
  if (age <= 18) return "YOUTH";
  return "ADULT";
}

export function categoryFor(birthDate: Date): AgeCategory {
  const age = new Date().getFullYear() - birthDate.getFullYear();
  if (age <= 9) return "JUVENILE_I";
  if (age <= 11) return "JUVENILE_II";
  if (age <= 13) return "JUNIOR_I";
  if (age <= 15) return "JUNIOR_II";
  if (age <= 18) return "YOUTH";
  return "ADULT";
}

export const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("ka-GE", { day: "numeric", month: "long", year: "numeric" }).format(d);
