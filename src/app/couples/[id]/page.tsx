import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { CATEGORY_LABELS, DISCIPLINE_LABELS, fmtDate } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function CouplePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db.partnership.findUnique({
    where: { id },
    include: {
      leader: true,
      follower: true,
      entries: {
        include: { event: { include: { competition: true } }, result: true },
        orderBy: { event: { competition: { startDate: "desc" } } },
      },
      rankingEntries: true,
    },
  });
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 pt-12">
      <div className="rounded-lg border border-line bg-coal p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.25em] text-wine">
          {p.endDate ? "ყოფილი წყვილი" : "მოქმედი წყვილი"}
        </div>
        <h1 className="mt-2 text-3xl font-bold">
          <Link href={`/athletes/${p.leaderId}`} className="hover:text-flame">{p.leader.firstName} {p.leader.lastName}</Link>
          {" · "}
          <Link href={`/athletes/${p.followerId}`} className="hover:text-flame">{p.follower.firstName} {p.follower.lastName}</Link>
        </h1>
        <div className="tnum mt-2 text-sm text-smoke">
          {fmtDate(p.startDate)} — {p.endDate ? fmtDate(p.endDate) : "დღემდე"}
        </div>
        {p.rankingEntries.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {p.rankingEntries.map((r) => (
              <span key={r.id} className="tnum rounded bg-wine/15 px-3 py-1 text-sm text-flame">
                #{r.position} · {CATEGORY_LABELS[r.ageCategory]} · {DISCIPLINE_LABELS[r.discipline]}
              </span>
            ))}
          </div>
        )}
      </div>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">შედეგები</h2>
        <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-coal">
          {p.entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <div className="font-medium">{e.event.competition.name}</div>
                <div className="mt-0.5 text-sm text-smoke">
                  {CATEGORY_LABELS[e.ageCategorySnapshot]} · {DISCIPLINE_LABELS[e.event.discipline]}
                </div>
              </div>
              <div className="tnum text-lg font-bold text-wine">
                {e.result ? `#${e.result.placement}` : "—"}
              </div>
            </li>
          ))}
          {p.entries.length === 0 && <li className="p-4 text-sm text-smoke">შედეგები ჯერ არ არის.</li>}
        </ul>
      </section>
    </div>
  );
}
