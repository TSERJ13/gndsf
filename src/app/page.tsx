import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/labels";

export const dynamic = "force-dynamic";

const KA_MONTHS_SHORT = ["IAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

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
      take: 5,
    }),
  ]);

  return (
    <div className="bg-white">
      {/* ══ LATEST NEWS ══ */}
      <section className="mx-auto max-w-[1400px] px-6 pt-16 lg:pt-24 pb-16">
        <h1 className="heading-display text-center text-4xl lg:text-5xl mb-14 motion-fade-up">
          ბოლო სიახლეები
        </h1>

        <div className="grid gap-8 md:grid-cols-2">
          {news.map((n, idx) => (
            <article 
              key={n.id} 
              className={`group hover-lift bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col motion-fade-up motion-delay-${idx + 1}`}
            >
              <Link href={`/news/${n.slug}`} className="block flex-1">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-50">
                  {n.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={n.coverUrl}
                      alt={n.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Image
                        src="/brand/logo.png"
                        alt="GNDSF"
                        width={100}
                        height={100}
                        className="opacity-10 grayscale"
                      />
                    </div>
                  )}
                </div>
                
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <h2 className="text-[22px] md:text-[26px] font-light leading-tight text-black mb-6">
                    {n.title}
                  </h2>
                  
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="tnum text-[15px] font-bold text-black">
                      {n.publishedAt && `${String(n.publishedAt.getDate()).padStart(2, '0')}/${String(n.publishedAt.getMonth() + 1).padStart(2, '0')}/${n.publishedAt.getFullYear()}`}
                    </span>
                    
                    <div className="flex gap-2">
                      <span className="rounded-full bg-[#f4f4f4] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#555]">
                        news
                      </span>
                      {n.excerpt && (
                        <span className="rounded-full bg-[#f4f4f4] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#555]">
                          {n.excerpt.substring(0, 10)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          ))}
          {news.length === 0 && (
            <p className="col-span-full text-center text-sm font-medium text-gray-400">
              სიახლეები მალე დაემატება.
            </p>
          )}
        </div>

        {/* Carousel arrows & View All */}
        <div className="mt-12 flex items-center justify-between border-t border-gray-100 pt-8 motion-fade-up motion-delay-3">
          <Link
            href="/news"
            className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-widest text-black transition-colors hover:text-[#B83A14]"
          >
            ყველა სიახლე
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>

          <div className="flex gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B83A14] text-white transition-opacity hover:opacity-80">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B83A14] text-white transition-opacity hover:opacity-80">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ══ UPCOMING EVENTS ══ */}
      <section className="bg-gray-50/50 py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto max-w-[1400px] px-6">
          <h2 className="heading-display text-center text-4xl lg:text-5xl mb-14 motion-fade-up">
            მომავალი ღონისძიებები
          </h2>

          <div className="grid gap-y-3 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-5">
            {events.map((e, idx) => (
              <div key={e.id} className={`flex items-center gap-4 lg:gap-6 motion-fade-up motion-delay-${(idx % 3) + 1}`}>
                {/* Stacked Date */}
                <div className="flex w-12 shrink-0 flex-col items-center justify-center">
                  <span className="tnum text-[32px] font-black leading-none text-black">
                    {e.date.getDate()}
                  </span>
                  <span className="mt-1 text-[13px] font-bold uppercase tracking-widest text-[#555]">
                    {KA_MONTHS_SHORT[e.date.getMonth()]}
                  </span>
                </div>
                
                {/* Event Pill */}
                <a
                  href={e.link ?? "/calendar"}
                  className={`group relative flex min-h-[76px] flex-1 items-center justify-between overflow-hidden rounded-full px-8 py-3 pr-14 text-white shadow-sm transition-all hover:scale-[1.01] hover:shadow-md ${
                    e.isIntl ? "bg-[#f06424]" : "bg-[#005eb8]"
                  }`}
                >
                  <span className="text-[15px] font-semibold tracking-wide md:text-[17px]">
                    {e.title} {e.city && `- ${e.city}`}
                  </span>
                  
                  <span className="hidden h-10 items-center justify-center rounded-full bg-white px-8 shadow-sm md:flex">
                    <span className="text-[11px] font-black uppercase tracking-wider text-black">
                      STANDARD, LATIN
                    </span>
                  </span>
                  
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 opacity-70 transition-transform group-hover:translate-x-1 group-hover:opacity-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </span>
                </a>
              </div>
            ))}
            {events.length === 0 && (
              <p className="col-span-full text-center text-sm font-medium text-gray-400">
                მომავალი ღონისძიებები ჯერ არ არის გამოცხადებული.
              </p>
            )}
          </div>

          <div className="mt-14 flex justify-center motion-fade-up motion-delay-3">
            <Link
              href="/calendar"
              className="rounded-full border-2 border-black bg-transparent px-10 py-3.5 text-[14px] font-bold uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white"
            >
              სრული კალენდარი
            </Link>
          </div>
        </div>
      </section>

      {/* ══ Premium Join Section ══ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-[1000px] px-6 text-center motion-fade-up">
          <Image src="/brand/logo.png" alt="" width={64} height={64} className="mx-auto mb-8 grayscale opacity-80" />
          <h2 className="heading-display text-3xl md:text-4xl mb-6">
            შემოუერთდი სპორტცეკვების ოჯახს
          </h2>
          <p className="text-gray-500 font-medium max-w-2xl mx-auto mb-10 text-[15px] leading-relaxed">
            დაარეგისტრირე შენი კლუბი, აიღე სპორტსმენის ლიცენზია და მიიღე გლობალური GID ნომერი. 
            გამოცადე საერთაშორისო სპორტცეკვების სტანდარტი საქართველოში.
          </p>
          <Link
            href="/contact"
            className="inline-block rounded-full bg-gradient-to-r from-[#8B1E0F] via-[#B83A14] to-[#4A0E05] px-10 py-4 text-[14px] font-bold uppercase tracking-widest text-white shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl"
          >
            დაწყება
          </Link>
        </div>
      </section>
    </div>
  );
}
