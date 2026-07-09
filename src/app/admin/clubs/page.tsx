import { db } from "@/lib/db";
import { requireRole, REGISTRY_ADMINS } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const metadata = { title: "კლუბები · ადმინი" };

export default async function AdminClubs() {
  await requireRole(REGISTRY_ADMINS);
  const clubs = await db.club.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { memberships: { where: { endDate: null } }, managers: true } },
    },
    orderBy: { name: "asc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">კლუბები</h1>
      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3">კლუბი</th>
              <th className="px-4 py-3">ქალაქი</th>
              <th className="px-4 py-3 text-right">სპორტსმენი</th>
              <th className="px-4 py-3 text-right">მენეჯერი</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {clubs.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-neutral-600">{c.city}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c._count.memberships}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c._count.managers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-neutral-400">
        კლუბის დამატება/რედაქტირება და მენეჯერის მიბმა — Phase 2-ში.
      </p>
    </div>
  );
}
