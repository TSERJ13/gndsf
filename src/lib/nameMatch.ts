// ── Fuzzy name matching for the TopTurnier import ──
// TopTurnier prints one free-text name per participant ("Elene
// Dandurishvili"); our Entry rows are either a solo Athlete (firstName +
// lastName) or a couple Partnership (leader + follower). This scores how
// well a pasted name matches each candidate entry so the import preview
// can suggest a default, while always leaving the admin a manual override.
export interface MatchCandidate {
  entryId: string;
  /** All plausible display strings for this entry (solo: one name;
   *  couple: a few reasonable orderings) — the best-scoring one wins. */
  labels: string[];
}

export interface MatchResult {
  entryId: string;
  label: string;
  score: number; // 0..1, Jaccard similarity over lowercased word tokens
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics (Stoda -> stoda)
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Best-matching candidate for one pasted name, or null if nothing scores above the floor. */
export function bestMatch(name: string, candidates: MatchCandidate[], floor = 0.34): MatchResult | null {
  const nameTokens = tokenize(name);
  let best: MatchResult | null = null;
  for (const c of candidates) {
    for (const label of c.labels) {
      const score = jaccard(nameTokens, tokenize(label));
      if (!best || score > best.score) best = { entryId: c.entryId, label, score };
    }
  }
  return best && best.score >= floor ? best : null;
}
