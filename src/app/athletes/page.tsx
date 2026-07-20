import Link from "next/link";
import { db } from "@/lib/db";
import { CATEGORIES, CATEGORY_LABELS, categoryFor } from "@/lib/labels";
import type { AgeCategory } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "სპორტსმენები" };

type Search = { q?: string; cat?: string };

export default async function AthletesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q, cat } = await searchParams;

  const athletes = await db.athlete.findMany({
    where: {
      isActive: true,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { firstNameEn: { contains: q, mode: "insensitive" } },
              { lastNameEn: { contains: q, mode: "insensitive" } },
              { gid: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
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

  const filtered = cat
    ? athletes.filter((a) => categoryFor(a.birthDate) === (cat as AgeCategory))
    : athletes;

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-10 pb-24">
      <h1 className="text-3xl md:text-4xl lg:text-[40px] font-light uppercase text-black mb-10 tracking-wide">
        სპორტსმენების ბაზა
      </h1>

      {/* Search Bar matching WDSF */}
      <form className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12" action="/athletes">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by [name, surname] or MIN"
            className="w-full sm:w-[320px] rounded-full border border-gray-300 bg-white px-5 py-2.5 text-[14px] outline-none transition-all placeholder:text-gray-400 focus:border-[#B83A14]"
          />
          <div className="flex items-center gap-2">
            <button className="rounded-full bg-[#B83A14] hover:bg-[#8B1E0F] transition-colors px-6 py-2.5 text-[14px] font-bold text-white shadow-sm">
              Go
            </button>
            <Link href="/athletes" className="rounded-full bg-[#B83A14] hover:bg-[#8B1E0F] transition-colors px-6 py-2.5 text-[14px] font-bold text-white shadow-sm inline-block">
              Clear
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-6 self-start md:self-auto">
          <label className="flex items-center gap-2 cursor-pointer text-[14px] font-bold text-black">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#B83A14] focus:ring-[#B83A14]" />
            Show as table
          </label>
          <button type="button" className="text-[14px] font-medium text-black flex items-center gap-1 hover:text-[#B83A14]">
            Advanced filter
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </form>

      {/* Grid of Athletes matching WDSF exactly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((a) => (
          <Link key={a.id} href={`/athletes/${a.id}`} className="block bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 transition-transform hover:-translate-y-1">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
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
            </div>
            <div className="p-5">
              <div className="font-bold text-[16px] text-black mb-1">
                {a.firstName} {a.lastName}
              </div>
              <div className="text-[13px] text-gray-500 mb-6">
                Age group: {CATEGORY_LABELS[categoryFor(a.birthDate)]}
              </div>
              <div className="text-[14px] font-bold text-black">
                Georgia (GEO)
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-10 text-center text-gray-500">
            სპორტსმენები არ მოიძებნა.
          </div>
        )}
      </div>
    </div>
  );
}
