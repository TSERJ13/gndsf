import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "კალენდარი" };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function fmtMonth(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtDateRange(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; view?: string }>;
}) {
  const { f, view = "list" } = await searchParams;
  const filter = f === "intl" ? { isIntl: true } : f === "geo" ? { isIntl: false } : {};

  // Fetch manual calendar events
  const manualEvents = await db.calendarEvent.findMany({
    where: filter,
  });

  // Fetch actual competitions (both published and upcoming)
  const comps = await db.competition.findMany();

  // Map competitions to calendar format
  const compEvents = comps.map(c => ({
    id: c.id,
    title: c.name,
    titleEn: c.nameEn,
    city: c.city,
    date: c.startDate,
    isIntl: c.type === "INTERNATIONAL",
    link: `/competitions/${c.id}`
  }));

  const compTitles = new Set(compEvents.map(c => c.title.toLowerCase()));
  const compDates = new Map(compEvents.map(c => [c.date.toISOString().split('T')[0], c.id]));

  const manualMapped = manualEvents.filter(e => !compTitles.has(e.title.toLowerCase())).map(e => {
    // If no link is provided, try to find a competition on the exact same day
    const dateStr = e.date.toISOString().split('T')[0];
    const matchingCompId = compDates.get(dateStr);
    
    return {
      id: e.id,
      title: e.title,
      titleEn: e.titleEn,
      city: e.city,
      date: e.date,
      isIntl: e.isIntl,
      link: e.link || (matchingCompId ? `/competitions/${matchingCompId}` : `/competitions?q=${encodeURIComponent(e.title)}`)
    };
  });

  // Apply filters to combined list
  let allEvents = [...compEvents, ...manualMapped];
  if (f === "intl") allEvents = allEvents.filter(e => e.isIntl);
  if (f === "geo") allEvents = allEvents.filter(e => !e.isIntl);

  // Sort by date ascending
  allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  const upcoming = allEvents.filter((e) => +e.date >= Date.now() - 864e5);

  // Group by month
  const grouped: Record<string, typeof allEvents> = {};
  for (const e of upcoming) {
    const m = fmtMonth(e.date);
    if (!grouped[m]) grouped[m] = [];
    grouped[m].push(e);
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-10 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <h1 className="text-3xl md:text-4xl lg:text-[40px] font-light uppercase text-black tracking-wide">
          შეჯიბრებების კალენდარი
        </h1>
        
        {/* View Toggle Checkbox (Matching Rankings Page) */}
        <Link 
          href={`/calendar?f=${f || ''}&view=${view === 'list' ? 'classic' : 'list'}`}
          className="flex items-center gap-3 text-[14px] font-bold text-gray-800 hover:text-black cursor-pointer"
        >
          <div className={`flex h-[18px] w-[18px] items-center justify-center rounded-[3px] border ${view === 'classic' ? 'border-[#c49a5b] bg-[#c49a5b]' : 'border-gray-300 bg-white'}`}>
            {view === 'classic' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
          </div>
          Classic View
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-300 mb-10 flex-wrap">
        <Link href={`/calendar?view=${view}`} className={`px-6 py-2 text-[15px] cursor-pointer transition-colors ${!f ? 'font-bold text-black border-t-2 border-t-[#c49a5b] border-l border-r border-gray-300 bg-white -mb-px' : 'font-medium text-gray-500 hover:text-black'}`}>
          ყველა
        </Link>
        <Link href={`/calendar?f=geo&view=${view}`} className={`px-6 py-2 text-[15px] cursor-pointer transition-colors ${f === 'geo' ? 'font-bold text-black border-t-2 border-t-[#c49a5b] border-l border-r border-gray-300 bg-white -mb-px' : 'font-medium text-gray-500 hover:text-black'}`}>
          საქართველო
        </Link>
        <Link href={`/calendar?f=intl&view=${view}`} className={`px-6 py-2 text-[15px] cursor-pointer transition-colors ${f === 'intl' ? 'font-bold text-black border-t-2 border-t-[#c49a5b] border-l border-r border-gray-300 bg-white -mb-px' : 'font-medium text-gray-500 hover:text-black'}`}>
          საერთაშორისო
        </Link>
      </div>

      {upcoming.length === 0 && (
        <div className="py-10 text-center text-gray-500">
          კალენდარი ცარიელია.
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="flex flex-col gap-12">
          {Object.entries(grouped).map(([month, monthEvents]) => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-[22px] font-bold text-black">{month}</h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c49a5b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div className="flex flex-col border border-gray-200 bg-white">
                {monthEvents.map((e, idx) => {
                  const actualLink = e.link || `/competitions?q=${encodeURIComponent(e.title)}`;
                  const isExternal = actualLink.startsWith('http');
                  
                  const Content = (
                    <div className={`flex flex-col md:flex-row p-6 items-start md:items-center gap-6 relative ${idx !== monthEvents.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}>
                      {/* Left Colored Border */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${e.isIntl ? 'bg-[#00529b]' : 'bg-[#e56a39]'}`} />
                      
                      {/* Date */}
                      <div className="md:w-[220px] shrink-0 font-bold text-[#00529b] pl-2">
                        {fmtDateRange(e.date)}
                      </div>
                      
                      {/* Location */}
                      <div className="md:w-[250px] shrink-0 font-bold text-black flex items-center gap-2">
                        {e.city || "—"}
                      </div>
                      
                      {/* Details / Categories */}
                      <div className="flex-1 text-[14px] text-gray-800">
                        <span className="font-bold">{e.title}</span>
                        <div className="text-gray-500 mt-1">
                          {e.titleEn && <span className="mr-2">{e.titleEn}</span>}
                          {e.isIntl ? <span className="inline-block px-2 py-0.5 bg-[#00529b]/10 text-[#00529b] rounded text-[11px] font-bold uppercase tracking-wider">International</span> : <span className="inline-block px-2 py-0.5 bg-[#e56a39]/10 text-[#e56a39] rounded text-[11px] font-bold uppercase tracking-wider">National</span>}
                        </div>
                      </div>
                    </div>
                  );

                  return (
                    <Link key={e.id} href={actualLink} target={isExternal ? "_blank" : undefined} className="block group">
                      {Content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CLASSIC (GRID) VIEW */}
      {view === "classic" && (
        <div className="flex flex-col gap-12">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-[13px] font-bold">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#00529b] rounded-sm"></div>
              International
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#e56a39] rounded-sm"></div>
              National
            </div>
          </div>

          {Object.entries(grouped).map(([month, monthEvents]) => {
            // Generate grid for the month
            const firstEventDate = monthEvents[0].date;
            const year = firstEventDate.getFullYear();
            const monthIdx = firstEventDate.getMonth();
            const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
            const firstDayOfWeek = new Date(year, monthIdx, 1).getDay(); // 0 = Sun
            const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 0 = Mon
            
            const days = Array.from({ length: 42 }, (_, i) => {
              const dayNum = i - startOffset + 1;
              if (dayNum > 0 && dayNum <= daysInMonth) return dayNum;
              return null;
            });

            // If last row is empty, trim it
            if (days.slice(35).every(d => d === null)) {
              days.splice(35);
            }

            return (
              <div key={month} className="bg-white border border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-50 text-center font-bold text-[20px] text-black">
                  {month}
                </div>
                
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-gray-200 bg-white">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <div key={d} className="p-2 text-center text-[12px] font-bold text-gray-500 border-r border-gray-200 last:border-r-0">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 border-b border-gray-200 last:border-b-0 bg-white">
                  {days.map((dayNum, i) => {
                    const cellEvents = dayNum 
                      ? monthEvents.filter(e => e.date.getDate() === dayNum)
                      : [];

                    return (
                      <div key={i} className={`min-h-[120px] p-2 border-r border-b border-gray-100 last:border-r-0 ${!dayNum ? 'bg-gray-50' : ''}`}>
                        {dayNum && (
                          <div className="font-bold text-[14px] text-gray-700 mb-2">{dayNum}</div>
                        )}
                        <div className="flex flex-col gap-1.5">
                          {cellEvents.map(e => {
                            const actualLink = e.link || `/competitions?q=${encodeURIComponent(e.title)}`;
                            return (
                              <Link 
                                key={e.id}
                                href={actualLink}
                                target={actualLink.startsWith('http') ? "_blank" : undefined}
                                className={`block p-1.5 text-[11px] leading-tight font-bold text-white rounded-sm transition-opacity hover:opacity-80 ${e.isIntl ? 'bg-[#00529b]' : 'bg-[#e56a39]'}`}
                              >
                                {e.title}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
