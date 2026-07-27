"use client";

import { useState, useRef, useEffect } from "react";

type AthleteOption = {
  id: string;
  firstName: string;
  lastName: string;
  gid: string;
};

export default function SearchableAthleteSelect({
  name,
  options,
  placeholder = "აირჩიეთ სპორტსმენი...",
}: {
  name: string;
  options: AthleteOption[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<AthleteOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on query
  const filtered = options.filter((o) => {
    const text = `${o.firstName} ${o.lastName} ${o.gid}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {/* Hidden input for the actual form submission */}
      <input type="hidden" name={name} value={selected?.id || ""} required />

      <div
        className="relative w-full cursor-pointer rounded border border-neutral-300 bg-white px-3 py-2 text-sm focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center justify-between">
          {!isOpen && selected ? (
            <span className="truncate">
              {selected.firstName} {selected.lastName} ({selected.gid})
            </span>
          ) : (
            <input
              type="text"
              className="w-full bg-transparent outline-none placeholder:text-neutral-400"
              placeholder={selected ? `${selected.firstName} ${selected.lastName}` : placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
          )}
          <svg
            className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
          {filtered.length === 0 ? (
            <div className="relative cursor-default select-none px-4 py-2 text-sm text-neutral-500">
              ვერ მოიძებნა
            </div>
          ) : (
            filtered.map((athlete) => (
              <div
                key={athlete.id}
                className={`relative cursor-pointer select-none px-4 py-2 text-sm hover:bg-neutral-100 ${
                  selected?.id === athlete.id ? "bg-neutral-50 font-semibold text-neutral-900" : "text-neutral-700"
                }`}
                onClick={() => {
                  setSelected(athlete);
                  setQuery("");
                  setIsOpen(false);
                }}
              >
                {athlete.firstName} {athlete.lastName} ({athlete.gid})
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
