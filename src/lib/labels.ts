import type { AgeCategory, Discipline, Format } from "@prisma/client";

export const CATEGORY_LABELS: Record<AgeCategory, string> = {
  JUVENILE_I: "ჯუვენალები I",
  JUVENILE_II: "ჯუვენალები II",
  JUNIOR_I: "იუნიორები I",
  JUNIOR_II: "იუნიორები II",
  YOUTH: "ახალგაზრდები",
  ADULT: "უფროსები",
};

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  STANDARD: "სტანდარტი",
  LATIN: "ლათინური",
};

export const FORMAT_LABELS: Record<Format, string> = {
  SOLO: "სოლო",
  COUPLE: "წყვილები",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as AgeCategory[];

// Age category from birth year relative to current year (WDSF convention)
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
