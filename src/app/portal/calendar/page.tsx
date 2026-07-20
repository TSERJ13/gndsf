import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";
import { fmtDate } from "@/lib/labels";
import { createEvent, deleteEvent } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "კალენდარი · ადმინი" };

export default async function AdminCalendar({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireRole(REGISTRY_ADMINS);
  const { ok, error } = await searchParams;
  const events = await db.calendarEvent.findMany({ orderBy: { date: "asc" } });

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-neutral-500";

  return (
    <div>
      <h1 className="text-2xl font-semibold">კალენდარი</h1>
      {ok && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          {ok === "created" ? "ივენთი დაემატა — უკვე ჩანს კალენდარში." : "ივენთი წაიშალა."}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          სახელი, ქალაქი და თარიღი სავალდებულოა.
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="h-fit divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-sm font-medium">
                  {e.title}
                  {e.isIntl && (
                    <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-700">საერთ.</span>
                  )}
                  {+e.date < Date.now() && (
                    <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">გასული</span>
                  )}
                </div>
                <div className="mt-0.5 text-xs tabular-nums text-neutral-500">
                  {e.city} · {fmtDate(e.date)}
                </div>
              </div>
              <form action={deleteEvent}>
                <input type="hidden" name="id" value={e.id} />
                <button className="rounded border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50">
                  წაშლა
                </button>
              </form>
            </li>
          ))}
          {events.length === 0 && <li className="px-4 py-6 text-sm text-neutral-500">ივენთები არ არის.</li>}
        </ul>

        <form action={createEvent} className="h-fit rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">ახალი ივენთი</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className={label} htmlFor="title">დასახელება</label>
              <input id="title" name="title" required className={input} />
            </div>
            <div>
              <label className={label} htmlFor="city">ქალაქი</label>
              <input id="city" name="city" required className={input} />
            </div>
            <div>
              <label className={label} htmlFor="date">თარიღი</label>
              <input id="date" name="date" type="date" required className={input} />
            </div>
            <div>
              <label className={label} htmlFor="link">ბმული (არასავალდებულო)</label>
              <input id="link" name="link" type="url" placeholder="https://" className={input} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isIntl" className="h-4 w-4" />
              საერთაშორისო
            </label>
            <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
              დამატება
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
