import { db } from "@/lib/db";
import { requireUser, clubScope, REGISTRY_ADMINS } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { fmtDate } from "@/lib/labels";
import { formPartnership, splitPartnership } from "./actions";

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
        გაყრა წყვილს არ შლის — პერიოდი იხურება და ისტორია უცვლელი რჩება.
      </p>
      {ok && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          {ok === "formed" ? "წყვილი შეიქმნა." : "წყვილი გაიყარა — ისტორია შენარჩუნებულია."}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error === "busy"
            ? "ერთ-ერთ სპორტსმენს უკვე ჰყავს მოქმედი პარტნიორი — ჯერ არსებული წყვილი გაყარეთ."
            : "აირჩიეთ ორი განსხვავებული სპორტსმენი."}
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            მოქმედი ({active.length})
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {active.map((p) => (
              <div key={p.id} className="flex flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                    <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700">
                    აქტიური
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-neutral-900 leading-snug">
                    <span className="block text-[#005eb8]">{p.leader.firstName} {p.leader.lastName}</span>
                    <span className="block text-xs font-normal text-neutral-400 my-0.5">და</span>
                    <span className="block text-[#e31837]">{p.follower.firstName} {p.follower.lastName}</span>
                  </h3>
                  <p className="mt-2 text-xs text-neutral-500 tabular-nums">
                    {fmtDate(p.startDate)}-დან
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <form action={splitPartnership} className="w-full">
                    <input type="hidden" name="id" value={p.id} />
                    <button className="w-full rounded bg-red-50 py-2 text-center text-xs font-semibold text-red-700 transition hover:bg-red-100">
                      გაყრა
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {active.length === 0 && (
              <div className="col-span-full py-8 text-center text-sm text-neutral-500">ინფორმაცია არ მოიძებნა.</div>
            )}
          </div>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            ბოლო გაყრილი
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {past.map((p) => (
              <div key={p.id} className="flex flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm opacity-70">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                    <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    დაშლილი
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-neutral-700 leading-snug">
                    <span className="block">{p.leader.firstName} {p.leader.lastName}</span>
                    <span className="block text-xs font-normal text-neutral-400 my-0.5">და</span>
                    <span className="block">{p.follower.firstName} {p.follower.lastName}</span>
                  </h3>
                  <p className="mt-2 text-xs text-neutral-400 tabular-nums">
                    {fmtDate(p.startDate)} – {p.endDate ? fmtDate(p.endDate) : ""}
                  </p>
                </div>
              </div>
            ))}
            {past.length === 0 && (
              <div className="col-span-full py-8 text-center text-sm text-neutral-500">ინფორმაცია არ მოიძებნა.</div>
            )}
          </div>
        </div>

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
              <select id="leaderId" name="leaderId" required className={input}>
                {freeMales.map((a) => (
                  <option key={a.id} value={a.id}>{a.firstName} {a.lastName} ({a.gid})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-neutral-500" htmlFor="followerId">
                პარტნიორი ქალი
              </label>
              <select id="followerId" name="followerId" required className={input}>
                {freeFemales.map((a) => (
                  <option key={a.id} value={a.id}>{a.firstName} {a.lastName} ({a.gid})</option>
                ))}
              </select>
            </div>
            <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700">
              წყვილის შექმნა
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
