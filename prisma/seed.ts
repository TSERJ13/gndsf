// Seed: realistic sample data that exercises the full dancer lifecycle —
// a split couple, a partner change, a club transfer — so every page
// has something honest to render.
import { PrismaClient, AgeCategory, Discipline, Format } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// Placement → base points (configurable federation rule, WDSF-inspired)
const POINTS: Record<number, number> = {
  1: 100, 2: 85, 3: 72, 4: 60, 5: 50, 6: 42, 7: 35, 8: 30,
};
const pointsFor = (placement: number, coef: number) =>
  Math.round((POINTS[placement] ?? Math.max(0, 26 - placement)) * coef);

const yearsAgo = (n: number, m = 0) =>
  new Date(new Date().getFullYear() - n, m, 15);

async function main() {
  // wipe (dev only)
  await db.rankingEntry.deleteMany();
  await db.rankingPoint.deleteMany();
  await db.result.deleteMany();
  await db.entry.deleteMany();
  await db.compEvent.deleteMany();
  await db.competition.deleteMany();
  await db.partnership.deleteMany();
  await db.clubMembership.deleteMany();
  await db.news.deleteMany();
  await db.calendarEvent.deleteMany();
  await db.auditLog.deleteMany();
  await db.adminTask.deleteMany();
  await db.mailAccount.deleteMany();
  await db.athleteDocument.deleteMany();
  await db.user.deleteMany();
  await db.athlete.deleteMany();
  await db.club.deleteMany();

  const [tbilisi, batumi, kutaisi] = await Promise.all([
    db.club.create({ data: { name: "ცეკვის კლუბი „რიტმი“", nameEn: "Dance Club Ritmi", city: "თბილისი" } }),
    db.club.create({ data: { name: "საცეკვაო სტუდია „ტალღა“", nameEn: "Dance Studio Talgha", city: "ბათუმი" } }),
    db.club.create({ data: { name: "სპორტული ცეკვის ცენტრი „იმერეთი“", nameEn: "DanceSport Center Imereti", city: "ქუთაისი" } }),
  ]);

  const mk = (min: string, fn: string, ln: string, fnEn: string, lnEn: string, birthYear: number, g: "MALE" | "FEMALE") =>
    db.athlete.create({
      data: {
        gid: min, firstName: fn, lastName: ln, firstNameEn: fnEn, lastNameEn: lnEn,
        birthDate: new Date(birthYear, 4, 10), gender: g,
      },
    });

  const giorgi = await mk("GID-1001", "გიორგი", "ბერიძე", "Giorgi", "Beridze", 2009, "MALE");
  const nino = await mk("GID-1002", "ნინო", "კაპანაძე", "Nino", "Kapanadze", 2010, "FEMALE");
  const mariam = await mk("GID-1003", "მარიამ", "გელაშვილი", "Mariam", "Gelashvili", 2009, "FEMALE");
  const luka = await mk("GID-1004", "ლუკა", "წიკლაური", "Luka", "Tsiklauri", 2003, "MALE");
  const ana = await mk("GID-1005", "ანა", "მაისურაძე", "Ana", "Maisuradze", 2004, "FEMALE");
  const saba = await mk("GID-1006", "საბა", "ხარაძე", "Saba", "Kharadze", 2014, "MALE");
  const elene = await mk("GID-1007", "ელენე", "ჯაფარიძე", "Elene", "Japaridze", 2015, "FEMALE");
  const tamar = await mk("GID-1008", "თამარ", "ლომიძე", "Tamar", "Lomidze", 2012, "FEMALE");

  // Club history — Giorgi transferred from Batumi to Tbilisi last year
  await db.clubMembership.createMany({
    data: [
      { athleteId: giorgi.id, clubId: batumi.id, startDate: yearsAgo(5), endDate: yearsAgo(1) },
      { athleteId: giorgi.id, clubId: tbilisi.id, startDate: yearsAgo(1) },
      { athleteId: nino.id, clubId: batumi.id, startDate: yearsAgo(4) },
      { athleteId: mariam.id, clubId: tbilisi.id, startDate: yearsAgo(3) },
      { athleteId: luka.id, clubId: tbilisi.id, startDate: yearsAgo(8) },
      { athleteId: ana.id, clubId: tbilisi.id, startDate: yearsAgo(7) },
      { athleteId: saba.id, clubId: kutaisi.id, startDate: yearsAgo(2) },
      { athleteId: elene.id, clubId: kutaisi.id, startDate: yearsAgo(2) },
      { athleteId: tamar.id, clubId: batumi.id, startDate: yearsAgo(3) },
    ],
  });

  // The lifecycle story: Giorgi+Nino danced together, split; Giorgi now with Mariam
  const giorgiNino = await db.partnership.create({
    data: { leaderId: giorgi.id, followerId: nino.id, startDate: yearsAgo(3), endDate: yearsAgo(0, 1) },
  });
  const giorgiMariam = await db.partnership.create({
    data: { leaderId: giorgi.id, followerId: mariam.id, startDate: yearsAgo(0, 2) },
  });
  const lukaAna = await db.partnership.create({
    data: { leaderId: luka.id, followerId: ana.id, startDate: yearsAgo(4) },
  });
  const sabaElene = await db.partnership.create({
    data: { leaderId: saba.id, followerId: elene.id, startDate: yearsAgo(1) },
  });

  // Two past competitions + results
  const cup = await db.competition.create({
    data: {
      name: "საქართველოს თასი 2026", nameEn: "Georgian Cup 2026", type: "NATIONAL",
      city: "თბილისი", venue: "სპორტის სასახლე", startDate: yearsAgo(0, 2), isPublished: true,
    },
  });
  const open = await db.competition.create({
    data: {
      name: "ბათუმი ღია პირველობა 2025", nameEn: "Batumi Open 2025", type: "REGIONAL",
      city: "ბათუმი", startDate: yearsAgo(1, 9), isPublished: true,
    },
  });

  type Row = { partnership?: string; athlete?: string; club: string; cat: AgeCategory; placement: number };
  async function eventWithResults(
    compId: string, cat: AgeCategory, disc: Discipline, fmt: Format, date: Date, coef: number, rows: Row[],
  ) {
    const ev = await db.compEvent.create({
      data: { competitionId: compId, ageCategory: cat, discipline: disc, format: fmt },
    });
    for (const r of rows) {
      const entry = await db.entry.create({
        data: {
          eventId: ev.id, partnershipId: r.partnership, athleteId: r.athlete,
          clubIdSnapshot: r.club, ageCategorySnapshot: r.cat,
        },
      });
      const result = await db.result.create({
        data: { entryId: entry.id, placement: r.placement },
      });
      const pts = pointsFor(r.placement, coef);
      const validUntil = new Date(date); validUntil.setFullYear(validUntil.getFullYear() + 1);
      // couple → two point rows (points follow the athlete, WDSF model)
      const athleteIds = r.partnership
        ? await db.partnership.findUniqueOrThrow({ where: { id: r.partnership } })
            .then((p) => [p.leaderId, p.followerId])
        : [r.athlete!];
      await db.rankingPoint.createMany({
        data: athleteIds.map((athleteId) => ({
          resultId: result.id, athleteId, points: pts, earnedAt: date, validUntil,
        })),
      });
    }
  }

  // Batumi Open 2025 — Giorgi danced with NINO for BATUMI club (history!)
  await eventWithResults(open.id, "JUNIOR_II", "LATIN", "COUPLE", open.startDate, 1.0, [
    { partnership: giorgiNino.id, club: batumi.id, cat: "JUNIOR_II", placement: 1 },
  ]);
  await eventWithResults(open.id, "ADULT", "STANDARD", "COUPLE", open.startDate, 1.0, [
    { partnership: lukaAna.id, club: tbilisi.id, cat: "ADULT", placement: 2 },
  ]);

  // Georgian Cup 2026 — Giorgi now with MARIAM for TBILISI club
  await eventWithResults(cup.id, "YOUTH", "LATIN", "COUPLE", cup.startDate, 1.0, [
    { partnership: giorgiMariam.id, club: tbilisi.id, cat: "YOUTH", placement: 1 },
    { partnership: sabaElene.id, club: kutaisi.id, cat: "YOUTH", placement: 2 },
  ]);
  await eventWithResults(cup.id, "ADULT", "STANDARD", "COUPLE", cup.startDate, 1.0, [
    { partnership: lukaAna.id, club: tbilisi.id, cat: "ADULT", placement: 1 },
  ]);
  await eventWithResults(cup.id, "JUNIOR_I", "LATIN", "SOLO", cup.startDate, 1.0, [
    { athlete: tamar.id, club: batumi.id, cat: "JUNIOR_I", placement: 1 },
  ]);

  // ── Ranking recomputation (the same job Phase 2's admin will trigger) ──
  await recomputeRankings();

  await db.news.createMany({
    data: [
      {
        slug: "georgian-cup-2026-results",
        title: "საქართველოს თასი 2026 — შედეგები გამოქვეყნდა",
        titleEn: "Georgian Cup 2026 — results published",
        excerpt: "ეროვნული რეიტინგი განახლდა ყველა ასაკობრივ კატეგორიაში.",
        body: "სრული შედეგები ხელმისაწვდომია შეჯიბრების გვერდზე.",
        publishedAt: new Date(),
      },
      {
        slug: "wdsf-registration-2026",
        title: "WDSF ლიცენზირების ვადები 2026 სეზონისთვის",
        titleEn: "WDSF licensing deadlines for the 2026 season",
        excerpt: "საერთაშორისო შეჯიბრებებში მონაწილეობის მსურველებმა განაცხადი 1 სექტემბრამდე შეიტანონ.",
        body: "დეტალები დოკუმენტების განყოფილებაში.",
        publishedAt: new Date(Date.now() - 5 * 864e5),
      },
    ],
  });

  await db.calendarEvent.createMany({
    data: [
      { title: "თბილისი ღია პირველობა", titleEn: "Tbilisi Open", city: "თბილისი", date: new Date(Date.now() + 30 * 864e5) },
      { title: "WDSF World Open — Vienna", titleEn: "WDSF World Open — Vienna", city: "ვენა", date: new Date(Date.now() + 62 * 864e5), isIntl: true },
      { title: "შემოდგომის თასი", titleEn: "Autumn Cup", city: "ქუთაისი", date: new Date(Date.now() + 95 * 864e5) },
    ],
  });

  // ── Users: one per role tier for testing RBAC ──
  const hash = await bcrypt.hash("gndsf2026!", 10);
  await db.user.createMany({
    data: [
      { email: "admin@gndsf.ge", passwordHash: hash, name: "სუპერ ადმინი", role: "SUPER_ADMIN" },
      { email: "president@gndsf.ge", passwordHash: hash, name: "ფედერაციის პრეზიდენტი", role: "PRESIDENT" },
      { email: "secretary@gndsf.ge", passwordHash: hash, name: "გენერალური მდივანი", role: "GENERAL_SECRETARY" },
      { email: "ritmi@gndsf.ge", passwordHash: hash, name: "კლუბ „რიტმის“ მენეჯერი", role: "CLUB_MANAGER", clubId: tbilisi.id },
      // athlete-portal accounts → /cabinet
      { email: "giorgi@demo.ge", passwordHash: hash, name: "გიორგი ბერიძე", role: "ATHLETE", athleteId: giorgi.id },
      { email: "tamar@demo.ge", passwordHash: hash, name: "თამარ ლომიძე", role: "ATHLETE", athleteId: tamar.id },
    ],
  });

  console.log("Seed complete. Users: admin@gndsf.ge / president@gndsf.ge / secretary@gndsf.ge / ritmi@gndsf.ge — password: gndsf2026!");
}

