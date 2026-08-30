// ── TopTurnier results import — parser ──
//
// TopTurnier (the scrutineering software GNDSF's officials actually use)
// publishes results as an HTML page with collapsible sections. When an
// admin selects all the text on that page and pastes it here, the browser
// linearizes it into tab-separated rows — this module reads that plain
// text back into structured data. No PDF, no OCR: TopTurnier's own HTML
// export already IS the structured source.
//
// Validated against a real GNDSF competition page (Batumi Open 2026,
// "WDSF Open Solo Latin Jun. II", dancesportinfo.lt) — see
// src/lib/topturnierParse.test.ts.
//
// Design decision: we deliberately parse ONLY the "Competition Listing"
// section (falling back to "Result of the Final" when Competition Listing
// is absent — a competition with no elimination rounds only ever prints
// the latter). That one section already carries everything needed for
// "who advanced and who didn't":
//   - the participant's true final placement (skating-system computed,
//     ties included, e.g. "13.-14.") — TopTurnier has already run the
//     official WDSF algorithm, so we never have to reimplement it
//   - which round they were still in when the list stops mentioning them
//     (grouped under round headers: "Final", "3rd round", "2nd round", ...)
//
// The "Table of results" / "Report of Final Round" / "Skating report"
// sections (raw per-judge marks, dance-by-dance skating calculation) are
// NOT parsed here. They're real and useful for a future judging-marks
// transparency feature, but they paste as fragile multi-line-per-cell
// text blocks — not worth the risk for this first pass. Ask the admin to
// paste the section that includes "Competition Listing" and/or "Result of
// the Final"; that is enough.

export interface TopturnierParticipant {
  startNumber: number;
  name: string;
  country: string;
  /** Placement used for scoring — the lower (better) bound when tied. */
  placement: number;
  /** Set only when TopTurnier reported a tie, e.g. "13.-14." → [13, 14]. */
  placementTie?: [number, number];
  /** How many rounds this entry competed in. A final-round entry counts
   *  every preliminary round plus the final. */
  roundsReached: number;
  /** The round-group label this row was found under, verbatim ("Final",
   *  "2nd round", ...) — kept for the admin preview, not used elsewhere. */
  roundLabel: string;
}

export interface TopturnierParseResult {
  participants: TopturnierParticipant[];
  roundLabels: string[];
  warnings: string[];
  source: "competition-listing" | "result-of-final" | "none";
}

const ROUND_GROUP_RE = /^(Final|(\d+)(?:st|nd|rd|th)\s+round)\s*$/i;
// "1." → rank 1.  "13.- 14." / "13.-14." / "13. - 14." → tie [13, 14].
const RANK_CELL_RE = /^(\d+)\.\s*(?:-\s*(\d+)\.?)?\s*$/;

function normalizeLines(rawText: string): string[] {
  return rawText
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/ /g, " ").trimEnd());
}

function parseRankCell(cell: string): { placement: number; tie?: [number, number] } | null {
  const m = RANK_CELL_RE.exec(cell.trim());
  if (!m) return null;
  const from = Number(m[1]);
  const to = m[2] ? Number(m[2]) : undefined;
  return to ? { placement: from, tie: [from, to] } : { placement: from };
}

/**
 * Parses the "Competition Listing" section: round-group headers ("Final",
 * "3rd round", "2nd round", "1st round", ...) each followed by data rows
 * "<rank>\t<startNumber>\t<name>\t<country>". Every participant appears
 * under exactly one group — the furthest round they reached.
 */
