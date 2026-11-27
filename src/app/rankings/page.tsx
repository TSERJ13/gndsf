import Link from "next/link";
import { db } from "@/lib/db";
import { CATEGORIES, CATEGORY_LABELS, DISCIPLINE_LABELS } from "@/lib/labels";
import { AthletePhoto, CouplePhoto } from "@/components/Photo";
import type { AgeCategory, Discipline, Format } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "ეროვნული რეიტინგი" };

type Search = { cat?: string; disc?: string; fmt?: string; view?: string };

const FORMATS: { key: Format; label: string }[] = [
  { key: "COUPLE", label: "წყვილები" },
  { key: "SOLO", label: "სოლო" },
];
const DISCIPLINES: Discipline[] = ["LATIN", "STANDARD"];

const fmtPoints = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function Movement({ position, prev }: { position: number; prev: number | null }) {
  if (prev === null) return <span className="text-[11px] font-bold text-[#c49a5b]">ახალი</span>;
  const diff = prev - position;
  if (diff > 0) return <span className="text-[12px] font-bold text-green-600">▲ {diff}</span>;
  if (diff < 0) return <span className="text-[12px] font-bold text-red-600">▼ {-diff}</span>;
  return <span className="text-[12px] text-gray-400">—</span>;
}

export default async function RankingsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const cat = CATEGORIES.includes(sp.cat as AgeCategory) ? (sp.cat as AgeCategory) : undefined;
  const disc: Discipline = sp.disc === "STANDARD" ? "STANDARD" : "LATIN";
  const fmt: Format = sp.fmt === "SOLO" ? "SOLO" : "COUPLE";
  const showTable = sp.view === "table";

  let rows: Awaited<ReturnType<typeof load>> = [];
  async function load() {
    return db.rankingEntry.findMany({
      where: { discipline: disc, format: fmt, ...(cat ? { ageCategory: cat } : {}) },
      orderBy: [{ position: "asc" }],
      include: {
        athlete: { include: { clubMemberships: { where: { endDate: null }, include: { club: true } } } },
        partnership: { include: { leader: true, follower: true, club: true, secondClub: true } },
      },
    });
  }
  try {
    rows = await load();
  } catch (err) {
    console.error("RankingsPage DB error:", err);
  }

  // One leaderboard per age category, in the federation's age order.
  const groups = CATEGORIES.map((c) => ({ cat: c, rows: rows.filter((r) => r.ageCategory === c) })).filter(
    (g) => g.rows.length > 0,
  );

  const link = (patch: Partial<Search>) => {
    const next = { cat, disc, fmt, view: sp.view, ...patch };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v);
    return `/rankings?${p.toString()}`;
  };

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-[13px] transition-colors ${
      active ? "border-black bg-black font-bold text-white" : "border-gray-300 bg-white text-gray-600 hover:border-gray-500"
    }`;

  const nameOf = (r: (typeof rows)[number]) =>
    r.partnership
      ? `${r.partnership.leader.firstName} ${r.partnership.leader.lastName} / ${r.partnership.follower.firstName} ${r.partnership.follower.lastName}`
      : `${r.athlete?.firstName ?? ""} ${r.athlete?.lastName ?? ""}`;
  const clubOf = (r: (typeof rows)[number]) =>
    r.partnership
      ? [r.partnership.club?.name, r.partnership.secondClub?.name].filter(Boolean).join(" · ")
      : r.athlete?.clubMemberships[0]?.club.name ?? "";
  const hrefOf = (r: (typeof rows)[number]) =>
    r.partnership ? `/couples/${r.partnershipId}` : `/athletes/${r.athleteId}`;

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-10 md:px-6 lg:pt-16">
      <h1 className="mt-8 text-3xl font-light uppercase tracking-wide text-gray-800 lg:mt-12 lg:text-[40px]">
        GNDSF ეროვნული რეიტინგი
      </h1>
      <p className="mt-3 max-w-3xl text-[14px] text-gray-500">
        ითვლება ბოლო 12 თვის ქულები. წყვილის რეიტინგში მხოლოდ ამ წყვილის ერთად მოპოვებული ქულებია.
      </p>

      <div className="mt-8 space-y-3">
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <Link key={f.key} href={link({ fmt: f.key })} className={chip(fmt === f.key)}>{f.label}</Link>
          ))}
          <span className="mx-2 hidden w-px bg-gray-200 sm:block" />
          {DISCIPLINES.map((d) => (
            <Link key={d} href={link({ disc: d })} className={chip(disc === d)}>{DISCIPLINE_LABELS[d]}</Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={link({ cat: undefined })} className={chip(!cat)}>ყველა ასაკი</Link>
          {CATEGORIES.map((c) => (
            <Link key={c} href={link({ cat: c })} className={chip(cat === c)}>{CATEGORY_LABELS[c]}</Link>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end border-b border-gray-100 pb-4">
        <Link href={link({ view: showTable ? undefined : "table" })} className="flex items-center gap-3 text-[14px] font-bold text-gray-800 hover:text-black">
          <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-[3px] border ${showTable ? "border-[#c49a5b] bg-[#c49a5b]" : "border-gray-300 bg-white"}`}>
            {showTable && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            )}
          </span>
          ცხრილად ჩვენება
        </Link>
      </div>

      {groups.length === 0 && (
        <div className="mt-16 rounded-xl border border-gray-100 bg-gray-50 py-12 text-center text-gray-500">
          ამ ფილტრით რეიტინგი ცარიელია — შედეგები ჯერ არ არის შეყვანილი.
        </div>
      )}

      {groups.map((g) => (
        <section key={g.cat} className="mt-12">
          <h2 className="text-[22px] font-light uppercase tracking-wide text-gray-800">
            {CATEGORY_LABELS[g.cat]} · {DISCIPLINE_LABELS[disc]} · {fmt === "COUPLE" ? "წყვილები" : "სოლო"}
          </h2>

          {!showTable ? (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {g.rows.map((r) => (
                <Link key={r.id} href={hrefOf(r)} className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {r.partnership ? <CouplePhoto couple={r.partnership} /> : r.athlete ? <AthletePhoto athlete={r.athlete} /> : null}
                    <span className="absolute left-3 top-3 flex h-10 min-w-10 items-center justify-center rounded-full bg-white/90 px-2 text-[16px] font-black text-black shadow">
                      {r.position}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="text-[15px] font-bold leading-tight text-gray-900">{nameOf(r)}</div>
                    <div className="mt-1 text-[13px] text-gray-500">{clubOf(r)}</div>
                    <div className="mt-auto flex items-end justify-between pt-4">
                      <div className="text-[13px] text-gray-500">
                        ქულა: <span className="text-[15px] font-bold text-gray-900">{fmtPoints(r.totalPoints)}</span>
                      </div>
                      <Movement position={r.position} prev={r.prevPosition} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="border-b-[2px] border-t-[2px] border-[#c49a5b]">
                  <tr>
                    <th className="w-20 px-4 py-4 font-bold">ადგილი</th>
                    <th className="w-20 px-4 py-4 font-bold">ცვლ.</th>
                    <th className="px-4 py-4 font-bold">{fmt === "COUPLE" ? "წყვილი" : "ათლეტი"}</th>
                    <th className="px-4 py-4 font-bold">კლუბი</th>
                    <th className="w-24 px-4 py-4 text-right font-bold">ქულა</th>
                  </tr>
                </thead>
                <tbody className="border-b-[2px] border-[#c49a5b]">
                  {g.rows.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 0 ? "bg-gray-50/60" : "bg-white"}>
                      <td className="px-4 py-3 font-bold tabular-nums">{r.position}</td>
                      <td className="px-4 py-3"><Movement position={r.position} prev={r.prevPosition} /></td>
                      <td className="px-4 py-3 font-medium">
                        <Link href={hrefOf(r)} className="text-[#a27a3f] hover:underline">{nameOf(r)}</Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{clubOf(r)}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">{fmtPoints(r.totalPoints)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
