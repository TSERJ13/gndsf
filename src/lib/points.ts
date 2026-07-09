// ── Federation points regulation (CONFIGURABLE) ──
// Placeholder WDSF-style table until the federation's official
// regulation document is provided. Replace values here only —
// nothing else in the system hardcodes points.

export const PLACEMENT_POINTS: Record<number, number> = {
  1: 100, 2: 85, 3: 72, 4: 60, 5: 50, 6: 42, 7: 35, 8: 30,
};

// Points validity window in months (rolling)
export const VALIDITY_MONTHS = 12;

// Competition tier multipliers
export const TYPE_COEFFICIENTS: Record<string, number> = {
  REGIONAL: 0.8,
  NATIONAL: 1.0,
  INTERNATIONAL: 1.5,
};

export function pointsFor(placement: number, coefficient: number): number {
  const base = PLACEMENT_POINTS[placement] ?? Math.max(0, 26 - placement);
  return Math.round(base * coefficient);
}

export function validUntilFrom(earnedAt: Date): Date {
  const d = new Date(earnedAt);
  d.setMonth(d.getMonth() + VALIDITY_MONTHS);
  return d;
}