function parseCompetitionListing(lines: string[]): TopturnierParticipant[] | null {
  const startIdx = lines.findIndex((l) => /^[–+-]?\s*Competition Listing\s*$/.test(l.trim()));
  if (startIdx === -1) return null;

  // Section ends at the next known section header, or end of text.
  const KNOWN_HEADERS =
    /^[–+-]?\s*(Competition report|Competition Listing|Table of results|Ranking Report|Report of Final Round|Skating report|Heat list|Startlist)\s*$/;
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (KNOWN_HEADERS.test(lines[i].trim())) {
      endIdx = i;
      break;
    }
  }

  const groupLabels: string[] = [];
  const rows: { label: string; roundNumber: number; cells: string[] }[] = [];
  let currentLabel: string | null = null;

  for (let i = startIdx + 1; i < endIdx; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const groupMatch = ROUND_GROUP_RE.exec(line);
    if (groupMatch) {
      currentLabel = line;
      if (!groupLabels.includes(currentLabel)) groupLabels.push(currentLabel);
      continue;
    }
    if (/^Rank\t?/.test(line) || line === "Rank") continue; // header row, e.g. "Rank\tNo.\tParticipant\tCountry"
    if (!currentLabel) continue; // stray line before first round group
    const cells = line.split("\t").map((c) => c.trim());
    if (cells.length < 4) continue;
    rows.push({ label: currentLabel, roundNumber: -1, cells });
  }

  if (!rows.length) return null;

  // Highest numbered preliminary round in this event; "Final" sits one
  // round above it (e.g. 3 prelim rounds → Final = round 4 reached).
  const numericRounds = groupLabels
    .map((l) => (l === "Final" ? null : Number(/^(\d+)/.exec(l)?.[1])))
    .filter((n): n is number => n != null);
  const maxNumericRound = numericRounds.length ? Math.max(...numericRounds) : 0;
  const roundNumberFor = (label: string) => (label === "Final" ? maxNumericRound + 1 : Number(/^(\d+)/.exec(label)?.[1]));

  const participants: TopturnierParticipant[] = [];
  for (const row of rows) {
    const rank = parseRankCell(row.cells[0]);
    const startNumber = Number(row.cells[1]);
    const name = row.cells[2];
    const country = row.cells[3] ?? "";
    if (!rank || !Number.isFinite(startNumber) || !name) continue;
    participants.push({
      startNumber,
      name,
      country,
      placement: rank.placement,
      placementTie: rank.tie,
      roundsReached: roundNumberFor(row.label),
      roundLabel: row.label,
    });
  }
  return participants.length ? participants : null;
}

/**
 * Fallback for a competition with no preliminary rounds at all — only
 * "Result of the Final" is printed (same 4-column shape, no round
 * grouping). Every entry gets roundsReached = 1.
 */
function parseResultOfFinal(lines: string[]): TopturnierParticipant[] | null {
  const startIdx = lines.findIndex((l) => /^Result of the Final\s*$/.test(l.trim()));
  if (startIdx === -1) return null;
  const participants: TopturnierParticipant[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^Rank\t?/.test(line) || line === "Rank") continue;
    if (/^(Statistics|Competition Listing|Table of results)\s*$/.test(line)) break;
    const cells = line.split("\t").map((c) => c.trim());
    if (cells.length < 4) break;
    const rank = parseRankCell(cells[0]);
    const startNumber = Number(cells[1]);
    if (!rank || !Number.isFinite(startNumber)) break;
    participants.push({
      startNumber,
      name: cells[2],
      country: cells[3] ?? "",
      placement: rank.placement,
      placementTie: rank.tie,
      roundsReached: 1,
      roundLabel: "Final",
    });
  }
  return participants.length ? participants : null;
}

export function parseTopturnier(rawText: string): TopturnierParseResult {
  const lines = normalizeLines(rawText);
  const warnings: string[] = [];

  const fromListing = parseCompetitionListing(lines);
  if (fromListing) {
    const seen = new Set<number>();
    for (const p of fromListing) {
      if (seen.has(p.startNumber)) {
        warnings.push(`სტარტ-ნომერი ${p.startNumber} ორჯერ გამოჩნდა "Competition Listing"-ში — გადამოწმეთ.`);
      }
      seen.add(p.startNumber);
    }
    return {
      participants: fromListing,
      roundLabels: Array.from(new Set(fromListing.map((p) => p.roundLabel))),
      warnings,
      source: "competition-listing",
    };
  }

  const fromFinal = parseResultOfFinal(lines);
  if (fromFinal) {
    warnings.push(
      '"Competition Listing" ვერ მოიძებნა — გამოყენებულია მხოლოდ "Result of the Final", ასე რომ ტურების ინფორმაცია (ვინ რომელ ტურამდე მივიდა) არ არის ხელმისაწვდომი, მხოლოდ საბოლოო ადგილები.',
    );
    return {
      participants: fromFinal,
      roundLabels: ["Final"],
      warnings,
      source: "result-of-final",
    };
  }

  warnings.push(
    'ვერც "Competition Listing" და ვერც "Result of the Final" ვერ ვიპოვე ჩასმულ ტექსტში — დარწმუნდით, რომ დააკოპირეთ მთელი გვერდი (Cmd/Ctrl+A) ტურნირის შედეგების საიტიდან.',
  );
  return { participants: [], roundLabels: [], warnings, source: "none" };
}
