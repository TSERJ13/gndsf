import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { CATEGORY_LABELS, DISCIPLINE_LABELS, fmtDate } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function CouplePage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "general" } = await searchParams;
  const p = await db.partnership.findUnique({
    where: { id },
    include: {
      leader: true,
      follower: true,
      entries: {
        include: {
          event: { include: { competition: true } },
          result: true,
        },
        orderBy: { event: { competition: { startDate: "desc" } } },
      },
      rankingEntries: true,
    },
  });
  if (!p) notFound();

  return (
    <div className="mx-auto max-w-[1100px] px-4 md:px-6 pt-10 pb-20">
      <h1 className="text-3xl md:text-4xl lg:text-[40px] font-light uppercase text-black mb-8 leading-tight tracking-wide">
        {p.leader.firstName} {p.leader.lastName} - {p.follower.firstName} {p.follower.lastName}
      </h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-300 mb-10">
        <Link 
          href={`/couples/${id}?tab=general`}
          className={`px-6 py-2 text-[15px] ${tab === 'general' ? 'font-bold text-black border-t-2 border-t-[#c49a5b] border-l border-r border-gray-300 bg-white -mb-px' : 'font-medium text-gray-500 hover:text-black transition-colors'}`}
        >
          General
        </Link>
        <Link 
          href={`/couples/${id}?tab=competitions`}
          className={`px-6 py-2 text-[15px] ${tab === 'competitions' ? 'font-bold text-black border-t-2 border-t-[#c49a5b] border-l border-r border-gray-300 bg-white -mb-px' : 'font-medium text-gray-500 hover:text-black transition-colors'}`}
        >
          Competitions
        </Link>
      </div>

      {tab === 'general' ? (
        <div className="flex flex-row gap-6 md:gap-16 items-start">
          {/* Left Column: Photo Area */}
          <div className="w-[120px] sm:w-[180px] md:w-[220px] shrink-0">
            <div className="aspect-[3/4] w-full flex flex-col overflow-hidden">
              <div className="h-1/2 w-full bg-gray-100 flex items-center justify-center border-b border-white">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="h-1/2 w-full bg-gray-200 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Column: Info */}
          <div className="flex-1 md:border-l border-[#c49a5b]/60 md:pl-8 overflow-hidden">
            <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[160px_1fr] gap-y-3 sm:gap-y-4 text-[13px] sm:text-[15px]">
              <div className="font-bold text-black">Man</div>
              <div className="break-words">
                <Link href={`/athletes/${p.leaderId}`} className="text-[#c49a5b] hover:underline">
                  {p.leader.firstName} {p.leader.lastName}
                </Link>
                <span className="text-gray-600 ml-1 hidden sm:inline">({p.leader.gid})</span>
              </div>
              
              <div className="font-bold text-black">Woman</div>
              <div className="break-words">
                <Link href={`/athletes/${p.followerId}`} className="text-[#c49a5b] hover:underline">
                  {p.follower.firstName} {p.follower.lastName}
                </Link>
                <span className="text-gray-600 ml-1 hidden sm:inline">({p.follower.gid})</span>
              </div>

              <div className="font-bold text-black">Dancing for</div>
              <div className="text-black">Georgia</div>

              <div className="font-bold text-black">Joined on</div>
              <div className="text-black">{fmtDate(p.startDate)}</div>

              <div className="font-bold text-black">Status</div>
              <div className="text-black">{p.endDate ? "Inactive" : "Active"}</div>

              <div className="font-bold text-black">Division</div>
              <div className="text-black">General</div>
              
              {p.rankingEntries.length > 0 && (
                <>
                  <div className="font-bold text-black pt-1 sm:pt-0">Rankings</div>
                  <div className="flex flex-col gap-1 pt-1 sm:pt-0">
                    {p.rankingEntries.map((r) => (
                      <div key={r.id} className="text-black">
                        #{r.position} · <span className="font-medium">{r.totalPoints} pts</span> · {CATEGORY_LABELS[r.ageCategory]} · {DISCIPLINE_LABELS[r.discipline]}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : tab === 'competitions' ? (
        <div>
          {p.entries.length === 0 ? (
            <p className="text-[15px] text-gray-500">
              No results found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="border-b-2 border-[#c49a5b]">
                  <tr>
                    <th className="py-3 pr-4 font-bold text-black w-16">Rank</th>
                    <th className="px-4 py-3 font-bold text-black w-32">Date</th>
                    <th className="px-4 py-3 font-bold text-black">Event</th>
                    <th className="px-4 py-3 font-bold text-black">Discipline</th>
                    <th className="px-4 py-3 font-bold text-black">Category</th>
                    <th className="px-4 py-3 font-bold text-black">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c49a5b]/20">
                  {p.entries.map((e, idx) => (
                    <tr key={e.id} className={`${idx % 2 === 1 ? 'bg-[#fcfaf8]' : 'bg-white'} hover:bg-gray-50 transition-colors`}>
                      <td className="py-4 pr-4 text-black">
                        {e.result ? `${e.result.placement}.` : "-"}
                      </td>
                      <td className="px-4 py-4 text-black whitespace-nowrap">
                        {fmtDate(e.event.competition.startDate)}
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/competitions/${e.event.competition.id}`} className="text-[#c49a5b] hover:underline transition-colors">
                          {e.event.competition.name}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-black">
                        {DISCIPLINE_LABELS[e.event.discipline]}
                      </td>
                      <td className="px-4 py-4 text-black">
                        {CATEGORY_LABELS[e.ageCategorySnapshot]}
                      </td>
                      <td className="px-4 py-4 text-black">
                        {e.event.competition.city}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
