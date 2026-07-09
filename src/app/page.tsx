import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { CATEGORY_LABELS, DISCIPLINE_LABELS, fmtDate } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [topCouples, events, news] = await Promise.all([
    db.rankingEntry.findMany({
      where: { format: "COUPLE", position: { lte: 3 } },
      orderBy: [{ totalPoints: "desc" }],
      take: 3,
      include: {
        partnership: { include: { leader: true, follower: true } },
      },
    }),
    db.calendarEvent.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 3,
    }),
    db.news.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <>
      {/* Hero — the diagonal cut is the site's signature line */}
      <section className="diag relative overflow-hidden border-b border-line bg-coal">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/2 h-[560px] w-[560px] -translate-y-1/2 opacity-[0.07]"
        >
          <Image src="/brand/logo.png" alt="" fill className="object-contain" />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-20 md:pt-28">
          <p className="rise text-xs uppercase tracking-[0.3em] text-wine">
            gndsf.ge · ოფიციალური პლატფორმა
          </p>
          <h1 className="rise rise-1 mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            საქართველოს სპორტული ცეკვების{" "}
            <span className="text-wine">ეროვნული ფედერაცია</span>
          </h1>
          <p className="rise rise-2 mt-5 max-w-xl text-smoke">
            სპორტსმენების რეესტრი, შეჯიბრებების კალენდარი და ეროვნული
            რეიტინგი — ერთ სივრცეში, WDSF სტანდარტით.
          </p>
          <div className="rise rise-3 mt-8 flex flex-wrap gap-3">
            <Link
              href="/rankings"
              className="rounded bg-wine px-5 py-2.5 text-sm font-medium transition-colors hover:bg-flame"
            >
              ეროვნული რეიტინგი
            </Link>
            <Link
              href="/athletes"
              className="rounded border border-line px-5 py-2.5 text-sm text-smoke transition-colors hover:border-smoke hover:text-silver"
            >
              სპორტსმენების ბაზა
            </Link>
          </div>
        </div>
      </section>

      {/* Top couples */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">წამყვანი წყვილები</h2>
          <Link href="/rankings" className="text-sm text-smoke hover:text-silver">
            სრული რეიტინგი →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {topCouples.map((r) => (
            <Link
              key={r.id}
              href={`/couples/${r.partnershipId}`}
              className="group rounded-lg border border-line bg-coal p-5 transition-colors hover:border-wine"
            >
              <div className="tnum text-3xl font-bold text-wine">#{r.position}</div>
              <div className="mt-3 font-medium">
                {r.partnership!.leader.firstName} {r.partnership!.leader.lastName}
                {" · "}
                {r.partnership!.follower.firstName} {r.partnership!.follower.lastName}
              </div>
              <div className="mt-1 text-sm text-smoke">
                {CATEGORY_LABELS[r.ageCategory]} · {DISCIPLINE_LABELS[r.discipline]}
              </div>
              <div className="tnum mt-4 text-sm text-smoke">
                <span className="text-silver">{r.totalPoints}</span> ქულა
              </div>
            </Link>
          ))}
          {topCouples.length === 0 && (
            <p className="text-sm text-smoke">რეიტინგი ჯერ არ არის გამოქვეყნებული.</p>
          )}
        </div>
      </section>

      {/* Upcoming + news */}
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-16 md:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">უახლოესი შეჯიბრებები</h2>
            <Link href="/calendar" className="text-sm text-smoke hover:text-silver">
              კალენდარი →
            </Link>
          </div>
          <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-coal">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="mt-0.5 text-sm text-smoke">{e.city}</div>
                </div>
                <div className="text-right">
                  <div className="tnum text-sm">{fmtDate(e.date)}</div>
                  {e.isIntl && (
                    <span className="mt-1 inline-block rounded bg-wine/15 px-2 py-0.5 text-xs text-flame">
                      საერთაშორისო
                    </span>
                  )}
                </div>
              </li>
            ))}
            {events.length === 0 && (
              <li className="p-4 text-sm text-smoke">დაგეგმილი შეჯიბრება ჯერ არ არის.</li>
            )}
          </ul>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">სიახლეები</h2>
            <Link href="/news" className="text-sm text-smoke hover:text-silver">
              ყველა →
            </Link>
          </div>
          <ul className="mt-6 space-y-4">
            {news.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/news/${n.slug}`}
                  className="block rounded-lg border border-line bg-coal p-4 transition-colors hover:border-wine"
                >
                  <div className="text-xs text-smoke">{n.publishedAt && fmtDate(n.publishedAt)}</div>
                  <div className="mt-1 font-medium">{n.title}</div>
                  {n.excerpt && <p className="mt-1 text-sm text-smoke">{n.excerpt}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
