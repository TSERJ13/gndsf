import Link from "next/link";
import { db } from "@/lib/db";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  DISCIPLINE_LABELS,
  FORMAT_LABELS,
} from "@/lib/labels";
import type { AgeCategory, Discipline, Format } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "ეროვნული რეიტინგი" };

type Search = { cat?: string; disc?: string; fmt?: string; view?: string };

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const cat = (sp.cat as AgeCategory) || undefined;
  const disc = (sp.disc as Discipline) || "LATIN";
  const fmt = (sp.fmt as Format) || "COUPLE";

  const view = sp.view || "grid";
  const showTable = view === "table";

  let rows: any[] = [];
  try {
    rows = await db.rankingEntry.findMany({
      where: { discipline: disc, format: fmt, ...(cat ? { ageCategory: cat } : {}) },
      orderBy: [{ ageCategory: "asc" }, { position: "asc" }],
      include: {
        athlete: true,
        partnership: { include: { leader: true, follower: true } },
      },
    });
  } catch (err) {
    console.error("RankingsPage DB error:", err);
  }

  const link = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    const next = { cat: sp.cat, disc, fmt, view: sp.view, ...patch };
    if (next.cat) p.set("cat", next.cat);
    if (next.disc) p.set("disc", next.disc);
    if (next.fmt) p.set("fmt", next.fmt);
    if (next.view) p.set("view", next.view);
    return `/rankings?${p.toString()}`;
  };

  const WDSFSelect = ({ active, label, href }: { active: boolean; label: string; href: string }) => (
    <Link 
      href={href} 
      className={`flex h-11 items-center justify-between border px-4 min-w-[140px] text-[13px] transition-colors ${
        active ? 'border-gray-400 bg-gray-50 text-black font-bold' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
      }`}
    >
      <span>{label}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 ml-4"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </Link>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-10 lg:pt-16 motion-fade-up pb-24">
      {/* Heading */}
      <h1 className="text-3xl lg:text-[40px] font-light uppercase tracking-wide text-gray-800 mt-8 lg:mt-12">
        GNDSF ეროვნული რეიტინგი
      </h1>

      {/* Filters mimicking WDSF Dropdowns */}
      <div className="mt-10 flex flex-wrap gap-4 items-center">
        {(["LATIN", "STANDARD"] as const).map((d) => (
          <WDSFSelect key={d} active={disc === d} label={DISCIPLINE_LABELS[d]} href={link({ disc: d })} />
        ))}
        {(["COUPLE", "SOLO"] as const).map((f) => (
          <WDSFSelect key={f} active={fmt === f} label={FORMAT_LABELS[f]} href={link({ fmt: f })} />
        ))}
        <WDSFSelect active={!cat} label="ყველა ასაკი" href={link({ cat: undefined })} />
        {CATEGORIES.map((c) => (
          <WDSFSelect key={c} active={cat === c} label={CATEGORY_LABELS[c]} href={link({ cat: c })} />
        ))}
      </div>

      {/* Toggles and Advanced Filters Row */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-6 border-b border-gray-100 pb-6">
        <Link 
          href={link({ view: showTable ? "grid" : "table" })} 
          className="flex items-center gap-3 text-[14px] font-bold text-gray-800 hover:text-black cursor-pointer"
        >
          <div className={`flex h-[18px] w-[18px] items-center justify-center rounded-[3px] border ${showTable ? 'border-[#c49a5b] bg-[#c49a5b]' : 'border-gray-300 bg-white'}`}>
            {showTable && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
          </div>
          Show as table
        </Link>
        <button className="flex items-center gap-2 text-[14px] font-bold text-gray-800 hover:text-black">
          Advanced filter
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      {rows.length === 0 && (
        <div className="mt-16 text-center text-gray-500 py-12 border border-gray-100 rounded-xl bg-gray-50">
          ამ ფილტრით რეიტინგი ცარიელია — შედეგები ჯერ არ არის შეყვანილი.
        </div>
      )}

      {/* Grid View */}
      {!showTable && rows.length > 0 && (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {rows.map((r) => {
            const href = r.partnership ? `/couples/${r.partnershipId}` : `/athletes/${r.athleteId}`;
            return (
              <Link key={r.id} href={href} className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full cursor-pointer">
                {/* Images */}
                {r.partnership ? (
                <div className="flex gap-2 mb-5">
                  <div className="flex-1 aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center relative border border-gray-100">
                    <svg width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
                      <path d="M 20 26 C 20 44, 44 44, 44 26" />
                      <path d="M 20 26 C 24 18, 28 26, 32 22 C 36 18, 40 24, 44 26 C 44 6, 20 6, 20 26 Z" />
                    </svg>
                  </div>
                  <div className="flex-1 aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center relative border border-gray-100">
                    <svg width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
                      <path d="M 22 32 C 22 46, 42 46, 42 32" />
                      <path d="M 16 46 L 22 40 C 20 30, 28 22, 32 18 C 36 22, 44 30, 42 40 L 48 46 L 46 24 C 46 4, 18 4, 18 24 Z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-1/2 aspect-[3/4] bg-gray-50 rounded-xl mx-auto mb-5 overflow-hidden flex items-center justify-center relative border border-gray-100">
                  <svg width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
                    {r.athlete?.gender === "FEMALE" ? (
                      <>
                        <path d="M 22 32 C 22 46, 42 46, 42 32" />
                        <path d="M 16 46 L 22 40 C 20 30, 28 22, 32 18 C 36 22, 44 30, 42 40 L 48 46 L 46 24 C 46 4, 18 4, 18 24 Z" />
                      </>
                    ) : (
                      <>
                        <path d="M 20 26 C 20 44, 44 44, 44 26" />
                        <path d="M 20 26 C 24 18, 28 26, 32 22 C 36 18, 40 24, 44 26 C 44 6, 20 6, 20 26 Z" />
                      </>
                    )}
                  </svg>
                </div>
              )}

              {/* Text */}
              <div className="flex-1 flex flex-col">
                <div className="font-bold text-[15px] leading-tight text-gray-900 mb-4">
                  {r.partnership ? (
                    <>
                      {r.partnership.leader.firstName} {r.partnership.leader.lastName} &<br />
                      {r.partnership.follower.firstName} {r.partnership.follower.lastName}
                    </>
                  ) : (
                    <>{r.athlete?.firstName} {r.athlete?.lastName}</>
                  )}
                </div>
                
                <div className="mt-auto space-y-1">
                  <div className="text-[13px] text-gray-500">Rank: <span className="text-gray-900">{r.position}.</span></div>
                  <div className="text-[13px] text-gray-500">Points: <span className="text-gray-900">{r.totalPoints}</span></div>
                  <div className="text-[13px] font-bold text-gray-900 mt-4 pt-4">Georgia (GEO)</div>
                </div>
              </div>
            </Link>
          )})}
        </div>
      )}

      {/* Table View */}
      {showTable && rows.length > 0 && (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="border-t-[2px] border-b-[2px] border-[#c49a5b]">
              <tr>
                <th className="py-4 px-4 font-bold text-black w-24">Rank</th>
                <th className="py-4 px-4 font-bold text-black w-24">Points</th>
                <th className="py-4 px-4 font-bold text-black">Name</th>
                <th className="py-4 px-4 font-bold text-black w-48">Country</th>
              </tr>
            </thead>
            <tbody className="border-b-[2px] border-[#c49a5b]">
              {rows.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? "bg-gray-50/60" : "bg-white"}>
                  <td className="py-4 px-4 text-gray-900">{r.position}</td>
                  <td className="py-4 px-4 text-gray-900">{r.totalPoints}</td>
                  <td className="py-4 px-4 font-medium">
                    {r.partnership ? (
                      <Link href={`/couples/${r.partnershipId}`} className="text-[#c49a5b] hover:underline">
                        {r.partnership.leader.firstName} {r.partnership.leader.lastName} / {r.partnership.follower.firstName} {r.partnership.follower.lastName}
                      </Link>
                    ) : (
                      <Link href={`/athletes/${r.athleteId}`} className="text-[#c49a5b] hover:underline">
                        {r.athlete?.firstName} {r.athlete?.lastName}
                      </Link>
                    )}
                  </td>
                  <td className="py-4 px-4 text-gray-900">Georgia (GEO)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
