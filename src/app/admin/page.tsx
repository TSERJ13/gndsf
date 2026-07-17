import { db } from "@/lib/db";
import { requireUser, clubScope } from "@/lib/rbac";
import { fmtDate } from "@/lib/labels";
import CategoryTransitions from "@/components/CategoryTransitions";

export const dynamic = "force-dynamic";
export const metadata = { title: "ადმინ დაფა" };

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ notify?: string }>;
}) {
  const user = await requireUser();
  const scope = clubScope(user);
  const { notify } = await searchParams;

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
      <h1 className="text-2xl font-semibold">დაფა</h1>

      {notify === "failed" && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          შეტყობინების გაგზავნა ვერ მოხერხდა — სცადეთ ხელახლა.
        </p>
      )}
      {notify === "config" && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          ფოსტის გაგზავნა არ არის კონფიგურირებული (SMTP).
        </p>
      )}
      <div className="mt-6">
        <CategoryTransitions
          clubId={user.role === "CLUB_MANAGER" ? (user.clubId ?? null) : null}
          role={user.role}
          notified={notify === "sent"}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="text-3xl font-semibold tabular-nums">{s.value}</div>
            <div className="mt-1 text-sm text-neutral-500">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold">ბოლო ცვლილებები</h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3">მოქმედება</th>
              <th className="px-4 py-3">დეტალი</th>
              <th className="px-4 py-3">ვინ</th>
              <th className="px-4 py-3">როდის</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {audit.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-mono text-xs">{a.action}</td>
                <td className="px-4 py-3 text-neutral-600">{a.detail ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-600">{a.user?.name ?? "სისტემა"}</td>
                <td className="px-4 py-3 tabular-nums text-neutral-500">{fmtDate(a.createdAt)}</td>
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
