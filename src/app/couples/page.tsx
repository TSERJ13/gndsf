import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "წყვილები" };

export default async function CouplesPage() {
  let couples: any[] = [];
  try {
    couples = await db.partnership.findMany({
      where: { endDate: null },
      include: {
        leader: true,
        follower: true,
      },
      orderBy: { startDate: "desc" },
      take: 100,
    });
  } catch (err) {
    console.error("CouplesPage DB error:", err);
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-10 pb-24">
      <h1 className="text-3xl md:text-4xl lg:text-[40px] font-light uppercase text-black mb-10 tracking-wide">
        წყვილების ბაზა
      </h1>

      {/* Search Bar matching WDSF */}
      <form className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input
            type="search"
            name="q"
            placeholder="Search by [name, surname] or MIN"
            className="w-full sm:w-[320px] rounded-full border border-gray-300 bg-white px-5 py-2.5 text-[14px] outline-none transition-all placeholder:text-gray-400 focus:border-[#B83A14]"
          />
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-full bg-[#B83A14] hover:bg-[#8B1E0F] transition-colors px-6 py-2.5 text-[14px] font-bold text-white shadow-sm">
              Go
            </button>
            <Link href="/couples" className="rounded-full bg-[#B83A14] hover:bg-[#8B1E0F] transition-colors px-6 py-2.5 text-[14px] font-bold text-white shadow-sm inline-block">
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

      {/* Grid of Couples matching WDSF exactly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {couples.map((c) => (
          <Link key={c.id} href={`/couples/${c.id}`} className="block bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 transition-transform hover:-translate-y-1">
            <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative">
              <div className="flex items-center justify-center gap-4">
                {/* Leader (Boy) */}
                <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
                  <path d="M 20 26 C 20 44, 44 44, 44 26" />
                  <path d="M 20 26 C 24 18, 28 26, 32 22 C 36 18, 40 24, 44 26 C 44 6, 20 6, 20 26 Z" />
                </svg>
                
                {/* Follower (Girl) */}
                <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
                  <path d="M 22 32 C 22 46, 42 46, 42 32" />
                  <path d="M 16 46 L 22 40 C 20 30, 28 22, 32 18 C 36 22, 44 30, 42 40 L 48 46 L 46 24 C 46 4, 18 4, 18 24 Z" />
                </svg>
              </div>
            </div>
            <div className="p-5">
              <div className="font-bold text-[16px] text-black mb-1">
                {c.leader.lastName} & {c.follower.lastName}
              </div>
              <div className="text-[13px] text-gray-500 mb-6">
                Joined: {fmtDate(c.startDate)}
              </div>
              <div className="text-[14px] font-bold text-black">
                Georgia (GEO)
              </div>
            </div>
          </Link>
        ))}
        {couples.length === 0 && (
          <div className="col-span-full py-10 text-center text-gray-500">
            წყვილები არ მოიძებნა.
          </div>
        )}
      </div>
    </div>
  );
}
