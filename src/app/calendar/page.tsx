import { db } from "@/lib/db";
import { fmtDate } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "კალენდარი" };

export default async function CalendarPage() {
  const events = await db.calendarEvent.findMany({ orderBy: { date: "asc" } });
  const upcoming = events.filter((e) => +e.date >= Date.now());
  const past = events.filter((e) => +e.date < Date.now()).reverse();
  const Row = ({ e }: { e: (typeof events)[number] }) => (
    <li className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <div className="font-medium">{e.title}</div>
        <div className="mt-0.5 text-sm text-smoke">{e.city}</div>
      </div>
      <div className="text-right">
        <div className="tnum text-sm">{fmtDate(e.date)}</div>
        {e.isIntl && <span className="mt-1 inline-block rounded bg-wine/15 px-2 py-0.5 text-xs text-flame">საერთაშორისო</span>}
      </div>
    </li>
  );
  return (
    <div className="mx-auto max-w-4xl px-4 pt-12">
      <h1 className="text-3xl font-bold">შეჯიბრებების კალენდარი</h1>
      <h2 className="mt-8 text-lg font-semibold">მომავალი</h2>
      <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-coal">
        {upcoming.map((e) => <Row key={e.id} e={e} />)}
        {upcoming.length === 0 && <li className="p-4 text-sm text-smoke">დაგეგმილი შეჯიბრება არ არის.</li>}
      </ul>
      {past.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-semibold text-smoke">გასული</h2>
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-coal opacity-70">
            {past.map((e) => <Row key={e.id} e={e} />)}
          </ul>
        </>
      )}
    </div>
  );
}
