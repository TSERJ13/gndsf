import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";
import { createClub, transferAthlete } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "კლუბები · ადმინი" };

const MSG: Record<string, string> = {
  created: "კლუბი დაემატა.",
  transferred: "ტრანსფერი შესრულდა — ისტორია შენარჩუნებულია.",
  updated: "კლუბი განახლდა.",
};
const ERR: Record<string, string> = {
  fields: "სახელი და ქალაქი სავალდებულოა.",
  transfer: "აირჩიეთ სპორტსმენი და კლუბი.",
  sameclub: "სპორტსმენი უკვე ამ კლუბშია.",
};

export default async function AdminClubs({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireRole(REGISTRY_ADMINS);
  const { ok, error } = await searchParams;

  const [clubs, athletes] = await Promise.all([
    db.club.findMany({
      include: {
        _count: { select: { memberships: { where: { endDate: null } }, managers: true } },
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    db.athlete.findMany({
      where: { isActive: true },
      include: { clubMemberships: { where: { endDate: null }, include: { club: true } } },
      orderBy: { lastName: "asc" },
    }),
  ]);

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-neutral-500";

  return (
    <div>
      <h1 className="text-2xl font-semibold">კლუბები</h1>
      {ok && MSG[ok] && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">{MSG[ok]}</p>
      )}
      {error && ERR[error] && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{ERR[error]}</p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="h-fit overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">კლუბი</th>
                <th className="px-4 py-3">ქალაქი</th>
                <th className="px-4 py-3 text-right">სპორტსმენი</th>
                <th className="px-4 py-3 text-right">მენეჯერი</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {clubs.map((c) => (
                <tr key={c.id} className={c.isActive ? "" : "opacity-50"}>
                  <td className="px-4 py-3 font-medium">
                    {c.name}
                    {!c.isActive && (
                      <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs">გათიშული</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{c.city}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c._count.memberships}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c._count.managers}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/clubs/${c.id}`}
                      className="rounded border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-50"
                    >
                      რედაქტირება
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <form action={createClub} className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="font-semibold">ახალი კლუბი</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className={label} htmlFor="c-name">დასახელება</label>
                <input id="c-name" name="name" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="c-city">ქალაქი</label>
                <input id="c-city" name="city" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="c-email">ელფოსტა</label>
                <input id="c-email" name="email" type="email" className={input} />
              </div>
              <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
                დამატება
              </button>
            </div>
          </form>

          <form action={transferAthlete} className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="font-semibold">სპორტსმენის ტრანსფერი</h2>
            <p className="mt-1 text-xs text-neutral-500">
              ძველი კლუბის ისტორია და შედეგები უცვლელი რჩება.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className={label} htmlFor="t-athlete">სპორტსმენი</label>
                <select id="t-athlete" name="athleteId" required className={input}>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.firstName} {a.lastName} ({a.clubMemberships[0]?.club.name ?? "უკლუბო"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="t-club">ახალი კლუბი</label>
                <select id="t-club" name="clubId" required className={input}>
                  {clubs.filter((c) => c.isActive).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
                ტრანსფერი
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
