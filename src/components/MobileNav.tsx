"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { doLogout } from "@/app/auth-actions";

export default function MobileNav({
  items,
  isLoggedIn,
  dashboardHref,
}: {
  items: { href: string; label: string }[];
  isLoggedIn?: boolean;
  dashboardHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="მენიუ"
        className="flex h-10 w-10 items-center justify-center text-black hover:text-[#B83A14] transition-colors"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-white">
          {/* Top Bar matching Footer Gradient */}
          <div className="flex h-20 items-center justify-end px-6 bg-gradient-to-r from-[#8B1E0F] via-[#B83A14] to-[#4A0E05]">
            <button
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-white transition-transform hover:scale-110"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto">
            <ul className="flex flex-col">
              {items.map((n, idx) => {
                const isActive = pathname === n.href || pathname.startsWith(`${n.href}/`);
                
                return (
                  <li key={`${n.label}-${idx}`} className="border-b border-gray-200">
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between px-6 py-5 text-[15px] font-black transition-colors ${
                        isActive 
                          ? "bg-gradient-to-r from-[#8B1E0F] via-[#B83A14] to-[#4A0E05] text-white" 
                          : "text-black hover:bg-gray-50 hover:text-[#B83A14]"
                      }`}
                    >
                      <span className="uppercase tracking-widest">{n.label}</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 px-6 space-y-4 pb-12">
              {isLoggedIn ? (
                <>
                  <Link
                    href={dashboardHref || "/cabinet"}
                    onClick={() => setOpen(false)}
                    className="block w-full px-6 py-4 border-2 border-[#8B1E0F] text-center text-[15px] font-bold uppercase tracking-wider text-[#8B1E0F] transition-colors hover:bg-[#8B1E0F] hover:text-white"
                  >
                    კაბინეტი
                  </Link>
                  <form action={doLogout}>
                    <button
                      type="submit"
                      onClick={() => setOpen(false)}
                      className="block w-full px-6 py-4 border-2 border-gray-300 text-center text-[15px] font-bold uppercase tracking-wider text-gray-500 transition-colors hover:border-black hover:text-black"
                    >
                      გასვლა
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-full bg-gradient-to-r from-[#8B1E0F] via-[#B83A14] to-[#4A0E05] px-6 py-4 text-center text-[15px] font-bold uppercase tracking-wider text-white shadow-md transition-all hover:scale-[1.02]"
                >
                  შესვლა
                </Link>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
