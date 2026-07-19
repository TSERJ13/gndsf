import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/labels";

export const dynamic = "force-dynamic";

const KA_MONTHS_SHORT = ["იან","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];

export default async function Home() {
  const [news, events] = await Promise.all([
    db.news.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 2,
    }),
    db.calendarEvent.findMany({
      where: { date: { gte: new Date(Date.now() - 864e5) } },
      orderBy: { date: "asc" },
      take: 6,
    }),
  ]);

  return (
    <>
      {/* ══ LATEST NEWS ══ */}
      <section className="mx-auto max-w-[1400px] px-6 pt-14">
        <h1 className="heading-display text-center text-3xl md:text-4xl">
          ბოლო სიახლეები
        </h1>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          {news.map((n) => (
            <article key={n.id} className="group">
              <Link href={`/news/${n.slug}`} className="block">
                <div className="relative aspect-[16/9] overflow-hidden bg-coal">
                  {n.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={n.coverUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-coal via-ink to-coal">
                      <Image
                        src="/brand/logo.png"
                        alt=""
                        width={160}
                        height={160}
                        className="opacity-15"
                      />
                    </div>
                  )}
                </div>
                <h2 className="mt-5 text-[20px] font-light leading-snug text-silver md:text-[24px]">
                  {n.title}
                </h2>
              </Link>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="tnum text-[15px] font-bold text-silver">
                  {n.publishedAt && `${String(n.publishedAt.getDate()).padStart(2, '0')}/${String(n.publishedAt.getMonth() + 1).padStart(2, '0')}/${n.publishedAt.getFullYear()}`}
                </span>
                
                {/* WDSF-style lowercase gray pill tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#f0f0f0] px-3 py-1 text-xs font-bold text-[#555] transition-colors hover:bg-[#e0e0e0]">
                    სიახლე
                  </span>
                  {n.excerpt && (
                    <span className="rounded-full bg-[#f0f0f0] px-3 py-1 text-xs font-bold text-[#555] transition-colors hover:bg-[#e0e0e0]">
                      {n.excerpt.substring(0, 15)}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
          {news.length === 0 && (
            <p className="col-span-full text-center text-sm text-smoke">
              სიახლეები მალე დაემატება.
            </p>
          )}
        </div>

        {/* WDSF-style carousel arrows at bottom right */}
        <div className="mt-8 flex justify-end gap-3 border-b border-line pb-8">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b28b57] text-white transition-opacity hover:opacity-80">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b28b57] text-white transition-opacity hover:opacity-80">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Link
            href="/news"
            className="flex items-center gap-1.5 text-[14px] font-bold text-silver transition-colors hover:text-gold"
          >
            ყველა სიახლე
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ══ UPCOMING EVENTS ══ */}
      <section className="mx-auto max-w-[1400px] px-6 pt-20">
        <h2 className="heading-display text-center text-3xl md:text-4xl">
          მომავალი შეჯიბრებები
        </h2>

        <div className="mt-14 grid gap-x-12 gap-y-4 lg:grid-cols-2">
          {events.map((e) => (
            <div key={e.id} className="flex items-center gap-4">
              {/* Stacked Date on the far left */}
              <div className="flex w-10 shrink-0 flex-col items-center justify-center">
                <span className="tnum text-[28px] font-black leading-none text-silver">
                  {e.date.getDate()}
                </span>
                <span className="mt-1 text-[13px] font-semibold text-smoke">
                  {KA_MONTHS_SHORT[e.date.getMonth()]}
                </span>
              </div>
              
              {/* WDSF-style outer pill */}
              <a
                href={e.link ?? "/calendar"}
                className={`relative flex min-h-[72px] flex-1 items-center justify-between overflow-hidden rounded-full px-6 py-2 pr-12 text-white transition-opacity hover:opacity-95 ${
                  e.isIntl ? "bg-[#f06424]" : "bg-[#005eb8]"
                }`}
              >
                {/* Event Title */}
                <span className="text-[15px] font-semibold tracking-wide md:text-[16px]">
                  {e.title} {e.city && `- ${e.city}`}
                </span>
                
                {/* Inner white pill for categories */}
                <span className="hidden h-9 items-center justify-center rounded-full bg-white px-6 shadow-sm md:flex">
                  <span className="text-[11px] font-black uppercase tracking-wider text-black">
                    STANDARD, LATIN
                  </span>
                </span>
                
                {/* Right chevron arrow */}
                <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-80">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </a>
            </div>
          ))}
          {events.length === 0 && (
            <p className="col-span-full text-center text-sm text-smoke">
              მომავალი შეჯიბრებები მალე გამოცხადდება.
            </p>
          )}
        </div>

        <div className="mt-10 flex justify-end border-b border-line pb-8">
          <Link
            href="/calendar"
            className="flex items-center gap-1.5 text-[14px] font-bold text-silver transition-colors hover:text-gold"
          >
            სრული კალენდარი
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ══ membership CTA (brand band) ══ */}
      <section className="mx-auto max-w-[1400px] px-6 pt-20">
        <div className="diag relative overflow-hidden rounded-lg bg-wine px-6 py-12 text-white md:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-1/2 h-[320px] w-[320px] -translate-y-1/2 opacity-[0.12]"
          >
            <Image src="/brand/logo.png" alt="" fill className="object-contain brightness-0 invert" />
          </div>
          <h2 className="max-w-lg text-2xl font-bold md:text-3xl">
            შემოუერთდი საქართველოს სპორტული ცეკვების ოჯახს
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/80">
            კლუბის რეგისტრაცია, სპორტსმენის ლიცენზირება და GID ნომერი — ერთი
            მიმართვით.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded bg-white px-5 py-2.5 text-sm font-medium text-wine transition-opacity hover:opacity-90"
          >
            დაგვიკავშირდი
          </Link>
        </div>
      </section>
    </>
  );
}
