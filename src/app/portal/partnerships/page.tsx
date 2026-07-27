import { db } from "@/lib/db";
import { requireUser, clubScope, REGISTRY_ADMINS } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { fmtDate } from "@/lib/labels";
import { formPartnership, splitPartnership } from "./actions";
import SearchableAthleteSelect from "./SearchableAthleteSelect";

export const dynamic = "force-dynamic";
export const metadata = { title: "წყვილები · პორტალი" };

export default async function AdminPartnerships({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const scope = clubScope(user);
  const isRegistryAdmin = REGISTRY_ADMINS.includes(user.role);
  if (!isRegistryAdmin && user.role !== "CLUB_MANAGER") {
    redirect("/portal");
  }
  const canManageCouples = ["SUPER_ADMIN", "PRESIDENT", "VICE_PRESIDENT"].includes(user.role);
  const { ok, error } = await searchParams;

  const clubFilter = scope ? {
    OR: [
      { leader: { clubMemberships: { some: { clubId: scope.clubId, endDate: null } } } },
      { follower: { clubMemberships: { some: { clubId: scope.clubId, endDate: null } } } }
    ]
  } : {};

  const athleteFilter = scope ? {
    clubMemberships: { some: { clubId: scope.clubId, endDate: null } }
  } : {};

  const [active, past, freeMales, freeFemales] = await Promise.all([
    db.partnership.findMany({
      where: { endDate: null, ...clubFilter },
      include: { leader: true, follower: true },
      orderBy: { startDate: "desc" },
    }),
    db.partnership.findMany({
      where: { endDate: { not: null }, ...clubFilter },
      include: { leader: true, follower: true },
      orderBy: { endDate: "desc" },
      take: 10,
    }),
    db.athlete.findMany({
      where: {
        isActive: true, gender: "MALE",
        ...athleteFilter,
        asLeader: { none: { endDate: null } },
        asFollower: { none: { endDate: null } },
      },
      orderBy: { lastName: "asc" },
    }),
    db.athlete.findMany({
      where: {
        isActive: true, gender: "FEMALE",
        ...athleteFilter,
        asLeader: { none: { endDate: null } },
        asFollower: { none: { endDate: null } },
      },
      orderBy: { lastName: "asc" },
    }),
  ]);

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";

  return (
    <div>
      <h1 className="text-2xl font-semibold">წყვილები</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {scope ? "თქვენ ხედავთ მხოლოდ თქვენი კლუბის წყვილებს. " : ""}
        დაშლა წყვილს არ შლის — პერიოდი იხურება და ისტორია უცვლელი რჩება.
      </p>
      {ok && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          {ok === "formed" ? "წყვილი შეიქმნა." : "წყვილი დაიშალა — ისტორია შენარჩუნებულია."}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error === "busy"
            ? "ერთ-ერთ სპორტსმენს უკვე ჰყავს მოქმედი პარტნიორი — ჯერ არსებული წყვილი დაშალეთ."
            : "აირჩიეთ ორი განსხვავებული სპორტსმენი."}
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            მოქმედი ({active.length})
          </h2>
          <div className="mt-3 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {active.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 flex flex-col relative transition-transform hover:-translate-y-1">
                <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative">
                  <div className="flex items-center justify-center gap-4">
                    <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
                      <path d="M 20 26 C 20 44, 44 44, 44 26" />
                      <path d="M 20 26 C 24 18, 28 26, 32 22 C 36 18, 40 24, 44 26 C 44 6, 20 6, 20 26 Z" />
                    </svg>
                    <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
                      <path d="M 22 32 C 22 46, 42 46, 42 32" />
                      <path d="M 16 46 L 22 40 C 20 30, 28 22, 32 18 C 36 22, 44 30, 42 40 L 48 46 L 46 24 C 46 4, 18 4, 18 24 Z" />
                    </svg>
                  </div>
                  <span className="absolute top-3 right-3 bg-white/80 backdrop-blur rounded px-2 py-1 text-[10px] font-bold text-green-700 uppercase tracking-wider border border-green-200">
                    აქტიური
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="font-bold text-[16px] text-black mb-1">
                    {p.leader.lastName} & {p.follower.lastName}
                  </div>
                  <div className="text-[13px] text-gray-500 mb-4 tabular-nums">
                    Joined: {fmtDate(p.startDate)}
                  </div>
                  {canManageCouples && (
                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <form action={splitPartnership} className="w-full">
                        <input type="hidden" name="id" value={p.id} />
                        <button className="w-full rounded bg-red-50 py-2.5 text-center text-[13px] font-semibold text-red-700 transition hover:bg-red-100">
                          დაშლა
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {active.length === 0 && (
              <div className="col-span-full py-8 text-center text-sm text-neutral-500">ინფორმაცია არ მოიძებნა.</div>
            )}
          </div>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            ბოლო დაშლილი
          </h2>
          <div className="mt-3 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {past.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 flex flex-col relative opacity-60 grayscale transition-transform hover:-translate-y-1">
                <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center relative">
                  <div className="flex items-center justify-center gap-4">
                    <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                      <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
                      <path d="M 20 26 C 20 44, 44 44, 44 26" />
                      <path d="M 20 26 C 24 18, 28 26, 32 22 C 36 18, 40 24, 44 26 C 44 6, 20 6, 20 26 Z" />
                    </svg>
                    <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                      <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
                      <path d="M 22 32 C 22 46, 42 46, 42 32" />
                      <path d="M 16 46 L 22 40 C 20 30, 28 22, 32 18 C 36 22, 44 30, 42 40 L 48 46 L 46 24 C 46 4, 18 4, 18 24 Z" />
                    </svg>
                  </div>
                  <span className="absolute top-3 right-3 bg-white/80 backdrop-blur rounded px-2 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider border border-gray-200">
                    დაშლილი
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="font-bold text-[16px] text-gray-600 mb-1">
                    {p.leader.lastName} & {p.follower.lastName}
                  </div>
                  <div className="text-[13px] text-gray-400 mb-4 tabular-nums">
                    {fmtDate(p.startDate)} – {p.endDate ? fmtDate(p.endDate) : ""}
                  </div>
                </div>
              </div>
            ))}
            {past.length === 0 && (
              <div className="col-span-full py-8 text-center text-sm text-neutral-500">ინფორმაცია არ მოიძებნა.</div>
            )}
          </div>
        </div>

        {canManageCouples && (
          <form action={formPartnership} className="h-fit rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="font-semibold">ახალი წყვილი</h2>
            <p className="mt-1 text-xs text-neutral-500">
              სიაში მხოლოდ თავისუფალი სპორტსმენები ჩანან.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500" htmlFor="leaderId">
                  პარტნიორი
                </label>
                <div className="mt-1">
                  <SearchableAthleteSelect name="leaderId" options={freeMales} placeholder="აირჩიეთ კაცი პარტნიორი..." />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500" htmlFor="followerId">
                  პარტნიორი ქალი
                </label>
                <div className="mt-1">
                  <SearchableAthleteSelect name="followerId" options={freeFemales} placeholder="აირჩიეთ ქალი პარტნიორი..." />
                </div>
              </div>
              <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700">
                წყვილის შექმნა
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
