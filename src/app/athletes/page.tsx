import { AthletePhoto, CouplePhoto } from "@/components/Photo";
import Link from "next/link";
import { db } from "@/lib/db";
import { CATEGORIES, CATEGORY_LABELS, categoryFor } from "@/lib/labels";
import type { AgeCategory } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "ათლეტები" };

type Search = { q?: string; cat?: string; tab?: string };

const TABS = [
  { key: "all", label: "ყველა" },
  { key: "solo", label: "სოლო" },
  { key: "couples", label: "წყვილები" },
] as const;

export default async function AthletesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q, cat, tab: tabParam } = await searchParams;
  const tab = tabParam === "solo" || tabParam === "couples" ? tabParam : "all";

  const nameFilter = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" as const } },
          { lastName: { contains: q, mode: "insensitive" as const } },
          { firstNameEn: { contains: q, mode: "insensitive" as const } },
          { lastNameEn: { contains: q, mode: "insensitive" as const } },
          { gid: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  let couples: any[] = [];
  if (tab === "couples") {
    try {
      couples = await db.partnership.findMany({
        where: {
          endDate: null,
          ...(q ? { OR: [{ leader: nameFilter }, { follower: nameFilter }] } : {}),
        },
        include: { leader: true, follower: true, club: true, secondClub: true },
        orderBy: { startDate: "desc" },
        take: 100,
      });
    } catch (err) {
      console.error("AthletesPage couples DB error:", err);
    }
  }

  let athletes: any[] = [];
  try {
    if (tab !== "couples") athletes = await db.athlete.findMany({
      where: {
        isActive: true,
        status: "APPROVED",
        ...(tab === "solo" ? { soloEntries: { some: {} } } : {}),
        ...nameFilter,
      },
      include: {
        clubMemberships: {
          where: { endDate: null },
          include: { club: true },
        },
      },
      orderBy: [{ lastName: "asc" }],
      take: 100,
    });
  } catch (err) {
    console.error("AthletesPage DB error:", err);
  }

  const filtered = cat
    ? athletes.filter((a) => categoryFor(a.birthDate) === (cat as AgeCategory))
    : athletes;

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-10 pb-24">
      <h1 className="text-3xl md:text-4xl lg:text-[40px] font-light uppercase text-black mb-10 tracking-wide">
        ათლეტები
      </h1>

      <nav className="mb-8 flex border-b border-gray-300">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/athletes${t.key === "all" ? "" : `?tab=${t.key}`}`}
            className={
              tab === t.key
                ? "-mb-px border-x border-t border-gray-300 border-t-[#c49a5b] border-t-2 bg-white px-6 py-2 text-[15px] font-bold text-black"
                : "px-6 py-2 text-[15px] font-medium text-gray-500 transition-colors hover:text-black"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Search Bar matching WDSF */}
      <form className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12" action="/athletes">
        {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="ძებნა: სახელი, გვარი ან GID"
            className="w-full sm:w-[320px] rounded-full border border-gray-300 bg-white px-5 py-2.5 text-[14px] outline-none transition-all placeholder:text-gray-400 focus:border-[#B83A14]"
          />
          <div className="flex items-center gap-2">
            <button className="rounded-full bg-[#B83A14] hover:bg-[#8B1E0F] transition-colors px-6 py-2.5 text-[14px] font-bold text-white shadow-sm">
              ძებნა
            </button>
            <Link href="/athletes" className="rounded-full bg-[#B83A14] hover:bg-[#8B1E0F] transition-colors px-6 py-2.5 text-[14px] font-bold text-white shadow-sm inline-block">
              გასუფთავება
            </Link>
          </div>
        </div>
        
      </form>

      {tab === "couples" && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {couples.map((p) => (
            <Link
              key={p.id}
              href={`/couples/${p.id}`}
              className="block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.05)] transition-transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                <CouplePhoto couple={p} />
              </div>
              <div className="p-5">
              <div className="text-[16px] font-bold text-black">
                {p.leader.firstName} {p.leader.lastName}
              </div>
              <div className="text-[16px] font-bold text-black">
                {p.follower.firstName} {p.follower.lastName}
              </div>
              <div className="mt-2 text-[13px] text-gray-500">
                {CATEGORY_LABELS[categoryFor(new Date(Math.min(+p.leader.birthDate, +p.follower.birthDate)))]}
              </div>
              <div className="mt-4 text-[14px] font-bold text-black">
                {[p.club?.name, p.secondClub?.name].filter(Boolean).join(" · ") || "Georgia (GEO)"}
              </div>
              </div>
            </Link>
          ))}
          {couples.length === 0 && (
            <div className="col-span-full py-10 text-center text-gray-500">წყვილები არ მოიძებნა.</div>
          )}
        </div>
      )}

      {/* Grid of Athletes matching WDSF exactly */}
      {tab !== "couples" && <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((a) => (
          <Link key={a.id} href={`/athletes/${a.id}`} className="block bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 transition-transform hover:-translate-y-1">
            <div className="aspect-square overflow-hidden bg-gray-100">
              <AthletePhoto athlete={a} />
            </div>
            <div className="p-5">
              <div className="font-bold text-[16px] text-black mb-1">
                {a.firstName} {a.lastName}
              </div>
              <div className="text-[13px] text-gray-500 mb-6">
                {CATEGORY_LABELS[categoryFor(a.birthDate)]}
              </div>
              <div className="text-[14px] font-bold text-black">
                {a.clubMemberships[0]?.club.name ?? "Georgia (GEO)"}
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-10 text-center text-gray-500">
            ათლეტები არ მოიძებნა.
          </div>
        )}
      </div>}
    </div>
  );
}
