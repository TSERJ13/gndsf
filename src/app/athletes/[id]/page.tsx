import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  CATEGORY_LABELS,
  DISCIPLINE_LABELS,
  FORMAT_LABELS,
  categoryFor,
  fmtDate,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AthletePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const athlete = await db.athlete.findUnique({
    where: { id },
    include: {
      clubMemberships: { include: { club: true }, orderBy: { startDate: "desc" } },
      asLeader: {
        include: { follower: true },
        orderBy: { startDate: "desc" },
      },
      asFollower: {
        include: { leader: true },
        orderBy: { startDate: "desc" },
      },
      rankingPoints: { where: { validUntil: { gte: new Date() } } },
    },
  });
  if (!athlete) notFound();

  // Every entry this athlete was part of — solo, or via ANY partnership ever.
  // This is the payoff of the schema: partner changes cannot hide history.
  const entries = await db.entry.findMany({
    where: {
      OR: [
        { athleteId: id },
        { partnership: { OR: [{ leaderId: id }, { followerId: id }] } },
      ],
    },
    include: {
      event: { include: { competition: true } },
      partnership: { include: { leader: true, follower: true } },
      club: true,
      result: true,
    },
    orderBy: { event: { competition: { startDate: "desc" } } },
  });

  const activePoints = athlete.rankingPoints.reduce((s, p) => s + p.points, 0);
  const currentClub = athlete.clubMemberships.find((m) => !m.endDate)?.club;
  const partnerships = [
    ...athlete.asLeader.map((p) => ({ ...p, partner: p.follower })),
    ...athlete.asFollower.map((p) => ({ ...p, partner: p.leader })),
  ].sort((a, b) => +b.startDate - +a.startDate);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12">
      <div className="rounded-lg border border-line bg-coal p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-wine">
              GID {athlete.gid}
            </div>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              {athlete.firstName} {athlete.lastName}
            </h1>
            <div className="mt-2 text-sm text-smoke">
              {CATEGORY_LABELS[categoryFor(athlete.birthDate)]}
              {currentClub && <> · {currentClub.name}</>}
            </div>
          </div>
          <div className="text-right">
            <div className="tnum text-4xl font-bold text-wine">{activePoints}</div>
            <div className="text-xs uppercase tracking-wider text-smoke">
              მოქმედი ქულა
            </div>
          </div>
        </div>
      </div>

      {partnerships.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">პარტნიორობის ისტორია</h2>
          <ul className="mt-4 space-y-2">
            {partnerships.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-line bg-coal px-4 py-3 text-sm"
              >
                <span className="font-medium">
                  {p.partner.firstName} {p.partner.lastName}
                </span>
                <span className="tnum text-smoke">
                  {fmtDate(p.startDate)} — {p.endDate ? fmtDate(p.endDate) : "დღემდე"}
                  {!p.endDate && (
                    <span className="ml-3 rounded bg-wine/15 px-2 py-0.5 text-xs text-flame">
                      მოქმედი
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold">შეჯიბრებების ისტორია</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-coal text-left text-xs uppercase tracking-wider text-smoke">
              <tr>
                <th className="px-4 py-3">შეჯიბრება</th>
                <th className="px-4 py-3">კატეგორია</th>
                <th className="px-4 py-3">პარტნიორი</th>
                <th className="px-4 py-3">კლუბი</th>
                <th className="px-4 py-3 text-right">ადგილი</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {entries.map((e) => {
                const partner = e.partnership
                  ? e.partnership.leaderId === id
                    ? e.partnership.follower
                    : e.partnership.leader
                  : null;
                return (
                  <tr key={e.id} className="transition-colors hover:bg-coal">
                    <td className="px-4 py-3">
                      <div className="font-medium">{e.event.competition.name}</div>
                      <div className="tnum text-xs text-smoke">
                        {fmtDate(e.event.competition.startDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-smoke">
                      {CATEGORY_LABELS[e.ageCategorySnapshot]} ·{" "}
                      {DISCIPLINE_LABELS[e.event.discipline]} ·{" "}
                      {FORMAT_LABELS[e.event.format]}
                    </td>
                    <td className="px-4 py-3 text-smoke">
                      {partner ? `${partner.firstName} ${partner.lastName}` : "სოლო"}
                    </td>
                    <td className="px-4 py-3 text-smoke">{e.club?.name ?? "—"}</td>
                    <td className="tnum px-4 py-3 text-right font-semibold">
                      {e.result ? `#${e.result.placement}` : "—"}
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-smoke">
                    შეჯიბრებებში მონაწილეობა ჯერ არ არის დაფიქსირებული.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-smoke">
          ისტორია ინახება უცვლელად — პარტნიორის ან კლუბის შეცვლა წარსულ
          შედეგებზე არ აისახება.
        </p>
      </section>

      <div className="mt-10">
        <Link href="/athletes" className="text-sm text-smoke hover:text-silver">
          ← სპორტსმენების ბაზა
        </Link>
      </div>
    </div>
  );
}
