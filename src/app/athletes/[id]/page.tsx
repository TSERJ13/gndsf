import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  CATEGORY_LABELS,
  DISCIPLINE_LABELS,
  FORMAT_LABELS,
  categoryFor,
  fmtDate,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await db.athlete.findUnique({
    where: { id },
    include: { clubMemberships: { where: { endDate: null }, include: { club: true } } },
  });
  if (!a) return { title: "სპორტსმენი" };
  const name = `${a.firstName} ${a.lastName}`;
  const club = a.clubMemberships[0]?.club.name;
  return {
    title: name,
    description: `${name} (${a.gid}) — ${CATEGORY_LABELS[categoryFor(a.birthDate)]}${club ? `, ${club}` : ""}. რეიტინგი, ქულები და შეჯიბრებების ისტორია gndsf.ge-ზე.`,
  };
}

export default async function AthletePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "general" } = await searchParams;

  const athlete = await db.athlete.findUnique({
    where: { id },
    include: {
      clubMemberships: { include: { club: true }, orderBy: { startDate: "desc" } },
      asLeader: {
        include: { follower: true },
        orderBy: { startDate: "desc" },
      },
      asFollower: {
        include: { leader: true },
        orderBy: { startDate: "desc" },
      },
      rankingPoints: { 
        where: { validUntil: { gte: new Date() } },
        include: { result: { include: { entry: { include: { event: true } } } } }
      },
    },
  });
  if (!athlete) notFound();

  const entries = await db.entry.findMany({
    where: {
      OR: [
        { athleteId: id },
        { partnership: { OR: [{ leaderId: id }, { followerId: id }] } },
      ],
    },
    include: {
      event: { include: { competition: true } },
      partnership: { include: { leader: true, follower: true } },
      club: true,
      result: true,
    },
    orderBy: { event: { competition: { startDate: "desc" } } },
  });

  const groupedPoints = athlete.rankingPoints.reduce((acc, rp) => {
    const ev = rp.result?.entry?.event;
    if (!ev) return acc;
    const key = `${CATEGORY_LABELS[ev.ageCategory]} · ${DISCIPLINE_LABELS[ev.discipline]}`;
    acc[key] = (acc[key] || 0) + rp.points;
    return acc;
  }, {} as Record<string, number>);

  const currentClub = athlete.clubMemberships.find((m) => !m.endDate)?.club;

  return (
    <div className="mx-auto max-w-[1100px] px-4 md:px-6 pt-10 pb-20">
      <h1 className="text-3xl md:text-4xl lg:text-[40px] font-light uppercase text-black mb-8 leading-tight tracking-wide">
        {athlete.firstName} {athlete.lastName}
      </h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-300 mb-10">
        <Link 
          href={`/athletes/${id}?tab=general`}
          className={`px-6 py-2 text-[15px] ${tab === 'general' ? 'font-bold text-black border-t-2 border-t-[#c49a5b] border-l border-r border-gray-300 bg-white -mb-px' : 'font-medium text-gray-500 hover:text-black transition-colors'}`}
        >
          General
        </Link>
        <Link 
          href={`/athletes/${id}?tab=competitions`}
          className={`px-6 py-2 text-[15px] ${tab === 'competitions' ? 'font-bold text-black border-t-2 border-t-[#c49a5b] border-l border-r border-gray-300 bg-white -mb-px' : 'font-medium text-gray-500 hover:text-black transition-colors'}`}
        >
          Competitions
        </Link>
        <Link 
          href={`/athletes/${id}?tab=partner`}
          className={`px-6 py-2 text-[15px] ${tab === 'partner' ? 'font-bold text-black border-t-2 border-t-[#c49a5b] border-l border-r border-gray-300 bg-white -mb-px' : 'font-medium text-gray-500 hover:text-black transition-colors'}`}
        >
          Partner
        </Link>
      </div>

      {tab === 'general' ? (
        <div className="flex flex-row gap-6 md:gap-16 items-start">
          {/* Left Column: Photo Area */}
          <div className="w-[120px] sm:w-[180px] md:w-[220px] shrink-0">
            <div className="aspect-[3/4] w-full bg-gray-100 flex items-center justify-center overflow-hidden">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>

          {/* Right Column: Info */}
          <div className="flex-1 md:border-l border-[#c49a5b]/60 md:pl-8 overflow-hidden">
            <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[160px_1fr] gap-y-3 sm:gap-y-4 text-[13px] sm:text-[15px]">
              <div className="font-bold text-black">Name</div>
              <div className="text-black break-words">{athlete.firstName}</div>
              
              <div className="font-bold text-black">Surname</div>
              <div className="text-black break-words">{athlete.lastName}</div>

              <div className="font-bold text-black">Dancing for</div>
              <div className="text-black">Georgia</div>

              <div className="font-bold text-black">MIN</div>
              <div className="text-black">{athlete.gid}</div>

              <div className="font-bold text-black">Current status</div>
              <div className="text-black">Active</div>

              <div className="font-bold text-black">Division</div>
              <div className="text-black">General</div>

              <div className="font-bold text-black">Age group</div>
              <div className="text-black">{CATEGORY_LABELS[categoryFor(athlete.birthDate)]}</div>

              {currentClub && (
                <>
                  <div className="font-bold text-black">Club</div>
                  <div className="text-black break-words">{currentClub.name}</div>
                </>
              )}
              
              <div className="font-bold text-black">Active points</div>
              {Object.keys(groupedPoints).length > 0 ? (
                <div className="flex flex-col gap-1">
                  {Object.entries(groupedPoints).map(([key, pts]) => (
                    <div key={key} className="text-black">
                      {pts} <span className="text-gray-500">({key})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-black">0</div>
              )}
            </div>
          </div>
        </div>
      ) : tab === 'competitions' ? (
        <div>
          {entries.length === 0 ? (
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
                  {entries.map((e, idx) => (
                    <tr key={e.id} className={`${idx % 2 === 1 ? 'bg-[#fcfaf8]' : 'bg-white'} hover:bg-gray-50 transition-colors`}>
                      <td className="py-4 pr-4 text-black">
                        {e.result ? `${e.result.placement}.` : "-"}
                      </td>
                      <td className="px-4 py-4 text-black whitespace-nowrap">
                        {fmtDate(e.event.competition.startDate)}
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/competitions/${e.event.competitionId}`} className="text-[#c49a5b] hover:underline transition-colors">
                          {e.event.competition.title || e.event.competition.name}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-black">
                        {DISCIPLINE_LABELS[e.event.discipline]}
                      </td>
                      <td className="px-4 py-4 text-black">
                        {CATEGORY_LABELS[e.event.category]}
                      </td>
                      <td className="px-4 py-4 text-black">
                        {e.event.competition.city}{e.event.competition.country ? `, ${e.event.competition.country}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : tab === 'partner' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="border-b-2 border-[#c49a5b]">
              <tr>
                <th className="py-3 pr-4 font-bold text-black">Couple</th>
                <th className="px-4 py-3 font-bold text-black">Name</th>
                <th className="px-4 py-3 font-bold text-black">Competing for</th>
                <th className="px-4 py-3 font-bold text-black">Status</th>
                <th className="px-4 py-3 font-bold text-black">Joined</th>
                <th className="px-4 py-3 font-bold text-black">Retired</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c49a5b]/20">
              {[...athlete.asLeader, ...athlete.asFollower].sort((a, b) => +b.startDate - +a.startDate).map((p, idx) => {
                const partner = p.leaderId === athlete.id ? (p as any).follower : (p as any).leader;
                return (
                  <tr key={p.id} className={`${idx % 2 === 1 ? 'bg-[#fcfaf8]' : 'bg-white'} hover:bg-gray-50 transition-colors`}>
                    <td className="py-4 pr-4">
                      <Link href={`/couples/${p.id}`} className="text-[#c49a5b] hover:underline">info</Link>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/athletes/${partner.id}`} className="text-[#c49a5b] hover:underline">
                        {partner.firstName} {partner.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-black">Georgia</td>
                    <td className="px-4 py-4 text-black">{p.endDate ? "Retired" : "Active"}</td>
                    <td className="px-4 py-4 text-black">{fmtDate(p.startDate)}</td>
                    <td className="px-4 py-4 text-black">{p.endDate ? fmtDate(p.endDate) : ""}</td>
                  </tr>
                );
              })}
              {[...athlete.asLeader, ...athlete.asFollower].length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    No partnerships found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : null}


    </div>
  );
}
