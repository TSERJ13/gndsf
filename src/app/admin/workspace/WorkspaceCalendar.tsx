"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fmtDate } from "@/lib/labels";

type CompDates = { id: string; name: string; startDate: Date };

export default function WorkspaceCalendar({ competitions }: { competitions: CompDates[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  // Convert Sunday=0 to Monday=0, Sunday=6
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
    "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
  ];
  
  const dayNames = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const compMap = new Map<string, string>(); // YYYY-MM-DD -> competition name
  competitions.forEach(c => {
    const d = c.startDate;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    compMap.set(key, c.name);
  });

  const isToday = (d: number) => {
    const today = new Date();
    return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  };

  const days = [];
  for (let i = 0; i < startOffset; i++) {
    days.push(<div key={`empty-${i}`} className="h-10 border border-transparent" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const compName = compMap.get(dateKey);
    
    days.push(
      <div 
        key={d} 
        title={compName || undefined}
        className={`relative flex h-10 flex-col items-center justify-center rounded border text-sm transition-colors cursor-default ${
          compName 
            ? "border-wine bg-wine text-white font-semibold shadow-sm hover:bg-wine/90" 
            : isToday(d) 
              ? "border-neutral-300 bg-neutral-100 font-semibold" 
              : "border-transparent text-neutral-700 hover:bg-neutral-50"
        }`}
      >
        <span>{d}</span>
        {compName && (
          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white opacity-80" />
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-neutral-100 text-neutral-600 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="font-medium">
          {monthNames[month]} {year}
        </div>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-neutral-100 text-neutral-600 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayNames.map(name => (
          <div key={name} className="text-xs font-medium text-neutral-400">
            {name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {Array.from(compMap.entries()).filter(([key]) => key.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).map(([key, name]) => (
          <div key={key} className="flex items-center gap-2 text-xs border border-wine/20 bg-wine/5 p-2 rounded text-wine">
            <div className="w-2 h-2 rounded-full bg-wine shrink-0" />
            <span className="font-semibold tabular-nums">{key.split('-').reverse().join('.')}</span>
            <span className="truncate">{name}</span>
          </div>
        ))}
        {Array.from(compMap.entries()).filter(([key]) => key.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length === 0 && (
          <p className="text-xs text-neutral-400 italic text-center py-2">ამ თვეში ტურნირები არ არის</p>
        )}
      </div>
    </div>
  );
}
