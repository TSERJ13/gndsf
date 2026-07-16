"use client";

import { useState } from "react";
import Link from "next/link";

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

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label="მენიუ"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded border border-line text-silver"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-16 z-50 border-b border-line bg-coal shadow-lg">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {items.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-line py-3 text-sm text-silver last:border-0"
                >
                  {n.label}
                </Link>
              </li>
            ))}
            {isLoggedIn ? (
              <>
                <li>
                  <Link
                    href={dashboardHref || "/cabinet"}
                    onClick={() => setOpen(false)}
                    className="my-3 block rounded border border-line px-4 py-2.5 text-center text-sm font-medium text-silver"
                  >
                    კაბინეტი
                  </Link>
                </li>
                <li>
                  <Link
                    href="/api/auth/signout"
                    onClick={() => setOpen(false)}
                    className="mb-3 block rounded bg-red-900/50 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-red-800/60"
                  >
                    გასვლა
                  </Link>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="my-3 block rounded bg-wine px-4 py-2.5 text-center text-sm font-medium text-white"
                >
                  შესვლა
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </div>
  );
}
