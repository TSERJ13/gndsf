// ── Federation points regulation ──
// Source: "axali soloebi.pdf" (page 1 — confirmed authoritative table;
// page 3 had a conflicting value for 13-24/Youth-Adult/place 1 — 70
// instead of 60 — which the federation confirmed is NOT the correct one)
// and "წყვილების რეიტინგი.pdf" (single confirmed table).
//
// Design notes carried over from the original standalone version of this
// logic (gndsf-scoring/scoring.js):
//
// 1) The solo table gives identical values across every age category —
//    it is genuinely one table, not two. `ageCategory` is still accepted
//    and passed through so a future table that DOES differentiate by age
//    doesn't require a signature change; it is not currently used in the
//    lookup itself.
// 2) In the 24+ participants range, every place from 7 down scores a
//    flat 0.5 — this was confirmed directly, in preference to the PDF's
//    ambiguous extra rows after the "D class" table.
// 3) In the non-24+ ranges (0-6 / 7-12 / 13-24), the table only defines
//    places 1-6. A place beyond that, or a class/range combination the
//    PDF never defined (e.g. class D with 0-6 participants), throws
//    rather than silently returning 0 — so a bad or unanticipated result
//    can't quietly disappear into the rankings as "0 points".
export function validUntilFrom(earnedAt: Date): Date {
  const d = new Date(earnedAt);
  d.setMonth(d.getMonth() + VALIDITY_MONTHS);
  return d;
}

// Points validity window in months (rolling)
export const VALIDITY_MONTHS = 12;

// Default `pointsCoefficient` suggested when creating a competition, by
// tier. Kept for the competition-creation form (see
// src/app/portal/competitions/actions.ts) — it is NOT applied to scoring
// anymore (see file header): the federation's confirmed table already
// gives absolute points, so multiplying by a tier coefficient would not
// match the confirmed test cases.
export const TYPE_COEFFICIENTS: Record<string, number> = {
  REGIONAL: 0.8,
  NATIONAL: 1.0,
  INTERNATIONAL: 1.5,
};

// ─────────────────────────── Solo scoring ───────────────────────────

const SOLO_PARTICIPANT_RANGES = [
  { key: "0-6", min: 0, max: 6 },
  { key: "7-12", min: 7, max: 12 },
  { key: "13-24", min: 13, max: 24 },
  { key: "24+", min: 25, max: Infinity },
] as const;

type SoloRangeKey = (typeof SOLO_PARTICIPANT_RANGES)[number]["key"];
type DanceClassKey = "A" | "B" | "C" | "D";

const SOLO_POINTS: Record<DanceClassKey, Partial<Record<SoloRangeKey, Record<number, number>>>> = {
  A: {
    "0-6": { 1: 45, 2: 40, 3: 35, 4: 30, 5: 28, 6: 25 },
    "7-12": { 1: 55, 2: 45, 3: 40, 4: 35, 5: 30, 6: 28 },
    "13-24": { 1: 60, 2: 55, 3: 45, 4: 40, 5: 35, 6: 30 },
    "24+": { 1: 70, 2: 60, 3: 55, 4: 45, 5: 40, 6: 35 },
  },
  B: {
    // 0-6 range: class B is not defined in the source table.
    "7-12": { 1: 25, 2: 22, 3: 20, 4: 18, 5: 17, 6: 16 },
    "13-24": { 1: 28, 2: 25, 3: 22, 4: 20, 5: 18, 6: 17 },
    "24+": { 1: 30, 2: 28, 3: 25, 4: 22, 5: 20, 6: 18 },
  },
  C: {
    // 0-6 and 7-12 ranges: class C is not defined in the source table.
    "13-24": { 1: 16, 2: 13, 3: 12, 4: 11, 5: 10, 6: 9 },
    "24+": { 1: 17, 2: 16, 3: 13, 4: 12, 5: 11, 6: 10 },
  },
  D: {
    // 0-6 and 7-12 ranges: class D is not defined in the source table.
    "13-24": { 1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2 },
    "24+": { 1: 9, 2: 8, 3: 7, 4: 6, 5: 5, 6: 4 },
  },
};

function resolveSoloRange(participants: number): SoloRangeKey | null {
  for (const r of SOLO_PARTICIPANT_RANGES) {
    if (participants >= r.min && participants <= r.max) return r.key;
  }
  return null;
}

/**
 * Solo score, per the federation's confirmed points table.
 * @param participants number of entries in this event (the whole field)
 * @param ageCategory  accepted for validation / future differentiation —
 *                     the confirmed table does not vary by age category
 * @param danceClass   "A" | "B" | "C" | "D"
 * @param place        placement (1-based)
 */
