import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { createStaffUser, toggleUserActive, resetUserPassword } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "მომხმარებლები · ადმინი" };

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "სუპერადმინი",
  PRESIDENT: "პრეზიდენტი",
  VICE_PRESIDENT: "ვიცე-პრეზიდენტი",
  GENERAL_SECRETARY: "გენ. მდივანი",
  REGIONAL_REP: "რეგიონული წარმ.",
  CLUB_MANAGER: "კლუბის მენეჯერი",
  ATHLETE: "სპორტსმენი",
};

const MSG: Record<string, string> = {
  created: "ანგარიში შეიქმნა — მომხმარებელს უკვე შეუძლია შესვლა.",
  toggled: "სტატუსი შეიცვალა.",
  reset: "პაროლი გადაყენდა — გადაეცით მომხმარებელს.",
};

const ERR: Record<string, string> = {
  fields: "შეავსეთ ყველა ველი — პაროლი მინიმუმ 8 სიმბოლო.",
  club: "კლუბის მენეჯერს კლუბი აურჩიეთ.",
  exists: "ამ ელფოსტით ანგარიში უკვე არსებობს.",
  self: "საკუთარი ანგარიშის გათიშვა შეუძლებელია.",
  lastadmin: "ეს ბოლო აქტიური სუპერადმინია — ჯერ სხვას მიანიჭეთ როლი.",
  shortpass: "ახალი პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს.",
};

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireRole(["SUPER_ADMIN"]);
  const { ok, error } = await searchParams;

  const [users, clubs] = await Promise.all([
    db.user.findMany({
      include: { club: true, athlete: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    db.club.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-neutral-500";

  return (
    <div>
      <h1 className="text-2xl font-semibold">მომხმარებლები</h1>
      <p className="mt-1 text-sm text-neutral-500">
        პერსონალის ანგარიშები. სპორტსმენების კაბინეტის ანგარიშები „სპორტსმენების“ განყოფილებიდან იქმნება.
      </p>
      {ok && MSG[ok] && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">{MSG[ok]}</p>
      )}
      {error && ERR[error] && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{ERR[error]}</p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="h-fit overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">მომხმარებელი</th>
                <th className="px-4 py-3">როლი</th>
                <th className="px-4 py-3">მოქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((u) => (
                <tr key={u.id} className={u.isActive ? "" : "opacity-50"}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-neutral-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {ROLE_LABELS[u.role]}
                    {u.club && <div className="text-xs text-neutral-400">{u.club.name}</div>}
                    {u.region && <div className="text-xs text-neutral-400">{u.region}</div>}
                    {!u.isActive && (
                      <span className="mt-1 inline-block rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
                        გათიშული
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={toggleUserActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="rounded border border-neutral-300 px-2.5 py-1 text-xs hover:bg-neutral-50">
                          {u.isActive ? "გათიშვა" : "ჩართვა"}
                        </button>
                      </form>
                      <form action={resetUserPassword} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={u.id} />
                        <input
                          name="password"
                          type="text"
                          minLength={8}
                          required
                          placeholder="ახალი პაროლი"
                          className="w-28 rounded border border-neutral-300 px-2 py-1 text-xs outline-none focus:border-neutral-900"
                        />
                        <button className="rounded border border-neutral-300 px-2.5 py-1 text-xs hover:bg-neutral-50">
                          გადაყენება
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={createStaffUser} className="h-fit rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">ახალი თანამშრომელი</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className={label} htmlFor="u-name">სახელი და გვარი</label>
              <input id="u-name" name="name" required className={input} />
            </div>
            <div>
              <label className={label} htmlFor="u-email">ელფოსტა</label>
              <input id="u-email" name="email" type="email" required className={input} />
            </div>
            <div>
              <label className={label} htmlFor="u-role">როლი</label>
              <select id="u-role" name="role" required className={input}>
                <option value="GENERAL_SECRETARY">გენერალური მდივანი</option>
                <option value="PRESIDENT">პრეზიდენტი</option>
                <option value="VICE_PRESIDENT">ვიცე-პრეზიდენტი</option>
                <option value="REGIONAL_REP">რეგიონული წარმომადგენელი</option>
                <option value="CLUB_MANAGER">კლუბის მენეჯერი</option>
              </select>
            </div>
            <div>
              <label className={label} htmlFor="u-club">კლუბი (მენეჯერისთვის)</label>
              <select id="u-club" name="clubId" className={input}>
                <option value="">—</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="u-region">რეგიონი (წარმომადგენლისთვის)</label>
              <input id="u-region" name="region" className={input} />
            </div>
            <div>
              <label className={label} htmlFor="u-pass">დროებითი პაროლი</label>
              <input id="u-pass" name="password" type="text" minLength={8} required className={input} />
            </div>
            <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
              ანგარიშის შექმნა
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
