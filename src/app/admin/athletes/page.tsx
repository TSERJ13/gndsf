import { db } from "@/lib/db";
import { requireUser, clubScope, REGISTRY_ADMINS } from "@/lib/rbac";
import { CATEGORY_LABELS, categoryFor, fmtDate } from "@/lib/labels";
import { createAthlete, createPortalAccount } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "სპორტსმენები · ადმინი" };

export default async function AdminAthletes({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const user = await requireUser();
  const scope = clubScope(user);
  const { created, error } = await searchParams;
  const canCreate = REGISTRY_ADMINS.includes(user.role) || user.role === "CLUB_MANAGER";

  const withoutPortal = await db.athlete.findMany({
    where: { isActive: true, user: null },
    orderBy: { lastName: "asc" },
  });
  const [athletes, clubs] = await Promise.all([
    db.athlete.findMany({
      where: {
        isActive: true,
        ...(scope
          ? { clubMemberships: { some: { clubId: scope.clubId, endDate: null } } }
          : {}),
      },
      include: {
        clubMemberships: { where: { endDate: null }, include: { club: true } },
      },
      orderBy: { gid: "asc" },
    }),
    db.club.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-neutral-500";

  return (
    <div>
      <h1 className="text-2xl font-semibold">სპორტსმენები</h1>
      {scope && (
        <p className="mt-1 text-sm text-neutral-500">
          თქვენ ხედავთ და არეგისტრირებთ მხოლოდ თქვენი კლუბის სპორტსმენებს.
        </p>
      )}
      {created === "portal" && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          კაბინეტის ანგარიში შეიქმნა — სპორტსმენი უკვე შევა /cabinet-ზე.
        </p>
      )}
      {created && created !== "portal" && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          სპორტსმენი დარეგისტრირდა — GID ნომერი: <b className="tabular-nums">{created}</b>
        </p>
      )}
      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error === "club"
            ? "აირჩიეთ კლუბი."
            : error === "portal"
              ? "შეავსეთ ველები — პაროლი მინიმუმ 8 სიმბოლო."
              : error === "portalexists"
                ? "ამ ელფოსტით ან სპორტსმენზე ანგარიში უკვე არსებობს."
                : "შეავსეთ ყველა სავალდებულო ველი."}
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">GID</th>
                <th className="px-4 py-3">სახელი</th>
                <th className="px-4 py-3">კატეგორია</th>
                <th className="px-4 py-3">კლუბი</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {athletes.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 tabular-nums text-neutral-500">{a.gid}</td>
                  <td className="px-4 py-3 font-medium">
                    {a.firstName} {a.lastName}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {CATEGORY_LABELS[categoryFor(a.birthDate)]}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {a.clubMemberships[0]?.club.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canCreate && (
          <div className="space-y-6">
          <form
            action={createAthlete}
            className="h-fit rounded-lg border border-neutral-200 bg-white p-5"
          >
            <h2 className="font-semibold">ახალი სპორტსმენი</h2>
            <p className="mt-1 text-xs text-neutral-500">
              GID ნომერი მიენიჭება ავტომატურად.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className={label} htmlFor="firstName">სახელი</label>
                <input id="firstName" name="firstName" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="lastName">გვარი</label>
                <input id="lastName" name="lastName" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="birthDate">დაბადების თარიღი</label>
                <input id="birthDate" name="birthDate" type="date" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="gender">სქესი</label>
                <select id="gender" name="gender" required className={input}>
                  <option value="MALE">მამრობითი</option>
                  <option value="FEMALE">მდედრობითი</option>
                </select>
              </div>
              {user.role !== "CLUB_MANAGER" && (
                <div>
                  <label className={label} htmlFor="clubId">კლუბი</label>
                  <select id="clubId" name="clubId" required className={input}>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700">
                რეგისტრაცია
              </button>
            </div>
          </form>

          <form action={createPortalAccount} className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="font-semibold">კაბინეტის ანგარიში</h2>
            <p className="mt-1 text-xs text-neutral-500">
              სპორტსმენს ეძლევა წვდომა პორტალზე (/cabinet).
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className={label} htmlFor="pa-athlete">სპორტსმენი</label>
                <select id="pa-athlete" name="athleteId" required className={input}>
                  {withoutPortal.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.firstName} {a.lastName} ({a.gid})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="pa-email">ელფოსტა</label>
                <input id="pa-email" name="email" type="email" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="pa-pass">დროებითი პაროლი</label>
                <input id="pa-pass" name="password" type="text" minLength={8} required className={input} />
              </div>
              <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700">
                ანგარიშის შექმნა
              </button>
            </div>
          </form>
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-neutral-400">
        სულ: <span className="tabular-nums">{athletes.length}</span> ·{" "}
        {fmtDate(new Date())}
      </p>
    </div>
  );
}
