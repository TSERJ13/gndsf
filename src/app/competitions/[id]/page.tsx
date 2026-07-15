import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  CATEGORY_LABELS,
  DISCIPLINE_LABELS,
  FORMAT_LABELS,
  fmtDate,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await db.competition.findUnique({ where: { id, isPublished: true } });
  if (!c) return { title: "შეჯიბრება" };
  return {
    title: `${c.name} — შედეგები`,
    description: `${c.name}, ${c.city} — ოფიციალური შედეგები ივენთების მიხედვით.`,
  };
}

const TYPE_LABELS: Record<string, string> = {
  REGIONAL: "რეგიონული",
  NATIONAL: "ეროვნული",
  INTERNATIONAL: "საერთაშორისო",
};

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comp = await db.competition.findUnique({
    where: { id, isPublished: true },
    include: {
      events: {
        orderBy: [{ ageCategory: "asc" }, { discipline: "asc" }, { format: "asc" }],
        include: {
          entries: {
            include: {
              athlete: true,
              partnership: { include: { leader: true, follower: true } },
              club: true,
              result: true,
            },
          },
        },
      },
    },
  });
  if (!comp) notFound();

  const medal = (place: number) =>
    place === 1
      ? "text-wine font-bold"
      : place === 2 || place === 3
        ? "font-semibold"
        : "text-smoke";

  return (
    <div className="mx-auto max-w-4xl px-4 pt-12">
      <Link href="/competitions" className="text-sm text-smoke hover:text-wine">
        ← ყველა შეჯიბრება
      </Link>
      <div className="mt-4 rounded-lg border border-line bg-coal p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.25em] text-wine">
          {TYPE_LABELS[comp.type]} შეჯიბრება
        </div>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{comp.name}</h1>
        <div className="tnum mt-2 text-sm text-smoke">
          {comp.city}
          {comp.venue && <> · {comp.venue}</>} · {fmtDate(comp.startDate)}
        </div>
      </div>

      <div className="mt-10 space-y-10">
        {comp.events.map((ev) => {
          const rows = ev.entries
            .filter((e) => e.result)
            .sort((a, b) => a.result!.placement - b.result!.placement);
          if (rows.length === 0) return null;
          return (
            <section key={ev.id}>
              <h2 className="text-lg font-semibold">
                {CATEGORY_LABELS[ev.ageCategory]} · {DISCIPLINE_LABELS[ev.discipline]} ·{" "}
                {FORMAT_LABELS[ev.format]}
              </h2>
              <div className="mt-3 overflow-x-auto rounded-lg border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-coal text-left text-xs uppercase tracking-wider text-smoke">
                    <tr>
                      <th className="w-16 px-4 py-3">ადგილი</th>
                      <th className="px-4 py-3">
                        {ev.format === "COUPLE" ? "წყვილი" : "სპორტსმენი"}
                      </th>
                      <th className="px-4 py-3">კლუბი</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((e) => (
                      <tr key={e.id} className="transition-colors hover:bg-coal">
                        <td className={`tnum px-4 py-3 text-lg ${medal(e.result!.placement)}`}>
                          {e.result!.placement}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {e.partnership ? (
                            <>
                              <Link
                                href={`/athletes/${e.partnership.leaderId}`}
                                className="hover:text-wine"
                              >
                                {e.partnership.leader.firstName} {e.partnership.leader.lastName}
                              </Link>
                              {" · "}
                              <Link
                                href={`/athletes/${e.partnership.followerId}`}
                                className="hover:text-wine"
                              >
                                {e.partnership.follower.firstName}{" "}
                                {e.partnership.follower.lastName}
                              </Link>
                            </>
                          ) : (
                            <Link href={`/athletes/${e.athleteId}`} className="hover:text-wine">
                              {e.athlete?.firstName} {e.athlete?.lastName}
                            </Link>
                          )}
                        </td>
                        <td className="px-4 py-3 text-smoke">{e.club?.name ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
        {comp.events.every((ev) => ev.entries.every((e) => !e.result)) && (
          <p className="rounded-lg border border-line bg-coal p-6 text-sm text-smoke">
            შედეგები მალე გამოქვეყნდება.
          </p>
        )}
      </div>
    </div>
  );
}
