import type { AgeCategory, Discipline, Format } from "@prisma/client";

export const CATEGORY_LABELS: Record<AgeCategory, string> = {
  JUVENILE_I: "Juvenile I",
  JUVENILE_II: "Juvenile II",
  JUNIOR_I: "Junior I",
  JUNIOR_II: "Junior II",
  YOUTH: "Youth",
  ADULT: "Adult",
};

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  STANDARD: "ევროპული პროგრამა (Standard)",
  LATIN: "ლათინური პროგრამა",
};

export const FORMAT_LABELS: Record<Format, string> = {
  SOLO: "სოლო გოგონები",
  COUPLE: "წყვილები",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as AgeCategory[];

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
