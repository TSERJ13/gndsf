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
    `rounded-full px-4 py-1.5 text-sm transition-colors ${
      active
        ? "bg-wine font-medium text-white"
        : "border border-line text-smoke hover:border-wine hover:text-wine"
    }`;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-12">
      <h1 className="text-3xl font-bold">შეჯიბრებების კალენდარი</h1>
      <div className="mt-6 flex flex-wrap gap-2">
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
            <ul className="mt-4 space-y-3">
              {list.map((e) => {
                const dd = daysUntil(e.date);
                const isNearest = e.id === nearestId;
                return (
                  <li
                    key={e.id}
                    className={`flex items-center gap-4 rounded-lg border bg-coal p-4 transition-colors ${
                      isNearest ? "border-wine" : "border-line hover:border-smoke"
                    }`}
                  >
                    <div
                      className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg ${
                        isNearest ? "bg-wine text-white" : "bg-ink text-silver"
                      }`}
                    >
                      <span className="tnum text-2xl font-bold leading-none">
                        {e.date.getDate()}
                      </span>
                      <span className="mt-1 text-[11px] uppercase tracking-wider opacity-80">
                        {KA_MONTHS_SHORT[e.date.getMonth()]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{e.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-smoke">
                        <span>{e.city}</span>
                        {e.isIntl && (
                          <span className="rounded bg-wine/10 px-2 py-0.5 text-xs text-wine">
                            საერთაშორისო
                          </span>
                        )}
                        {isNearest && dd >= 0 && (
                          <span className="tnum text-xs font-medium text-wine">
                            {dd === 0 ? "დღეს" : dd === 1 ? "ხვალ" : `${dd} დღეში`}
                          </span>
                        )}
                      </div>
                    </div>
                    {e.link && (
                      <a
                        href={e.link}
                        className="shrink-0 rounded border border-line px-3 py-1.5 text-sm text-smoke transition-colors hover:border-wine hover:text-wine"
                      >
                        დეტალები
                      </a>
                    )}
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
