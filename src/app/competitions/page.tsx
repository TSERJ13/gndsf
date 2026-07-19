import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "შედეგები" };

const TYPE_LABELS: Record<string, string> = {
  REGIONAL: "რეგიონული",
  NATIONAL: "ეროვნული",
  INTERNATIONAL: "საერთაშორისო",
};

export default async function CompetitionsPage() {
  const comps = await db.competition.findMany({
    where: { isPublished: true },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { events: true } } },
  });

  const byYear = new Map<number, typeof comps>();
  for (const c of comps) {
    const y = c.startDate.getFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(c);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-16">
      <h1 className="heading-display text-center text-3xl md:text-4xl">შეჯიბრებების შედეგები</h1>
      <p className="mt-4 text-center text-sm font-medium text-smoke">
        ოფიციალური შედეგები ივენთების მიხედვით — გამოქვეყნებისთანავე.
      </p>

      {[...byYear].map(([year, list]) => (
        <section key={year} className="mt-14">
          <h2 className="tnum text-sm font-black uppercase tracking-[0.25em] text-silver text-center md:text-left">
            {year}
          </h2>
          <ul className="mt-6 space-y-4">
            {list.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/competitions/${c.id}`}
                  className="group relative flex items-center justify-between overflow-hidden rounded-full border border-line bg-coal px-8 py-4 transition-colors hover:border-[#005eb8]"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:gap-6">
                    <div className="text-[17px] font-semibold text-silver transition-colors group-hover:text-[#005eb8]">
                      {c.name}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-smoke md:mt-0">
                      <span className="tnum font-bold">{fmtDate(c.startDate)}</span>
                      <span>·</span>
                      <span>{c.city}</span>
                      <span>·</span>
                      <span className="rounded-full bg-[#f0f0f0] px-3 py-0.5 text-[11px] font-black uppercase tracking-wide text-[#555] dark:bg-[#222] dark:text-[#aaa]">
                        {TYPE_LABELS[c.type]}
                      </span>
                    </div>
                  </div>
                  <div className="hidden tnum shrink-0 items-center gap-2 text-sm font-bold text-smoke transition-colors group-hover:text-[#005eb8] md:flex">
                    {c._count.events} ივენთი
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {comps.length === 0 && (
        <p className="mt-10 rounded-lg border border-line bg-coal p-6 text-sm text-smoke">
          გამოქვეყნებული შედეგები ჯერ არ არის.
        </p>
      )}
    </div>
  );
}
