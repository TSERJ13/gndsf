import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "შედეგები" };

const TYPE_LABELS: Record<string, string> = {
  REGIONAL: "Regional",
  NATIONAL: "National",
  INTERNATIONAL: "International",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function fmtMonth(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtDateRange(start: Date, end?: Date | null) {
  const m1 = MONTHS[start.getMonth()];
  const y1 = start.getFullYear();
  const d1 = start.getDate();

  if (!end) return `${d1} ${m1} ${y1}`;
  
  const m2 = MONTHS[end.getMonth()];
  const y2 = end.getFullYear();
  const d2 = end.getDate();

  if (y1 === y2 && m1 === m2 && d1 === d2) return `${d1} ${m1} ${y1}`;
  if (y1 === y2 && m1 === m2) return `${d1} - ${d2} ${m1} ${y1}`;
  if (y1 === y2) return `${d1} ${m1} - ${d2} ${m2} ${y1}`;
  return `${d1} ${m1} ${y1} - ${d2} ${m2} ${y2}`;
}

export default async function CompetitionsPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.q;

  let comps: any[] = [];
  try {
    comps = await db.competition.findMany({
      orderBy: { startDate: "desc" },
      include: { _count: { select: { events: true } } },
    });
  } catch (err) {
    console.error("CompetitionsPage DB error:", err);
  }

  // Strict substring matching to avoid false positives
  const matchedComps = q ? comps.filter(c => {
    const qL = q.toLowerCase();
    const nL = c.name.toLowerCase();
    const nEnL = c.nameEn?.toLowerCase() || "";
    return nL.includes(qL) || (nEnL && nEnL.includes(qL));
  }) : [];

  // Auto-redirect if exactly one match is found
  if (q && matchedComps.length === 1) {
    redirect(`/competitions/${matchedComps[0].id}`);
  }

  // Filter comps for display if there's a search, but don't require published if searching
  const displayComps = q ? matchedComps : comps.filter(c => c.isPublished);

  // Group by month
  const grouped: Record<string, typeof displayComps> = {};
  for (const c of displayComps) {
    const m = fmtMonth(c.startDate);
    if (!grouped[m]) grouped[m] = [];
    grouped[m].push(c);
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-10 pb-24">
      <h1 className="text-3xl md:text-4xl lg:text-[40px] font-light uppercase text-black mb-10 tracking-wide">
        შეჯიბრებების შედეგები
      </h1>

      {/* Search Bar matching WDSF filter style */}
      <form className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 border-b border-gray-100 pb-8">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input
            type="search"
            name="q"
            defaultValue={q || ""}
            placeholder="Search competitions..."
            className="w-full sm:w-[320px] rounded-none border border-gray-300 bg-white px-5 py-2.5 text-[14px] outline-none transition-all placeholder:text-gray-400 focus:border-black"
          />
          <div className="flex items-center gap-2">
            <button type="submit" className="bg-black hover:bg-gray-800 transition-colors px-6 py-2.5 text-[14px] font-bold text-white rounded-none">
              Go
            </button>
            <Link href="/competitions" className="bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors px-6 py-2.5 text-[14px] font-bold inline-block border border-gray-200 rounded-none">
              Clear
            </Link>
          </div>
        </div>
        <button type="button" className="text-[14px] font-bold text-gray-800 hover:text-black flex items-center gap-2">
          Advanced filter
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </form>

      {displayComps.length === 0 && (
        <div className="py-10 text-center text-gray-500">
          გამოქვეყნებული შედეგები ჯერ არ არის.
        </div>
      )}

      {/* Competitions List matching Calendar layout */}
      <div className="flex flex-col gap-12">
        {Object.entries(grouped).map(([month, monthComps]) => (
          <div key={month}>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-[22px] font-bold text-black">{month}</h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c49a5b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div className="flex flex-col border border-gray-200 bg-white">
              {monthComps.map((c, idx) => (
                <Link key={c.id} href={`/competitions/${c.id}`} className="block group">
                  <div className={`flex flex-col md:flex-row p-6 items-start md:items-center gap-6 relative ${idx !== monthComps.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}>
                    {/* Left Colored Border */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${c.type === 'INTERNATIONAL' ? 'bg-[#00529b]' : 'bg-[#e56a39]'}`} />
                    
                    {/* Date */}
                    <div className="md:w-[220px] shrink-0 font-bold text-[#00529b] pl-2">
                      {fmtDateRange(c.startDate, c.endDate)}
                    </div>
                    
                    {/* Location */}
                    <div className="md:w-[250px] shrink-0 font-bold text-black flex items-center gap-2">
                      {c.city || "—"}
                    </div>
                    
                    {/* Details / Categories */}
                    <div className="flex-1 text-[14px] text-gray-800">
                      <span className="font-bold">{c.name}</span>
                      <div className="text-gray-500 mt-1">
                        {c.nameEn && <span className="mr-2">{c.nameEn}</span>}
                        {c.type === 'INTERNATIONAL' ? <span className="inline-block px-2 py-0.5 bg-[#00529b]/10 text-[#00529b] rounded text-[11px] font-bold uppercase tracking-wider">International</span> : <span className="inline-block px-2 py-0.5 bg-[#e56a39]/10 text-[#e56a39] rounded text-[11px] font-bold uppercase tracking-wider">{TYPE_LABELS[c.type]}</span>}
                        <span className="inline-block ml-3 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-bold uppercase tracking-wider">{c._count.events} Events</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
