"use client";

// Phone navigation for the portal: a bar pinned under the site header that
// shows where you are, and opens a grid of all sections. Replaces the old
// floating button that covered page content.
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Settings } from "lucide-react";
import { ICONS, type NavItem } from "./AdminSidebar";

const baseHref = (href: string) => href.split("?")[0];

export default function PortalMobileNav({ nav, userRole }: { nav: NavItem[]; userRole?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => {
    const h = baseHref(href);
    return h === "/portal" ? pathname === "/portal" : pathname === h || pathname.startsWith(h + "/");
  };
  const current = nav.find((n) => isActive(n.href)) ?? nav[0];
  const CurrentIcon = ICONS[baseHref(current.href)] || Settings;
  const count = (label: string) => label.match(/\((\d+)/)?.[1];
  const clean = (label: string) => label.replace(/\s*\(.*\)$/, "");

  return (
    <div className="sticky top-[80px] z-30 -mt-[20px] md:hidden">
      <div className="border-b border-neutral-200 bg-white">
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8B1E0F] text-white">
            <CurrentIcon size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium text-[#8B1E0F]">{userRole ?? "პანელი"}</span>
            <span className="block truncate text-[15px] font-bold text-neutral-900">{clean(current.label)}</span>
          </span>
          <span className="flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 text-[13px] font-medium text-neutral-700">
            მენიუ
            <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 top-[80px] -z-10 bg-black/30" onClick={() => setOpen(false)} />
          <nav className="max-h-[70vh] overflow-y-auto border-b border-neutral-200 bg-white p-3 shadow-lg">
            <div className="grid grid-cols-2 gap-2">
              {nav.map((n) => {
                const Icon = ICONS[baseHref(n.href)] || Settings;
                const active = isActive(n.href);
                const c = count(n.label);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`relative flex items-center gap-2.5 rounded-xl border px-3 py-3 text-[13px] font-medium leading-tight ${
                      active
                        ? "border-[#8B1E0F] bg-[#8B1E0F] text-white"
                        : "border-neutral-200 bg-white text-neutral-800 active:bg-neutral-50"
                    }`}
                  >
                    <Icon size={18} className={`shrink-0 ${active ? "" : "text-[#8B1E0F]"}`} />
                    <span>{clean(n.label)}</span>
                    {c && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B83A14] px-1 text-[11px] font-bold text-white">
                        {c}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
