import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  CATEGORY_LABELS,
  DISCIPLINE_LABELS,
  FORMAT_LABELS,
  fmtDate,
} from "@/lib/labels";
import { CompetitionSidebar } from "./CompetitionSidebar";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const c = await db.competition.findUnique({ where: { id: params.id, isPublished: true } });
  if (!c) return { title: "შეჯიბრება" };
  return {
    title: `${c.name} — შედეგები`,
    description: `${c.name}, ${c.city} — ოფიციალური შედეგები ივენთების მიხედვით.`,
  };
}

const TYPE_LABELS: Record<string, string> = {
  REGIONAL: "Regional",
  NATIONAL: "National",
  INTERNATIONAL: "International",
};

// e.g. "08/07/2026"
function fmtWDSFDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function CompetitionPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ eventId?: string; tab?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;
  const { eventId } = searchParams;
  const tab = searchParams.tab || (eventId ? 'results' : 'competitions');

  const comp = await db.competition.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: [{ ageCategory: "asc" }, { discipline: "asc" }, { format: "asc" }],
        include: {
          entries: {
            include: {
              athlete: true,
              partnership: { include: { leader: true, follower: true } },
              club: true,
              result: {
                include: { points: true }
              },
            },
          },
        },
      },
    },
  });
  if (!comp) notFound();

  // Display all events scheduled for this competition
  const displayEvents = comp.events;

  const totalSolos = comp.events.reduce((acc, ev) => acc + (ev.format === 'SOLO' ? ev.entries.length : 0), 0);
  const totalCouples = comp.events.reduce((acc, ev) => acc + (ev.format === 'COUPLE' ? ev.entries.length : 0), 0);

  const activeEvent = eventId ? displayEvents.find(ev => ev.id === eventId) : null;

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-10 pb-24">
      
      <div className="flex flex-col md:flex-row gap-8 items-start mt-6">
        
        {/* Left Sidebar Menu */}
        <CompetitionSidebar 
          events={displayEvents}
          activeEventId={eventId || null}
          competitionId={id}
          isInformationActive={!eventId && tab === 'information'}
        />

        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0">
          <h1 className="text-[28px] md:text-[34px] font-light uppercase text-gray-800 mb-10 leading-snug">
            {comp.city} - GEORGIA FROM {fmtWDSFDate(comp.startDate)}
            {comp.endDate && comp.endDate.getTime() !== comp.startDate.getTime() && ` TO ${fmtWDSFDate(comp.endDate)}`}
          </h1>

          {/* Top Tabs */}
          {!activeEvent && (
            <div className="flex border-b border-gray-300 mb-8">
              <Link href={`/competitions/${id}?tab=information`} className={`px-6 py-2.5 text-[15px] transition-colors cursor-pointer ${tab === 'information' ? 'font-bold text-black border-t-2 border-t-gray-300 border-l border-r border-gray-300 bg-white -mb-px' : 'font-medium text-gray-500 hover:text-black'}`}>
                ინფორმაცია
              </Link>
              <Link href={`/competitions/${id}?tab=competitions`} className={`px-6 py-2.5 text-[15px] transition-colors cursor-pointer ${tab === 'competitions' ? 'font-bold text-black border-t-2 border-t-gray-300 border-l border-r border-gray-300 bg-white -mb-px' : 'font-medium text-gray-500 hover:text-black'}`}>
                კატეგორიები
              </Link>
            </div>
          )}

          {/* Contact and Information Tab */}
          {!activeEvent && tab === 'information' && (
            <section className="mb-16">
              <div className="text-[14px] text-black space-y-4 max-w-3xl">
                <p>
                  <strong>ტურნირის სახელი:</strong> {comp.name} {comp.nameEn ? `(${comp.nameEn})` : ''}<br/>
                  <strong>თარიღი:</strong> {fmtDate(comp.startDate)}{comp.endDate ? ` - ${fmtDate(comp.endDate)}` : ''}<br/>
                  <strong>ადგილმდებარეობა:</strong> {comp.city}{comp.venue ? `, ${comp.venue}` : ''}<br/>
                  <strong>ტიპი:</strong> {TYPE_LABELS[comp.type]}<br/>
                  <strong>ორგანიზატორი:</strong> საქართველოს სპორტცეკვების ეროვნული ფედერაცია (სსცეფ)
                </p>
                <p className="mt-6 text-black">
                  ჯამში მონაწილეობს <strong>{totalSolos} სოლო სპორტსმენი</strong> და <strong>{totalCouples} წყვილი</strong>.
                </p>
              </div>
            </section>
          )}

          {/* Competitions Tab (List of Events) */}
          {!activeEvent && tab === 'competitions' && (
            <section className="mb-16">
              <p className="text-[14px] text-black mb-6">
                ჯამში მონაწილეობს <strong>{totalSolos} სოლო სპორტსმენი</strong> და <strong>{totalCouples} წყვილი</strong>.
              </p>
              
              <h2 className="text-[20px] font-bold text-black mb-4">
                {comp.startDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              
              <div className="flex flex-col gap-[2px]">
                {displayEvents.map(ev => {
                  const hasResults = ev.entries.some(e => e.result);
                  const isUpcoming = comp.startDate > new Date();
                  const statusText = hasResults 
                    ? 'დადასტურებული შედეგები' 
                    : 'მოლოდინშია';

                  return (
                    <Link key={ev.id} href={`/competitions/${id}?eventId=${ev.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 border-b-0 last:border-b hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-black text-[14px] uppercase mb-2 sm:mb-0">
                        {CATEGORY_LABELS[ev.ageCategory]} {DISCIPLINE_LABELS[ev.discipline]} {FORMAT_LABELS[ev.format]}
                      </span>
                      <span className={`text-[12px] font-bold ${hasResults ? 'text-[#c8923a]' : 'text-gray-400'}`}>
                        {statusText}
                      </span>
                    </Link>
                  );
                })}
                
                {displayEvents.length === 0 && (
                  <p className="text-[15px] text-gray-500 py-6 border border-gray-200 p-4">
                    ღონისძიებები არ არის დაგეგმილი.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Active Event Results View */}
          {activeEvent && (
            <section className="mb-16">
              <h3 className="text-[18px] font-bold text-black mb-6 pb-2 border-b border-gray-200 uppercase">
                {CATEGORY_LABELS[activeEvent.ageCategory]} · {DISCIPLINE_LABELS[activeEvent.discipline]} · {FORMAT_LABELS[activeEvent.format]}
              </h3>
              
              {(() => {
                const rows = activeEvent.entries
                  .filter((e) => e.result)
                  .sort((a, b) => a.result!.placement - b.result!.placement);
                  
                return (
                  <div className="overflow-x-auto border border-gray-200">
                    <table className="w-full text-left text-[14px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 font-bold text-black w-12 text-center"></th>
                          <th className="px-4 py-3 font-bold text-black">{activeEvent.format === "COUPLE" ? "წყვილი" : "სპორტსმენი"}</th>
                          <th className="px-4 py-3 font-bold text-black">კლუბი</th>
                          <th className="px-4 py-3 font-bold text-black text-center">სტარტ #</th>
                          <th className="px-4 py-3 font-bold text-black text-center">Base</th>
                          <th className="px-4 py-3 font-bold text-black text-center">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {rows.map((e, i) => {
                          const earnedPoints = e.result!.points[0]?.points || 0;
                          return (
                          <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 text-[#c8923a] text-center font-medium">
                              {e.result!.placement}.
                            </td>
                            <td className="px-4 py-4 font-bold">
                              {activeEvent.format === "COUPLE" && e.partnership ? (
                                <Link href={`/couples/${e.partnershipId}`} className="text-[#c8923a] hover:underline transition-colors">
                                  {e.partnership.leader.lastName} & {e.partnership.follower.lastName}
                                </Link>
                              ) : e.athlete ? (
                                <Link href={`/athletes/${e.athleteId}`} className="text-[#c8923a] hover:underline transition-colors">
                                  {e.athlete.firstName} {e.athlete.lastName}
                                </Link>
                              ) : null}
                            </td>
                            <td className="px-4 py-4 text-gray-600">
                              {e.club?.name || "Georgia"}
                            </td>
                            <td className="px-4 py-4 text-gray-800 text-center">
                              {e.startNumber || "—"}
                            </td>
                            <td className="px-4 py-4 text-gray-800 text-center">
                              {comp.pointsCoefficient.toFixed(1)}
                            </td>
                            <td className="px-4 py-4 font-bold text-black text-center">
                              {earnedPoints}
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
