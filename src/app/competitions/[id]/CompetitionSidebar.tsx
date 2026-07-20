"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CATEGORY_LABELS, DISCIPLINE_LABELS, FORMAT_LABELS } from "@/lib/labels";

type SidebarEvent = {
  id: string;
  ageCategory: string;
  discipline: string;
  format: string;
};

export function CompetitionSidebar({
  events,
  activeEventId,
  competitionId,
  isInformationActive
}: {
  events: SidebarEvent[];
  activeEventId: string | null;
  competitionId: string;
  isInformationActive: boolean;
}) {
  // Group events by age category
  const groups: Record<string, SidebarEvent[]> = {};
  events.forEach((ev) => {
    if (!groups[ev.ageCategory]) {
      groups[ev.ageCategory] = [];
    }
    groups[ev.ageCategory].push(ev);
  });

  const ageCategories = Object.keys(groups).sort(); // Basic sort, could be custom ordered if needed

  // Find which group contains the active event
  const initialOpenGroup = activeEventId
    ? events.find((ev) => ev.id === activeEventId)?.ageCategory || null
    : null;

  const [openGroup, setOpenGroup] = useState<string | null>(initialOpenGroup);

  // Sync open group if activeEventId changes from outside
  useEffect(() => {
    if (activeEventId) {
      const parent = events.find((ev) => ev.id === activeEventId)?.ageCategory;
      if (parent) setOpenGroup(parent);
    } else {
      setOpenGroup(null);
    }
  }, [activeEventId, events]);

  const toggleGroup = (group: string) => {
    setOpenGroup(openGroup === group ? null : group);
  };

  return (
    <div className="w-full md:w-[260px] shrink-0 sticky top-6 flex flex-col gap-[2px]">
      <Link
        href={`/competitions/${competitionId}?tab=information`}
        className={`block px-4 py-3.5 text-white text-[12px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity ${
          isInformationActive ? "bg-black" : "bg-[#B83A14]"
        }`}
      >
        ინფორმაცია
      </Link>

      {ageCategories.map((ageCategory) => {
        const isOpen = openGroup === ageCategory;
        const subEvents = groups[ageCategory];
        
        return (
          <div key={ageCategory} className="flex flex-col gap-[2px]">
            {/* Group Header */}
            <div
              onClick={() => toggleGroup(ageCategory)}
              className={`flex items-center justify-between px-4 py-3.5 text-white text-[12px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer ${
                isOpen ? "bg-black" : "bg-[#B83A14]"
              }`}
            >
              <span>{CATEGORY_LABELS[ageCategory as keyof typeof CATEGORY_LABELS] || ageCategory}</span>
              <svg 
                className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                )}
              </svg>
            </div>

            {/* Sub Items */}
            {isOpen && (
              <div className="flex flex-col gap-[2px]">
                {subEvents.map((ev, index) => {
                  const isSubActive = activeEventId === ev.id;
                  // Alternating yellow/gold shades, active is lighter black
                  const bgColor = isSubActive
                    ? "bg-[#3d3d3d]" // Active state is lighter black/gray
                    : index % 2 === 0
                    ? "bg-[#cda25f]" // Pale yellow/gold
                    : "bg-[#ba904c]"; // Darker yellow/gold

                  return (
                    <Link
                      href={`/competitions/${competitionId}?eventId=${ev.id}`}
                      key={ev.id}
                      className={`block px-6 py-3 text-white text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-colors ${bgColor}`}
                    >
                      {DISCIPLINE_LABELS[ev.discipline as keyof typeof DISCIPLINE_LABELS]} {FORMAT_LABELS[ev.format as keyof typeof FORMAT_LABELS]}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
