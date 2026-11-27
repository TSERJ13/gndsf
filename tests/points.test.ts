// Every cell of the federation's two points tables.
// Run: npx tsx --test tests/points.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { getSoloScore, getCoupleScore, coupleColumnFor } from "../src/lib/points";

test("solo: 1-6 participants", () => {
  [45, 40, 35, 30, 28, 25].forEach((p, i) => assert.equal(getSoloScore(6, i + 1), p));
  assert.equal(getSoloScore(1, 1), 45);
});

test("solo: 7-12 participants (A + B finals)", () => {
  const exp = [55, 45, 40, 35, 30, 28, 25, 22, 20, 18, 17, 16];
  exp.forEach((p, i) => assert.equal(getSoloScore(12, i + 1), p));
  assert.equal(getSoloScore(7, 7), 25);
});

test("solo: 13-24 participants (A-D finals), 24 belongs here", () => {
  const exp = [60, 55, 45, 40, 35, 30, 28, 25, 22, 20, 18, 17, 16, 13, 12, 11, 10, 9, 7, 6, 5, 4, 3, 2];
  exp.forEach((p, i) => assert.equal(getSoloScore(24, i + 1), p));
  assert.equal(getSoloScore(13, 1), 60);
});

test("solo: 25+ participants", () => {
  const exp = [70, 60, 55, 45, 40, 35, 30, 28, 25, 22, 20, 18, 17, 16, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 1, 1];
  exp.forEach((p, i) => assert.equal(getSoloScore(40, i + 1), p));
  assert.equal(getSoloScore(40, 31), 0.5);
  assert.equal(getSoloScore(40, 40), 0.5);
  assert.equal(getSoloScore(25, 25), 3);
});

test("solo: invalid input throws", () => {
  assert.throws(() => getSoloScore(6, 7));
  assert.throws(() => getSoloScore(0, 1));
  assert.throws(() => getSoloScore(10, 0));
});

const COUPLE: Record<string, number[]> = {
  SIX_DANCE: [12, 10, 8, 7, 4, 2, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
  JUVENILE_1_2: [15, 13, 12, 10, 8, 7, 4, 2, 1, 0.5, 0.5, 0.5],
  JUNIOR_1: [25, 21, 18, 14, 12, 9, 6, 3, 1, 0.5, 0.5, 0.5],
  JUNIOR_2: [30, 26, 24, 18, 16, 14, 8, 4, 2, 1, 0.5, 0.5],
  YOUTH: [45, 40, 35, 30, 25, 20, 13, 6, 3, 2, 1, 0.5],
  ADULT: [70, 60, 52, 36, 32, 28, 16, 8, 4, 3, 2, 1],
};
// first place of each row: 1..6, then 7-12, 13-20, 21-32, 33-48, 49-96, 97-192
const ROW_PLACES = [[1], [2], [3], [4], [5], [6], [7, 12], [13, 20], [21, 32], [33, 48], [49, 96], [97, 192]];

test("couples: every cell (both ends of each range)", () => {
  for (const [col, values] of Object.entries(COUPLE)) {
    ROW_PLACES.forEach((places, i) => {
      for (const place of places) {
        assert.equal(getCoupleScore(col as never, place), values[i], `${col} place ${place}`);
      }
    });
  }
  assert.throws(() => getCoupleScore("ADULT", 193));
});

test("couples: column chosen from age, 6 dance flag wins", () => {
  assert.equal(coupleColumnFor({ ageCategory: "JUVENILE_I" }), "JUVENILE_1_2");
  assert.equal(coupleColumnFor({ ageCategory: "JUVENILE_II" }), "JUVENILE_1_2");
  assert.equal(coupleColumnFor({ ageCategory: "JUNIOR_I" }), "JUNIOR_1");
  assert.equal(coupleColumnFor({ ageCategory: "JUNIOR_II" }), "JUNIOR_2");
  assert.equal(coupleColumnFor({ ageCategory: "YOUTH" }), "YOUTH");
  assert.equal(coupleColumnFor({ ageCategory: "ADULT" }), "ADULT");
  assert.equal(coupleColumnFor({ ageCategory: "JUVENILE_II", coupleCategory: "SIX_DANCE" }), "SIX_DANCE");
  assert.equal(coupleColumnFor({ ageCategory: "ADULT", coupleCategory: "ADULT" }), "ADULT");
});
