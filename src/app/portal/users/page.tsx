import Link from "next/link";
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
  searchParams: Promise<{ tab?: string; ok?: string; error?: string }>;
}) {
  await requireRole(["SUPER_ADMIN"]);
  const { tab = "admin", ok, error } = await searchParams;

  const [users, clubs] = await Promise.all([
    db.user.findMany({
      include: {
        club: true,
        athlete: {
          include: {
            clubMemberships: {
              where: { endDate: null },
              include: { club: true },
            },
          },
        },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    db.club.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  // Partition users into 3 categories
  const adminUsers = users.filter((u) =>
    ["SUPER_ADMIN", "PRESIDENT", "VICE_PRESIDENT", "GENERAL_SECRETARY", "REGIONAL_REP"].includes(
      u.role,
    ),
  );

  const clubManagerUsers = users.filter((u) => u.role === "CLUB_MANAGER");

  const athleteUsers = users.filter((u) => u.role === "ATHLETE");

  // Group club managers by club
  const clubManagersByClub: Record<string, typeof clubManagerUsers> = {};
  for (const u of clubManagerUsers) {
    const clubName = u.club?.name || "დაუმოწმებელი სტუდია";
    if (!clubManagersByClub[clubName]) clubManagersByClub[clubName] = [];
    clubManagersByClub[clubName].push(u);
  }

  // Group athletes by club
  const athletesByClub: Record<string, typeof athleteUsers> = {};
  for (const u of athleteUsers) {
    const activeClubName = u.athlete?.clubMemberships?.[0]?.club?.name || "უატრიბუტო / კლუბის გარეშე";
    if (!athletesByClub[activeClubName]) athletesByClub[activeClubName] = [];
    athletesByClub[activeClubName].push(u);
  }

  const activeTabUsers =
    tab === "clubs"
      ? clubManagerUsers
      : tab === "athletes"
        ? athleteUsers
        : adminUsers;

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-neutral-500";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">მომხმარებლები</h1>
          <p className="mt-1 text-sm text-neutral-500">
            ფედერაციის ადმინისტრაციის, სტუდიების მენეჯერებისა და სპორტსმენების ანგარიშები.
          </p>
        </div>
      </div>

      {ok && MSG[ok] && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          {MSG[ok]}
        </p>
      )}
      {error && ERR[error] && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {ERR[error]}
        </p>
      )}

      {/* Tabs Header */}
      <div className="mt-6 flex border-b border-neutral-200 text-sm font-medium">
        <Link
          href="/portal/users?tab=admin"
          className={`px-5 py-3 border-b-2 transition-colors ${
            tab === "admin"
              ? "border-[#8B1E0F] text-[#8B1E0F] font-bold"
              : "border-transparent text-neutral-500 hover:text-neutral-900"
          }`}
        >
          👑 ფედერაციის ადმინისტრაცია ({adminUsers.length})
        </Link>
        <Link
          href="/portal/users?tab=clubs"
          className={`px-5 py-3 border-b-2 transition-colors ${
            tab === "clubs"
              ? "border-[#8B1E0F] text-[#8B1E0F] font-bold"
              : "border-transparent text-neutral-500 hover:text-neutral-900"
          }`}
        >
          🏢 სტუდიები / კლუბები ({clubManagerUsers.length})
        </Link>
        <Link
          href="/portal/users?tab=athletes"
          className={`px-5 py-3 border-b-2 transition-colors ${
            tab === "athletes"
              ? "border-[#8B1E0F] text-[#8B1E0F] font-bold"
              : "border-transparent text-neutral-500 hover:text-neutral-900"
          }`}
        >
          💃 სპორტსმენები სტუდიების მიხედვით ({athleteUsers.length})
        </Link>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Main Content Area */}
        <div className="space-y-6">
          {/* TAB 1: ADMINISTRATION */}
          {tab === "admin" && (
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 font-semibold text-neutral-700">
                ფედერაციის ადმინისტრაციული პერსონალი
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">მომხმარებელი</th>
                    <th className="px-4 py-3">როლი</th>
                    <th className="px-4 py-3">მოქმედება</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {adminUsers.map((u) => (
                    <tr key={u.id} className={u.isActive ? "" : "opacity-50"}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-neutral-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        <span className="inline-block rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-800">
                          {ROLE_LABELS[u.role]}
                        </span>
                        {u.region && <div className="mt-1 text-xs text-neutral-400">რეგიონი: {u.region}</div>}
                        {!u.isActive && (
                          <span className="ml-2 inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
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
                  {adminUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                        ადმინისტრაციული ანგარიშები არ მოიძებნა.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: STUDIOS / CLUBS MANAGERS (Grouped by Studio) */}
          {tab === "clubs" && (
            <div className="space-y-6">
              {Object.keys(clubManagersByClub).length === 0 && (
                <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-neutral-500">
                  სტუდიების/კლუბების მენეჯერების ანგარიშები ჯერ არ არის შექმნილი.
                </div>
              )}
              {Object.entries(clubManagersByClub).map(([clubName, managers]) => (
                <div key={clubName} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                  <div className="bg-[#8B1E0F]/5 px-4 py-3 border-b border-neutral-200 font-bold text-[#8B1E0F] flex items-center justify-between">
                    <span>🏢 ცეკვის სტუდია: {clubName}</span>
                    <span className="text-xs bg-white border border-[#8B1E0F]/20 px-2 py-0.5 rounded text-neutral-600">
                      {managers.length} მენეჯერი
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
                      <tr>
                        <th className="px-4 py-3">მენეჯერი</th>
                        <th className="px-4 py-3">სტატუსი</th>
                        <th className="px-4 py-3">მოქმედება</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {managers.map((u) => (
                        <tr key={u.id} className={u.isActive ? "" : "opacity-50"}>
                          <td className="px-4 py-3">
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-neutral-500">{u.email}</div>
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {u.isActive ? (
                              <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                                აქტიური
                              </span>
                            ) : (
                              <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
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
              ))}
            </div>
          )}

          {/* TAB 3: ATHLETES GROUPED BY STUDIO */}
          {tab === "athletes" && (
            <div className="space-y-6">
              {Object.keys(athletesByClub).length === 0 && (
                <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-neutral-500">
                  სპორტსმენების კაბინეტების ანგარიშები ჯერ არ არის შექმნილი.
                </div>
              )}
              {Object.entries(athletesByClub).map(([clubName, athletesList]) => (
                <div key={clubName} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                  <div className="bg-neutral-100 px-4 py-3 border-b border-neutral-200 font-bold text-neutral-800 flex items-center justify-between">
                    <span>💃 ცეკვის სტუდია: {clubName}</span>
                    <span className="text-xs bg-white border border-neutral-300 px-2 py-0.5 rounded text-neutral-600">
                      {athletesList.length} სპორტსმენი
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
                      <tr>
                        <th className="px-4 py-3">სპორტსმენი</th>
                        <th className="px-4 py-3">GID / ID</th>
                        <th className="px-4 py-3">მოქმედება</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {athletesList.map((u) => (
                        <tr key={u.id} className={u.isActive ? "" : "opacity-50"}>
                          <td className="px-4 py-3">
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-neutral-500">{u.email}</div>
                          </td>
                          <td className="px-4 py-3 text-neutral-600 font-mono text-xs">
                            {u.athlete?.gid ?? "—"}
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
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Create New Account */}
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
