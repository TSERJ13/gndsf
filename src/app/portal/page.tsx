import { db } from "@/lib/db";
import { requireUser, clubScope } from "@/lib/rbac";
import { fmtDate } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "ადმინ დაფა" };

export default async function AdminDashboard() {
  const user = await requireUser();
  const scope = clubScope(user);

  const athleteWhere = scope
    ? { clubMemberships: { some: { clubId: scope.clubId, endDate: null } } }
    : {};
    
  const coupleWhere = scope
    ? { 
        OR: [
          { leader: { clubMemberships: { some: { clubId: scope.clubId, endDate: null } } } },
          { follower: { clubMemberships: { some: { clubId: scope.clubId, endDate: null } } } }
        ]
      }
    : {};

  let athletes = 0;
  let activeCouples = 0;
  let clubs = 0;
  let competitions = 0;
  let audit: any[] = [];

  try {
    [athletes, activeCouples, clubs, competitions, audit] = await Promise.all([
      db.athlete.count({ where: { isActive: true, ...athleteWhere } }),
      db.partnership.count({ where: { endDate: null, ...coupleWhere } }),
      !scope ? db.club.count({ where: { isActive: true } }) : Promise.resolve(0),
      !scope ? db.competition.count() : Promise.resolve(0),
      !scope
        ? db.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
            include: { user: true },
          })
        : Promise.resolve([]),
    ]);
  } catch (err) {
    console.error("Portal dashboard DB queries failed:", err);
  }

  const stats = [
    { label: scope ? "თქვენი კლუბის სპორტსმენები" : "აქტიური სპორტსმენი", value: athletes },
    { label: scope ? "თქვენი კლუბის წყვილები" : "მოქმედი წყვილი", value: activeCouples },
  ];
  if (!scope) {
    stats.push({ label: "კლუბი", value: clubs });
    stats.push({ label: "შეჯიბრება", value: competitions });
  }

  return (
    <div>
      <h1 className="heading-display text-3xl md:text-4xl">დაფა</h1>
      <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8B1E0F] to-[#c49a5b] opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-4xl font-black tabular-nums text-[#8B1E0F]">{s.value}</div>
            <div className="mt-2 text-xs font-bold uppercase tracking-wider text-neutral-500">{s.label}</div>
          </div>
        ))}
      </div>

      {!scope && (
        <>
          <h2 className="heading-display mt-14 text-2xl">ბოლო ცვლილებები</h2>
          <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[#8B1E0F]/5 text-left text-xs uppercase tracking-wider text-[#8B1E0F]">
                <tr>
                  <th className="px-6 py-4 font-black">მოქმედება</th>
                  <th className="px-6 py-4 font-black">დეტალი</th>
                  <th className="px-6 py-4 font-black">ვინ</th>
                  <th className="px-6 py-4 font-black">როდის</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {audit.map((a) => (
                  <tr key={a.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-3 font-medium text-neutral-800">{a.action}</td>
                    <td className="px-6 py-3 text-neutral-500">{a.detail}</td>
                    <td className="px-6 py-3 font-medium text-neutral-800">{a.user?.role === "CLUB_MANAGER" ? "კლუბის მენეჯერი" : "ფედერაციის პრეზიდენტი"}</td>
                    <td className="px-6 py-3 text-neutral-400">{fmtDate(a.createdAt)}</td>
                  </tr>
                ))}
                {audit.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-neutral-400">ინფორმაცია არ არის.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