// Derived leaderboards: truncate + rebuild. Idempotent by design.
async function recomputeRankings() {
  await db.rankingEntry.deleteMany();
  const now = new Date();

  // Couple leaderboards: sum both partners' valid points per ACTIVE couple,
  // shown as couple average, grouped by the category they currently dance in.
  const activeCouples = await db.partnership.findMany({
    where: { endDate: null },
    include: { leader: true, follower: true },
  });

  type Key = string;
  const boards = new Map<Key, { partnershipId?: string; athleteId?: string; total: number }[]>();

  for (const p of activeCouples) {
    const pts = await db.rankingPoint.aggregate({
      where: { athleteId: { in: [p.leaderId, p.followerId] }, validUntil: { gte: now } },
      _sum: { points: true },
    });
    const total = Math.round((pts._sum.points ?? 0) / 2);
    if (total === 0) continue;
    // current category = older partner's category (WDSF rule)
    const cat = categoryFor(new Date(Math.min(+p.leader.birthDate, +p.follower.birthDate)));
    for (const disc of ["STANDARD", "LATIN"] as const) {
      // only rank in disciplines the couple actually has results in
      const has = await db.entry.findFirst({
        where: { partnershipId: p.id, event: { discipline: disc } },
      });
      if (!has) continue;
      const key = `${cat}|${disc}|COUPLE`;
      if (!boards.has(key)) boards.set(key, []);
      boards.get(key)!.push({ partnershipId: p.id, total });
    }
  }

  // Solo leaderboards
  const soloAthletes = await db.athlete.findMany({
    where: { soloEntries: { some: {} } },
  });
  for (const a of soloAthletes) {
    const pts = await db.rankingPoint.aggregate({
      where: {
        athleteId: a.id, validUntil: { gte: now },
        result: { entry: { athleteId: a.id } }, // solo-earned points only
      },
      _sum: { points: true },
    });
    const total = pts._sum.points ?? 0;
    if (total === 0) continue;
    const cat = categoryFor(a.birthDate);
    for (const disc of ["STANDARD", "LATIN"] as const) {
      const has = await db.entry.findFirst({
        where: { athleteId: a.id, event: { discipline: disc } },
      });
      if (!has) continue;
      const key = `${cat}|${disc}|SOLO`;
      if (!boards.has(key)) boards.set(key, []);
      boards.get(key)!.push({ athleteId: a.id, total });
    }
  }

  for (const [key, rows] of boards) {
    const [cat, disc, fmt] = key.split("|") as [AgeCategory, Discipline, Format];
    rows.sort((a, b) => b.total - a.total);
    await db.rankingEntry.createMany({
      data: rows.map((r, i) => ({
        ageCategory: cat, discipline: disc, format: fmt,
        athleteId: r.athleteId, partnershipId: r.partnershipId,
        totalPoints: r.total, position: i + 1,
      })),
    });
  }
}

// Age category from birth year, relative to the current year (WDSF convention)
function categoryFor(birthDate: Date): AgeCategory {
  const age = new Date().getFullYear() - birthDate.getFullYear();
  if (age <= 9) return "JUVENILE_I";
  if (age <= 11) return "JUVENILE_II";
  if (age <= 13) return "JUNIOR_I";
  if (age <= 15) return "JUNIOR_II";
  if (age <= 18) return "YOUTH";
  return "ADULT";
}

main().finally(() => db.$disconnect());
