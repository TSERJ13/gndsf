import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS, RESULT_ADMINS } from "@/lib/rbac";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  DISCIPLINE_LABELS,
  FORMAT_LABELS,
  fmtDate,
} from "@/lib/labels";
import { addEvent, addEntry, commitResults, publishCompetition } from "./actions";

export const dynamic = "force-dynamic";

export default async function CompetitionAdmin({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireRole(REGISTRY_ADMINS);
  const canManage = (RESULT_ADMINS as string[]).includes(user.role);
  const { id } = await params;
  const { ok } = await searchParams;

  const comp = await db.competition.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: [{ ageCategory: "asc" }, { discipline: "asc" }],
        include: {
          entries: {
            include: {
              athlete: true,
              partnership: { include: { leader: true, follower: true } },
              club: true,
              result: true,
            },
          },
        },
      },
    },
  });
  if (!comp) notFound();

  const [couples, soloists] = await Promise.all([
    db.partnership.findMany({
      where: { endDate: null },
      include: { leader: true, follower: true },
      orderBy: { startDate: "desc" },
    }),
    db.athlete.findMany({ where: { isActive: true }, orderBy: { lastName: "asc" } }),
  ]);

  const input =
    "rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-neutral-900";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{comp.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {comp.city} · {fmtDate(comp.startDate)} · კოეფიციენტი ×{comp.pointsCoefficient}
          </p>
        </div>
        {canManage && !comp.isPublished && (
          <form action={publishCompetition}>
            <input type="hidden" name="id" value={comp.id} />
            <button className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
              გამოქვეყნება
            </button>
          </form>
        )}
        {comp.isPublished && (
          <span className="rounded bg-green-100 px-3 py-1.5 text-sm text-green-800">
            გამოქვეყნებული
          </span>
        )}
      </div>

      {ok === "committed" && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          შედეგები დაფიქსირდა — ეროვნული რეიტინგი ავტომატურად გადაითვალა.
        </p>
      )}

      {canManage && (
        <form
          action={addEvent}
          className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
        >
          <input type="hidden" name="competitionId" value={comp.id} />
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500">კატეგორია</label>
            <select name="ageCategory" className={`${input} mt-1`}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500">პროგრამა</label>
            <select name="discipline" className={`${input} mt-1`}>
              <option value="LATIN">ლათინური</option>
              <option value="STANDARD">სტანდარტი</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500">ფორმატი</label>
            <select name="format" className={`${input} mt-1`}>
              <option value="COUPLE">წყვილები</option>
              <option value="SOLO">სოლო</option>
            </select>
          </div>
          <button className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
            ივენთის დამატება
          </button>
        </form>
      )}

      <div className="mt-8 space-y-8">
        {comp.events.map((ev) => (
          <section key={ev.id} className="rounded-lg border border-neutral-200 bg-white">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
              <h2 className="font-semibold">
                {CATEGORY_LABELS[ev.ageCategory]} · {DISCIPLINE_LABELS[ev.discipline]} ·{" "}
                {FORMAT_LABELS[ev.format]}
              </h2>
              {canManage && (
                <form action={addEntry} className="flex items-center gap-2">
                  <input type="hidden" name="eventId" value={ev.id} />
                  <select name="participant" className={input}>
                    {ev.format === "COUPLE"
                      ? couples.map((p) => (
                          <option key={p.id} value={`P:${p.id}`}>
                            {p.leader.lastName} · {p.follower.lastName}
                          </option>
                        ))
                      : soloists.map((a) => (
                          <option key={a.id} value={`A:${a.id}`}>
                            {a.firstName} {a.lastName} ({a.gid})
                          </option>
                        ))}
                  </select>
                  <button className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
                    რეგისტრაცია
                  </button>
                </form>
              )}
            </header>

            {ev.entries.length === 0 ? (
              <p className="px-4 py-6 text-sm text-neutral-500">
                მონაწილეები ჯერ არ არიან — დაარეგისტრირეთ ზემოთ.
              </p>
            ) : (
              <form action={commitResults}>
                <input type="hidden" name="eventId" value={ev.id} />
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-neutral-500">
                    <tr className="border-b border-neutral-100">
                      <th className="px-4 py-2">მონაწილე</th>
                      <th className="px-4 py-2">კატეგორია (სნეფშოთი)</th>
                      <th className="px-4 py-2">კლუბი (სნეფშოთი)</th>
                      <th className="w-28 px-4 py-2 text-right">ადგილი</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {ev.entries.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-2.5 font-medium">
                          {e.partnership
                            ? `${e.partnership.leader.lastName} · ${e.partnership.follower.lastName}`
                            : `${e.athlete?.firstName} ${e.athlete?.lastName}`}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600">
                          {CATEGORY_LABELS[e.ageCategorySnapshot]}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-600">{e.club?.name ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right">
                          {canManage ? (
                            <input
                              type="number"
                              name={`placement_${e.id}`}
                              min={1}
                              defaultValue={e.result?.placement ?? ""}
                              className={`${input} w-20 text-right tabular-nums`}
                            />
                          ) : (
                            <span className="tabular-nums">{e.result?.placement ?? "—"}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {canManage && (
                  <div className="flex justify-end border-t border-neutral-100 px-4 py-3">
                    <button className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
                      შედეგების დაფიქსირება და რეიტინგის გადათვლა
                    </button>
                  </div>
                )}
              </form>
            )}
          </section>
        ))}
        {comp.events.length === 0 && (
          <p className="text-sm text-neutral-500">ივენთები ჯერ არ არის დამატებული.</p>
        )}
      </div>
    </div>
  );
}
