import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "კლუბები" };

export default async function ClubsPage() {
  const clubs = await db.club.findMany({
    where: { isActive: true },
    include: { _count: { select: { memberships: { where: { endDate: null } } } } },
    orderBy: { name: "asc" },
  });
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12">
      <h1 className="text-3xl font-bold">რეგისტრირებული კლუბები</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clubs.map((c) => (
          <div key={c.id} className="rounded-lg border border-line bg-coal p-5">
            <h2 className="font-semibold">{c.name}</h2>
            <div className="mt-1 text-sm text-smoke">{c.city}</div>
            <div className="tnum mt-4 text-sm text-smoke">
              <span className="text-silver">{c._count.memberships}</span> სპორტსმენი
            </div>
            {c.email && <div className="mt-1 text-sm text-smoke">{c.email}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
