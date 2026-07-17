import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAthlete } from "@/lib/rbac";
import {
  CATEGORY_LABELS,
  DISCIPLINE_LABELS,
  FORMAT_LABELS,
  categoryFor,
  categoryForYear,
  fmtDate,
} from "@/lib/labels";
import { uploadPhoto } from "./actions";
import { changeOwnPassword } from "@/app/admin/settings/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "სპორტსმენის კაბინეტი" };

export default async function CabinetPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; pok?: string; perror?: string }>;
}) {
  const user = await requireAthlete();
  const { ok, error, pok, perror } = await searchParams;

  const athlete = await db.athlete.findUniqueOrThrow({
    where: { id: user.athleteId },
    include: {
      clubMemberships: { include: { club: true }, orderBy: { startDate: "desc" } },
      asLeader: { include: { follower: true }, orderBy: { startDate: "desc" } },
      asFollower: { include: { leader: true }, orderBy: { startDate: "desc" } },
      rankingPoints: {
        where: { validUntil: { gte: new Date() } },
        include: { result: { include: { entry: { include: { event: { include: { competition: true } } } } } } },
        orderBy: { earnedAt: "desc" },
      },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  // rankings where this athlete appears — solo or via active partnership
  const rankings = await db.rankingEntry.findMany({
    where: {
      OR: [
        { athleteId: athlete.id },
        { partnership: { endDate: null, OR: [{ leaderId: athlete.id }, { followerId: athlete.id }] } },
      ],
    },
    include: { partnership: { include: { leader: true, follower: true } } },
    orderBy: { position: "asc" },
  });

  const entries = await db.entry.findMany({
    where: {
      OR: [
        { athleteId: athlete.id },
        { partnership: { OR: [{ leaderId: athlete.id }, { followerId: athlete.id }] } },
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
  const activePartner = [
    ...athlete.asLeader.filter((p) => !p.endDate).map((p) => p.follower),
    ...athlete.asFollower.filter((p) => !p.endDate).map((p) => p.leader),
  ][0];
  const bestPlacement = entries.reduce<number | null>(
    (best, e) => (e.result && (best === null || e.result.placement < best) ? e.result.placement : best),
    null,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12">
      {/* ── identity card ── */}
      <section className="rounded-lg border border-line bg-coal p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-line bg-ink">
            {athlete.photoUrl ? (
              <Image src={athlete.photoUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl font-bold text-line">
                {athlete.firstName[0]}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-[0.25em] text-wine">
              GID {athlete.gid} · სპორტსმენის კაბინეტი
            </div>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              {athlete.firstName} {athlete.lastName}
            </h1>
            <div className="mt-2 text-sm text-smoke">
              {CATEGORY_LABELS[categoryFor(athlete.birthDate)]}
              {currentClub && <> · {currentClub.name}</>}
              {activePartner && (
                <> · პარტნიორი: {activePartner.firstName} {activePartner.lastName}</>
              )}
            </div>
            {(() => {
              const y = new Date().getFullYear();
              const now = categoryForYear(athlete.birthDate, y);
              const next = categoryForYear(athlete.birthDate, y + 1);
              return now !== next ? (
                <p className="mt-2 rounded border border-wine/40 bg-wine/5 px-3 py-1.5 text-xs text-wine">
                  {y + 1} წლის 1 იანვრიდან გადადიხართ კატეგორიაში: <b>{CATEGORY_LABELS[next]}</b>
                </p>
              ) : null;
            })()}
            <div className="mt-4">
              <Link
                href="/cabinet/card"
                className="inline-block rounded bg-wine px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-flame"
              >
                ჩემი ციფრული ბარათი →
              </Link>
            </div>
            <form action={uploadPhoto} className="mt-4 flex flex-wrap items-center gap-3">
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                required
                className="text-sm text-smoke file:mr-3 file:rounded file:border file:border-line file:bg-ink file:px-3 file:py-1.5 file:text-sm file:text-silver hover:file:border-smoke"
              />
              <button className="rounded bg-wine px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-flame">
                ფოტოს ატვირთვა
              </button>
            </form>
            {ok === "photo" && (
              <p className="mt-2 text-sm text-green-400">ფოტო განახლდა.</p>
            )}
            {error && (
              <p className="mt-2 text-sm text-flame">
                {error === "type"
                  ? "დაშვებულია მხოლოდ JPG, PNG ან WebP."
                  : error === "size"
                    ? "ფაილი 4 MB-ზე დიდია."
                    : error === "storage"
                      ? "ფოტოს ატვირთვა დროებით მიუწვდომელია — მიმართეთ ფედერაციას."
                      : "აირჩიეთ ფაილი."}
              </p>
            )}
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-6 text-center md:text-right">
            <div>
              <div className="tnum text-3xl font-bold text-wine">{activePoints}</div>
              <div className="text-xs uppercase tracking-wider text-smoke">მოქმედი ქულა</div>
            </div>
            <div>
              <div className="tnum text-3xl font-bold">{entries.length}</div>
              <div className="text-xs uppercase tracking-wider text-smoke">სტარტი</div>
            </div>
            <div>
              <div className="tnum text-3xl font-bold">
                {bestPlacement ? `#${bestPlacement}` : "—"}
              </div>
              <div className="text-xs uppercase tracking-wider text-smoke">საუკეთესო</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── current rankings ── */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">ჩემი რეიტინგი</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rankings.map((r) => (
            <div key={r.id} className="rounded-lg border border-line bg-coal p-5">
              <div className="flex items-baseline gap-2">
                <span className="tnum text-3xl font-bold text-wine">#{r.position}</span>
                {r.prevPosition && r.prevPosition !== r.position && (
                  <span className={`tnum text-sm ${r.position < r.prevPosition ? "text-green-400" : "text-flame"}`}>
                    {r.position < r.prevPosition ? "▲" : "▼"}
                    {Math.abs(r.prevPosition - r.position)}
                  </span>
                )}
              </div>
              <div className="mt-2 text-sm">
                {CATEGORY_LABELS[r.ageCategory]} · {DISCIPLINE_LABELS[r.discipline]} ·{" "}
                {FORMAT_LABELS[r.format]}
              </div>
              <div className="tnum mt-1 text-sm text-smoke">{r.totalPoints} ქულა</div>
            </div>
          ))}
          {rankings.length === 0 && (
            <p className="text-sm text-smoke">
              რეიტინგში ჯერ არ ხართ — პირველი შეჯიბრების შემდეგ აქ გამოჩნდება.
            </p>
          )}
        </div>
      </section>

      {/* ── points breakdown ── */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">ქულების დეტალიზაცია</h2>
        <p className="mt-1 text-sm text-smoke">მხოლოდ მოქმედი (12 თვის) ქულები.</p>
        <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-coal">
          {athlete.rankingPoints.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 p-4 text-sm">
              <div>
                <div className="font-medium">
                  {p.result.entry.event.competition.name}
                </div>
                <div className="tnum mt-0.5 text-xs text-smoke">
                  {fmtDate(p.earnedAt)} · მოქმედებს {fmtDate(p.validUntil)}-მდე
                </div>
              </div>
              <div className="tnum text-lg font-bold text-wine">+{p.points}</div>
            </li>
          ))}
          {athlete.rankingPoints.length === 0 && (
            <li className="p-4 text-sm text-smoke">მოქმედი ქულები არ არის.</li>
          )}
        </ul>
      </section>

      {/* ── competition history ── */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">ტურნირების ისტორია</h2>
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
                  ? e.partnership.leaderId === athlete.id
                    ? e.partnership.follower
                    : e.partnership.leader
                  : null;
                return (
                  <tr key={e.id} className="transition-colors hover:bg-coal">
                    <td className="px-4 py-3">
                      <Link
                        href={`/competitions/${e.event.competitionId}`}
                        className="font-medium hover:text-wine"
                      >
                        {e.event.competition.name}
                      </Link>
                      <div className="tnum text-xs text-smoke">
                        {fmtDate(e.event.competition.startDate)} · {e.event.competition.city}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-smoke">
                      {CATEGORY_LABELS[e.ageCategorySnapshot]} ·{" "}
                      {DISCIPLINE_LABELS[e.event.discipline]}
                    </td>
                    <td className="px-4 py-3 text-smoke">
                      {partner ? `${partner.firstName} ${partner.lastName}` : "სოლო"}
                    </td>
                    <td className="px-4 py-3 text-smoke">{e.club?.name ?? "—"}</td>
                    <td className="tnum px-4 py-3 text-right text-lg font-bold">
                      {e.result ? `#${e.result.placement}` : "—"}
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-smoke">
                    შეჯიბრებებში ჯერ არ მიგიღიათ მონაწილეობა.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <Link href={`/athletes/${athlete.id}`} className="text-sm text-smoke hover:text-silver">
            ჩემი საჯარო პროფილი →
          </Link>
        </div>
      </section>

      {/* ── athlete documents ── */}
      {athlete.documents.length > 0 && (
        <section className="mt-10 max-w-xl">
          <h2 className="text-xl font-semibold">ჩემი დოკუმენტები</h2>
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-coal">
            {athlete.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <a href={d.url} target="_blank" className="font-medium hover:text-wine">{d.name}</a>
                <span className="tnum shrink-0 text-xs text-smoke">{fmtDate(d.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── account settings ── */}
      <section className="mt-10 max-w-md">
        <h2 className="text-xl font-semibold">ანგარიშის პარამეტრები</h2>
        {pok && <p className="mt-3 text-sm text-green-400">პაროლი შეიცვალა.</p>}
        {perror && (
          <p className="mt-3 text-sm text-flame">
            {perror === "wrong" ? "მიმდინარე პაროლი არასწორია." : "ახალი პაროლი მინიმუმ 8 სიმბოლო."}
          </p>
        )}
        <form action={changeOwnPassword} className="mt-4 space-y-4 rounded-lg border border-line bg-coal p-5">
          <div>
            <label className="text-xs uppercase tracking-wider text-smoke" htmlFor="current">
              მიმდინარე პაროლი
            </label>
            <input
              id="current" name="current" type="password" required autoComplete="current-password"
              className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-wine"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-smoke" htmlFor="next">
              ახალი პაროლი
            </label>
            <input
              id="next" name="next" type="password" minLength={8} required autoComplete="new-password"
              className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-wine"
            />
          </div>
          <button className="rounded bg-wine px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-flame">
            შეცვლა
          </button>
        </form>
      </section>
    </div>
  );
}
