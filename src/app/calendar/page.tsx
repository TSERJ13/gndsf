import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "კალენდარი" };

const KA_MONTHS = [
  "იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი",
  "ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი",
];
const KA_MONTHS_SHORT = ["იან","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];

function daysUntil(d: Date) {
  return Math.ceil((+d - Date.now()) / 864e5);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const { f } = await searchParams;
  const filter = f === "intl" ? { isIntl: true } : f === "geo" ? { isIntl: false } : {};

  const events = await db.calendarEvent.findMany({
    where: filter,
    orderBy: { date: "asc" },
  });
  const upcoming = events.filter((e) => +e.date >= Date.now() - 864e5);
  const past = events.filter((e) => +e.date < Date.now() - 864e5).reverse().slice(0, 6);

  // group upcoming by "YYYY-MM"
  const groups = new Map<string, typeof upcoming>();
  for (const e of upcoming) {
    const key = `${e.date.getFullYear()}-${e.date.getMonth()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  const nearestId = upcoming[0]?.id;

  const pill = (active: boolean) =>
    `rounded-full px-5 py-2 text-sm font-bold transition-colors ${
      active
        ? "bg-[#005eb8] text-white"
        : "border border-line bg-coal text-smoke hover:border-[#005eb8] hover:text-[#005eb8]"
    }`;

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-16">
      <h1 className="heading-display text-center text-3xl md:text-4xl">შეჯიბრებების კალენდარი</h1>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/calendar" className={pill(!f)}>ყველა</Link>
        <Link href="/calendar?f=geo" className={pill(f === "geo")}>საქართველო</Link>
        <Link href="/calendar?f=intl" className={pill(f === "intl")}>საერთაშორისო</Link>
      </div>

      {[...groups].map(([key, list]) => {
        const [y, m] = key.split("-").map(Number);
        return (
          <section key={key} className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-smoke">
              {KA_MONTHS[m]} {y}
            </h2>
            <ul className="mt-6 space-y-4">
              {list.map((e) => {
                const dd = daysUntil(e.date);
                const isNearest = e.id === nearestId;
                return (
                  <li key={e.id} className="flex items-center gap-4">
                    {/* Stacked Date on the far left */}
                    <div className="flex w-12 shrink-0 flex-col items-center justify-center">
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
                      } ${isNearest ? "ring-2 ring-offset-2 ring-wine ring-offset-ink" : ""}`}
                    >
                      {/* Event Title */}
                      <span className="text-[15px] font-semibold tracking-wide md:text-[16px]">
                        {e.title} {e.city && `- ${e.city}`}
                      </span>
                      
                      <div className="hidden shrink-0 items-center gap-3 md:flex">
                        {isNearest && dd >= 0 && (
                          <span className="tnum text-[11px] font-bold uppercase tracking-wider text-white/90">
                            {dd === 0 ? "დღეს" : dd === 1 ? "ხვალ" : `${dd} დღეში`}
                          </span>
                        )}
                        
                        {/* Inner white pill for categories */}
                        <span className="flex h-9 items-center justify-center rounded-full bg-white px-6 shadow-sm">
                          <span className="text-[11px] font-black uppercase tracking-wider text-black">
                            {e.isIntl ? "INTERNATIONAL" : "NATIONAL"}
                          </span>
                        </span>
                      </div>
                      
                      {/* Right chevron arrow */}
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-80">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {upcoming.length === 0 && (
        <p className="mt-10 rounded-lg border border-line bg-coal p-6 text-sm text-smoke">
          ამ ფილტრით მომავალი შეჯიბრება არ არის — სცადეთ „ყველა“.
        </p>
      )}

      {past.length > 0 && (
        <section className="mt-14">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-smoke">
            გასული შეჯიბრებები
          </h2>
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-coal opacity-75">
            {past.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="font-medium">{e.title}</span>
                <span className="tnum text-smoke">
                  {e.date.getDate()} {KA_MONTHS_SHORT[e.date.getMonth()]} {e.date.getFullYear()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
