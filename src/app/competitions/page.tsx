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
    <div className="mx-auto max-w-4xl px-4 pt-12">
      <h1 className="text-3xl font-bold">შეჯიბრებების შედეგები</h1>
      <p className="mt-2 text-sm text-smoke">
        ოფიციალური შედეგები ივენთების მიხედვით — გამოქვეყნებისთანავე.
      </p>

      {[...byYear].map(([year, list]) => (
        <section key={year} className="mt-10">
          <h2 className="tnum text-sm font-semibold uppercase tracking-[0.2em] text-smoke">
            {year}
          </h2>
          <ul className="mt-4 space-y-3">
            {list.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/competitions/${c.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-line bg-coal p-4 transition-colors hover:border-wine"
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-smoke">
                      <span>{c.city}</span>
                      <span className="tnum">{fmtDate(c.startDate)}</span>
                      <span className="rounded bg-wine/10 px-2 py-0.5 text-xs text-wine">
                        {TYPE_LABELS[c.type]}
                      </span>
                    </div>
                  </div>
                  <div className="tnum shrink-0 text-sm text-smoke">
                    {c._count.events} ივენთი →
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
