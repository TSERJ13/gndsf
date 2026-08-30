import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "კლუბები" };

export default async function ClubsPage() {
  let clubs: any[] = [];
  try {
    clubs = await db.club.findMany({
      where: { isActive: true },
      include: { _count: { select: { memberships: { where: { endDate: null } } } } },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error("ClubsPage DB error:", err);
  }
  
  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-10 pb-24">
      <h1 className="text-3xl md:text-4xl lg:text-[40px] font-light uppercase text-black mb-10 tracking-wide">
        რეგისტრირებული კლუბები
      </h1>

      {/* Search Bar matching WDSF */}
      <form className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input
            type="search"
            name="q"
            placeholder="Search clubs..."
            className="w-full sm:w-[320px] rounded-full border border-gray-300 bg-white px-5 py-2.5 text-[14px] outline-none transition-all placeholder:text-gray-400 focus:border-[#B83A14]"
          />
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-full bg-[#B83A14] hover:bg-[#8B1E0F] transition-colors px-6 py-2.5 text-[14px] font-bold text-white shadow-sm">
              Go
            </button>
            <Link href="/clubs" className="rounded-full bg-[#B83A14] hover:bg-[#8B1E0F] transition-colors px-6 py-2.5 text-[14px] font-bold text-white shadow-sm inline-block">
              Clear
            </Link>
          </div>
        </div>
      </form>

      {/* Grid of Clubs matching WDSF exactly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {clubs.map((c) => (
          <div key={c.id} className="block bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 transition-transform hover:-translate-y-1">
            <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative">
              <div className="w-16 h-16 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M3 21h18" />
                  <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                  <path d="M9 21v-4a2 2 0 0 1 4 0v4" />
                  <path d="M9 7h6" />
                  <path d="M9 11h6" />
                  <path d="M9 15h6" />
                </svg>
              </div>
            </div>
            <div className="p-5">
              <div className="font-bold text-[16px] text-black mb-1">
                {c.name}
              </div>
              <div className="text-[13px] text-gray-500 mb-6">
                City: {c.city}
              </div>
              <div className="text-[14px] font-bold text-black flex justify-between items-center">
                <span>Georgia (GEO)</span>
                <span className="text-[#B83A14]">{c._count.memberships} Ath.</span>
              </div>
            </div>
          </div>
        ))}
        {clubs.length === 0 && (
          <div className="col-span-full py-10 text-center text-gray-500">
            კლუბები არ მოიძებნა.
          </div>
        )}
      </div>
    </div>
  );
}
