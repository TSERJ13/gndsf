import { db } from "@/lib/db";
import { requireUser, clubScope, REGISTRY_ADMINS } from "@/lib/rbac";
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
    throw new Error("Access denied"); // handled by error boundary or redirect
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
          <ul className="mt-3 divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {active.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">
                    {p.leader.firstName} {p.leader.lastName} · {p.follower.firstName} {p.follower.lastName}
                  </span>
                  <span className="ml-3 tabular-nums text-neutral-500">
                    {fmtDate(p.startDate)}-დან
                  </span>
                </div>
                <form action={splitPartnership}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="rounded border border-red-200 px-3 py-1 text-xs text-red-700 transition-colors hover:bg-red-50">
                    გაყრა
                  </button>
                </form>
              </li>
            ))}
            {active.length === 0 && (
              <li className="px-4 py-6 text-sm text-neutral-500">მოქმედი წყვილი არ არის.</li>
            )}
          </ul>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            ბოლო გაყრილი
          </h2>
          <ul className="mt-3 divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white opacity-70">
            {past.map((p) => (
              <li key={p.id} className="px-4 py-3 text-sm">
                {p.leader.firstName} {p.leader.lastName} · {p.follower.firstName} {p.follower.lastName}
                <span className="ml-3 tabular-nums text-neutral-500">
                  {fmtDate(p.startDate)} — {p.endDate && fmtDate(p.endDate)}
                </span>
              </li>
            ))}
            {past.length === 0 && (
              <li className="px-4 py-6 text-sm text-neutral-500">ჯერ არავინ გაყრილა.</li>
            )}
          </ul>
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
