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

type Search = { cat?: string; disc?: string; fmt?: string };

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const cat = (sp.cat as AgeCategory) || undefined;
  const disc = (sp.disc as Discipline) || "LATIN";
  const fmt = (sp.fmt as Format) || "COUPLE";

  const rows = await db.rankingEntry.findMany({
    where: { discipline: disc, format: fmt, ...(cat ? { ageCategory: cat } : {}) },
    orderBy: [{ ageCategory: "asc" }, { position: "asc" }],
    include: {
      athlete: true,
      partnership: { include: { leader: true, follower: true } },
    },
  });

  const link = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    const next = { cat: sp.cat, disc, fmt, ...patch };
    if (next.cat) p.set("cat", next.cat);
    if (next.disc) p.set("disc", next.disc);
    if (next.fmt) p.set("fmt", next.fmt);
    return `/rankings?${p.toString()}`;
  };

  const pill = (active: boolean) =>
    `rounded px-3 py-1.5 text-sm transition-colors ${
      active
        ? "bg-wine font-medium text-silver"
        : "border border-line text-smoke hover:border-smoke hover:text-silver"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12">
      <h1 className="text-3xl font-bold">ეროვნული რეიტინგი</h1>
      <p className="mt-2 text-sm text-smoke">
        განახლდება ავტომატურად ყოველი შეჯიბრების შედეგების დამტკიცებისთანავე.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["LATIN", "STANDARD"] as const).map((d) => (
          <Link key={d} href={link({ disc: d })} className={pill(disc === d)}>
            {DISCIPLINE_LABELS[d]}
          </Link>
        ))}
        <span className="mx-2 h-5 w-px bg-line" />
        {(["COUPLE", "SOLO"] as const).map((f) => (
          <Link key={f} href={link({ fmt: f })} className={pill(fmt === f)}>
            {FORMAT_LABELS[f]}
          </Link>
        ))}
        <span className="mx-2 h-5 w-px bg-line" />
        <Link href={link({ cat: undefined })} className={pill(!cat)}>
          ყველა
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={link({ cat: c })} className={pill(cat === c)}>
            {CATEGORY_LABELS[c]}
          </Link>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead className="bg-coal text-left text-xs uppercase tracking-wider text-smoke">
            <tr>
              <th className="w-16 px-4 py-3">#</th>
              <th className="px-4 py-3">{fmt === "COUPLE" ? "წყვილი" : "სპორტსმენი"}</th>
              <th className="px-4 py-3">კატეგორია</th>
              <th className="px-4 py-3 text-right">ქულა</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-coal">
                <td className="tnum px-4 py-3 font-bold text-wine">{r.position}</td>
                <td className="px-4 py-3 font-medium">
                  {r.partnership ? (
                    <>
                      <Link href={`/athletes/${r.partnership.leaderId}`} className="hover:text-flame">
                        {r.partnership.leader.firstName} {r.partnership.leader.lastName}
                      </Link>
                      {" · "}
                      <Link href={`/athletes/${r.partnership.followerId}`} className="hover:text-flame">
                        {r.partnership.follower.firstName} {r.partnership.follower.lastName}
                      </Link>
                    </>
                  ) : (
                    <Link href={`/athletes/${r.athleteId}`} className="hover:text-flame">
                      {r.athlete!.firstName} {r.athlete!.lastName}
                    </Link>
                  )}
                </td>
                <td className="px-4 py-3 text-smoke">{CATEGORY_LABELS[r.ageCategory]}</td>
                <td className="tnum px-4 py-3 text-right font-semibold">{r.totalPoints}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-smoke">
                  ამ ფილტრით რეიტინგი ცარიელია — შედეგები ჯერ არ არის შეყვანილი.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
