import Link from "next/link";
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
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 content-start">
          {athletes.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 flex flex-col relative transition-transform hover:-translate-y-1">
              <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                {a.gender === "FEMALE" ? (
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
                    <path d="M 22 32 C 22 46, 42 46, 42 32" />
                    <path d="M 16 46 L 22 40 C 20 30, 28 22, 32 18 C 36 22, 44 30, 42 40 L 48 46 L 46 24 C 46 4, 18 4, 18 24 Z" />
                  </svg>
                ) : (
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
                    <path d="M 20 26 C 20 44, 44 44, 44 26" />
                    <path d="M 20 26 C 24 18, 28 26, 32 22 C 36 18, 40 24, 44 26 C 44 6, 20 6, 20 26 Z" />
                  </svg>
                )}
                <span className="absolute top-3 right-3 bg-white/80 backdrop-blur rounded px-2 py-1 text-[10px] font-bold text-gray-700 uppercase tracking-wider">{a.gid}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="font-bold text-[16px] text-black mb-1">
                  {a.firstName} {a.lastName}
                </div>
                <div className="text-[13px] text-gray-500 mb-4">
                  Age group: {CATEGORY_LABELS[categoryFor(a.birthDate)]}
                </div>
                <div className="text-[13px] font-bold text-black mb-4 line-clamp-2 leading-snug">
                  {a.clubMemberships[0]?.club.name ?? "—"}
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <Link
                    href={`/portal/athletes/${a.id}/documents`}
                    className="block w-full rounded bg-gray-50 py-2.5 text-center text-[13px] font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    დოკუმენტები
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {athletes.length === 0 && (
            <div className="col-span-full py-12 text-center text-neutral-500">
              სპორტსმენები არ მოიძებნა.
            </div>
          )}
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
