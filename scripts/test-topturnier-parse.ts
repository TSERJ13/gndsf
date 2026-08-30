// Standalone verification script (not part of the app) — run with:
//   npx tsx scripts/test-topturnier-parse.ts
// Cross-checks the TopTurnier parser against the real Batumi Open 2026
// "WDSF Open Solo Latin Jun. II" export (fixture below) that the
// federation pasted in from dancesportinfo.lt.
import { readFileSync } from "fs";
import { parseTopturnier } from "../src/lib/topturnierParse";

const raw = readFileSync(new URL("../src/lib/topturnierParse.fixture.txt", import.meta.url), "utf8");
const result = parseTopturnier(raw);

console.log("source:", result.source);
console.log("warnings:", result.warnings);
console.log("roundLabels:", result.roundLabels);
console.log("participant count:", result.participants.length);
console.table(
  result.participants.map((p) => ({
    start: p.startNumber,
    name: p.name,
    country: p.country,
    placement: p.placementTie ? `${p.placementTie[0]}-${p.placementTie[1]}` : p.placement,
    roundsReached: p.roundsReached,
    roundLabel: p.roundLabel,
  })),
);

// ── Assertions against the known-correct real result ──
const expected: Record<number, { name: string; placement: number; tie?: [number, number]; rounds: number }> = {
  288: { name: "Elene Dandurishvili", placement: 1, rounds: 4 },
  292: { name: "Dea Dekanadze", placement: 2, rounds: 4 },
  296: { name: "Irine Tavartkiladze", placement: 3, rounds: 4 },
  309: { name: "Tekla Gabelashvili", placement: 4, rounds: 4 },
  303: { name: "Barbare Nizharadze", placement: 5, rounds: 4 },
  299: { name: "Charlotte Hanenberg", placement: 6, rounds: 4 },
  297: { name: "Natali Gogoberidze", placement: 7, rounds: 4 },
  305: { name: "Anastasia Gvaramadze", placement: 8, rounds: 3 },
  301: { name: "Mariam Basheleishvili", placement: 9, rounds: 3 },
  304: { name: "Liza Mushkudiani", placement: 10, rounds: 3 },
  300: { name: "Mea Iashvili", placement: 11, rounds: 3 },
  307: { name: "Nia Oniani", placement: 12, rounds: 3 },
  302: { name: "Gvantsa Tkebuchava", placement: 13, tie: [13, 14], rounds: 2 },
  312: { name: "Nino Kitiashvili", placement: 13, tie: [13, 14], rounds: 2 },
  306: { name: "Ana Gvinashvili", placement: 15, rounds: 2 },
  290: { name: "Anastasiia Dzhyncharadze", placement: 16, tie: [16, 17], rounds: 2 },
  298: { name: "Mariam Devadze", placement: 16, tie: [16, 17], rounds: 2 },
  358: { name: "Taia Kaliashvili", placement: 18, rounds: 2 },
  289: { name: "Maria Papikyan", placement: 19, tie: [19, 20], rounds: 2 },
  295: { name: "Sesili Jakeli", placement: 19, tie: [19, 20], rounds: 2 },
  293: { name: "Valeriia Pinchuk", placement: 21, tie: [21, 23], rounds: 2 },
  294: { name: "Anamaria Roshniashvili", placement: 21, tie: [21, 23], rounds: 2 },
  310: { name: "Tekla Kiria", placement: 21, tie: [21, 23], rounds: 2 },
  291: { name: "Anastasia Bazhinova", placement: 24, rounds: 2 },
  359: { name: "Safina Papikyan", placement: 25, rounds: 1 },
  360: { name: "Elene Dvali", placement: 26, rounds: 1 },
  311: { name: "Anamaria Khizanashvili", placement: 27, rounds: 1 },
};

let failures = 0;
if (result.participants.length !== 27) {
  console.error(`FAIL: expected 27 participants, got ${result.participants.length}`);
  failures++;
}
for (const p of result.participants) {
  const exp = expected[p.startNumber];
  if (!exp) {
    console.error(`FAIL: unexpected start number ${p.startNumber} (${p.name})`);
    failures++;
    continue;
  }
  if (p.name !== exp.name) {
    console.error(`FAIL: #${p.startNumber} name "${p.name}" !== expected "${exp.name}"`);
    failures++;
  }
  if (p.placement !== exp.placement) {
    console.error(`FAIL: #${p.startNumber} placement ${p.placement} !== expected ${exp.placement}`);
    failures++;
  }
  if (p.roundsReached !== exp.rounds) {
    console.error(`FAIL: #${p.startNumber} roundsReached ${p.roundsReached} !== expected ${exp.rounds}`);
    failures++;
  }
  const expTie = exp.tie ? exp.tie.join("-") : undefined;
  const gotTie = p.placementTie ? p.placementTie.join("-") : undefined;
  if (expTie !== gotTie) {
    console.error(`FAIL: #${p.startNumber} tie ${gotTie} !== expected ${expTie}`);
    failures++;
  }
}

if (failures === 0) {
  console.log(`\nOK — all ${result.participants.length} participants matched expected placement + round data exactly.`);
  process.exit(0);
} else {
  console.error(`\n${failures} FAILURE(S)`);
  process.exit(1);
}
