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

  const [athletes, activeCouples, clubs, competitions, audit] = await Promise.all([
    db.athlete.count({ where: { isActive: true, ...athleteWhere } }),
    db.partnership.count({ where: { endDate: null } }),
    db.club.count({ where: { isActive: true } }),
    db.competition.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: true },
    }),
  ]);

  const stats = [
    { label: scope ? "თქვენი კლუბის სპორტსმენები" : "აქტიური სპორტსმენი", value: athletes },
    { label: "მოქმედი წყვილი", value: activeCouples },
    { label: "კლუბი", value: clubs },
    { label: "შეჯიბრება", value: competitions },
  ];

  return (
    <div>
      <h1 className="heading-display text-3xl md:text-4xl">დაფა</h1>
      <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="text-4xl font-black tabular-nums text-[#005eb8]">{s.value}</div>
            <div className="mt-2 text-xs font-bold uppercase tracking-wider text-neutral-500">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="heading-display mt-14 text-2xl">ბოლო ცვლილებები</h2>
      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#f8f8f8] text-left text-xs uppercase tracking-wider text-[#555]">
            <tr>
              <th className="px-6 py-4 font-bold">მოქმედება</th>
              <th className="px-6 py-4 font-bold">დეტალი</th>
              <th className="px-6 py-4 font-bold">ვინ</th>
              <th className="px-6 py-4 font-bold">როდის</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {audit.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-neutral-50">
                <td className="px-6 py-4 font-mono text-xs">{a.action}</td>
                <td className="px-6 py-4 text-neutral-600">{a.detail ?? "—"}</td>
                <td className="px-6 py-4 font-semibold text-neutral-800">{a.user?.name ?? "სისტემა"}</td>
                <td className="px-6 py-4 tabular-nums text-neutral-500">{fmtDate(a.createdAt)}</td>
              </tr>
            ))}
            {audit.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  ცვლილებები ჯერ არ არის — ყველა ოპერაცია აქ დაფიქსირდება.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