export function getSoloScore(
  participants: number,
  ageCategory: string,
  danceClass: DanceClassKey,
  place: number,
): number {
  if (!Number.isInteger(participants) || participants < 0) {
    throw new Error(`getSoloScore: მონაწილეთა რაოდენობა არასწორია: ${participants}`);
  }
  if (!ageCategory) {
    throw new Error("getSoloScore: ასაკობრივი კატეგორია არ არის მითითებული.");
  }
  if (!Number.isInteger(place) || place < 1) {
    throw new Error(`getSoloScore: ადგილი არასწორია: ${place}`);
  }

  const range = resolveSoloRange(participants);
  if (!range) {
    throw new Error(`getSoloScore: მონაწილეთა რაოდენობისთვის (${participants}) რეინჯი ვერ მოიძებნა.`);
  }

  // 24+ range: every place from 7 down is a flat 0.5.
  if (range === "24+" && place >= 7) {
    return 0.5;
  }

  const table = SOLO_POINTS[danceClass]?.[range];
  if (!table) {
    throw new Error(
      `getSoloScore: კომბინაცია "კლასი ${danceClass} + მონაწილეები ${range}" ცხრილში არ არსებობს ` +
        `(ეს კლასი ამ მონაწილეთა რაოდენობისთვის ცხრილში საერთოდ არაა განსაზღვრული).`,
    );
  }

  const score = table[place];
  if (score === undefined) {
    throw new Error(
      `getSoloScore: "კლასი ${danceClass} + მონაწილეები ${range}"-სთვის ${place}-ე ადგილი ცხრილში არ არსებობს ` +
        `(მხოლოდ 1-6 ადგილია განსაზღვრული ამ რეინჯში).`,
    );
  }

  return score;
}

// ─────────────────────────── Couple scoring ───────────────────────────

const COUPLE_PLACE_RANGES = [
  { key: "1", min: 1, max: 1 },
  { key: "2", min: 2, max: 2 },
  { key: "3", min: 3, max: 3 },
  { key: "4", min: 4, max: 4 },
  { key: "5", min: 5, max: 5 },
  { key: "6", min: 6, max: 6 },
  { key: "7-12", min: 7, max: 12 },
  { key: "13-20", min: 13, max: 20 },
  { key: "21-32", min: 21, max: 32 },
  { key: "33-48", min: 33, max: 48 },
  { key: "49-96", min: 49, max: 96 },
  { key: "97-192", min: 97, max: 192 },
] as const;

type CouplePlaceKey = (typeof COUPLE_PLACE_RANGES)[number]["key"];
export type CoupleCategoryKey =
  | "SIX_DANCE"
  | "RIZING_STAR"
  | "JUVENILE_1_2"
  | "JUNIOR_1"
  | "JUNIOR_2"
  | "YOUTH"
  | "ADULT";

// category → place-range → points. Column order in the PDF: 6 dance,
// rizing star, Juvenale1+2, Junior 1, Junior 2, youth, Adult.
const COUPLE_POINTS: Record<CoupleCategoryKey, Record<CouplePlaceKey, number>> = {
  SIX_DANCE: { "1": 12, "2": 10, "3": 8, "4": 7, "5": 4, "6": 2, "7-12": 0.5, "13-20": 0.5, "21-32": 0.5, "33-48": 0.5, "49-96": 0.5, "97-192": 0.5 },
  RIZING_STAR: { "1": 15, "2": 13, "3": 12, "4": 10, "5": 8, "6": 7, "7-12": 4, "13-20": 2, "21-32": 1, "33-48": 0.5, "49-96": 0.5, "97-192": 0.5 },
  JUVENILE_1_2: { "1": 15, "2": 13, "3": 12, "4": 10, "5": 8, "6": 7, "7-12": 4, "13-20": 2, "21-32": 1, "33-48": 0.5, "49-96": 0.5, "97-192": 0.5 },
  JUNIOR_1: { "1": 25, "2": 21, "3": 18, "4": 14, "5": 12, "6": 9, "7-12": 6, "13-20": 3, "21-32": 1, "33-48": 0.5, "49-96": 0.5, "97-192": 0.5 },
  JUNIOR_2: { "1": 30, "2": 26, "3": 24, "4": 18, "5": 16, "6": 14, "7-12": 8, "13-20": 4, "21-32": 2, "33-48": 1, "49-96": 0.5, "97-192": 0.5 },
  YOUTH: { "1": 45, "2": 40, "3": 35, "4": 30, "5": 25, "6": 20, "7-12": 13, "13-20": 6, "21-32": 3, "33-48": 2, "49-96": 1, "97-192": 0.5 },
  ADULT: { "1": 70, "2": 60, "3": 52, "4": 36, "5": 32, "6": 28, "7-12": 16, "13-20": 8, "21-32": 4, "33-48": 3, "49-96": 2, "97-192": 1 },
};

function resolveCouplePlaceRange(place: number): CouplePlaceKey | null {
  for (const r of COUPLE_PLACE_RANGES) {
    if (place >= r.min && place <= r.max) return r.key;
  }
  return null; // place > 192
}

/**
 * Couple score, per the federation's confirmed points table.
 * @param category one of the 7 confirmed couple categories
 * @param place    placement (1-based), out of the FULL field size
 */
export function getCoupleScore(category: CoupleCategoryKey, place: number): number {
  if (!category) {
    throw new Error("getCoupleScore: კატეგორია არ არის მითითებული.");
  }
  if (!Number.isInteger(place) || place < 1) {
    throw new Error(`getCoupleScore: ადგილი არასწორია: ${place}`);
  }

  const rangeKey = resolveCouplePlaceRange(place);
  if (!rangeKey) {
    throw new Error(`getCoupleScore: ${place}-ე ადგილი ცხრილის დიაპაზონს (1-192) სცდება — მონაცემი არ არსებობს.`);
  }

  return COUPLE_POINTS[category][rangeKey];
}
