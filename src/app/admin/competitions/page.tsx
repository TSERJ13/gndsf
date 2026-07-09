import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";
import { fmtDate } from "@/lib/labels";
import { createCompetition } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "შეჯიბრებები · ადმინი" };

const TYPE_LABELS: Record<string, string> = {
  REGIONAL: "რეგიონული (×0.8)",
  NATIONAL: "ეროვნული (×1.0)",
  INTERNATIONAL: "საერთაშორისო (×1.5)",
};

export default async function AdminCompetitions() {
  const user = await requireRole(REGISTRY_ADMINS);
  const canManage = user.role === "SUPER_ADMIN" || user.role === "GENERAL_SECRETARY";

  const comps = await db.competition.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { events: true } } },
  });

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-neutral-500";

  return (
    <div>
      <h1 className="text-2xl font-semibold">შეჯიბრებები</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="h-fit divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {comps.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/competitions/${c.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-neutral-50"
              >
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {c.city} · {fmtDate(c.startDate)} · {TYPE_LABELS[c.type]}
                  </div>
                </div>
                <div className="text-xs tabular-nums text-neutral-500">
                  {c._count.events} ივენთი {c.isPublished ? "· გამოქვეყნებული" : ""}
                </div>
              </Link>
            </li>
          ))}
          {comps.length === 0 && (
            <li className="px-4 py-6 text-sm text-neutral-500">შეჯიბრებები ჯერ არ არის.</li>
          )}
        </ul>

        {canManage && (
          <form action={createCompetition} className="h-fit rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="font-semibold">ახალი შეჯიბრება</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className={label} htmlFor="name">დასახელება</label>
                <input id="name" name="name" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="city">ქალაქი</label>
                <input id="city" name="city" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="startDate">თარიღი</label>
                <input id="startDate" name="startDate" type="date" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="type">ტიპი</label>
                <select id="type" name="type" className={input}>
                  <option value="NATIONAL">{TYPE_LABELS.NATIONAL}</option>
                  <option value="REGIONAL">{TYPE_LABELS.REGIONAL}</option>
                  <option value="INTERNATIONAL">{TYPE_LABELS.INTERNATIONAL}</option>
                </select>
              </div>
              <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700">
                შექმნა
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
