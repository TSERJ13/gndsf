import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gndsf.ge"),
  title: {
    default: "GNDSF — საქართველოს სპორტული ცეკვების ეროვნული ფედერაცია",
    template: "%s — GNDSF",
  },
  description:
    "საქართველოს სპორტული ცეკვების ეროვნული ფედერაცია — სპორტსმენები, შეჯიბრებები, ეროვნული რეიტინგი.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

// WDSF-style grouped navigation: top-level items, some with dropdowns
const NAV_GROUPS: {
  label: string;
  href?: string;
  items?: { href: string; label: string }[];
}[] = [
  { label: "სიახლეები", href: "/news" },
  {
    label: "სპორტსმენები",
    items: [
      { href: "/athletes", label: "სპორტსმენების ბაზა" },
      { href: "/couples", label: "წყვილები" },
      { href: "/rankings", label: "ეროვნული რეიტინგი" },
    ],
  },
  {
    label: "შეჯიბრებები",
    items: [
      { href: "/calendar", label: "კალენდარი" },
      { href: "/competitions", label: "შედეგები" },
    ],
  },
  { label: "კლუბები", href: "/clubs" },
  { label: "დოკუმენტები", href: "/documents" },
  { label: "კონტაქტი", href: "/contact" },
];

// Flat list for the mobile drawer
const NAV_FLAT = NAV_GROUPS.flatMap((g) =>
  g.href ? [{ href: g.href, label: g.label }] : (g.items ?? []),
);

// Applies the saved theme before first paint (no flash). Default: light.
const themeInit = `try{var t=localStorage.getItem("gndsf-theme");if(t==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

import { auth } from "@/auth";

import { doLogout } from "@/app/auth-actions";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isLoggedIn = !!session;
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const dashboardHref = userRole && userRole !== "ATHLETE" ? "/admin" : "/cabinet";

  return (
    <html lang="ka">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen bg-ink text-silver pt-[116px] lg:pt-[124px]">
        <header className="fixed left-0 right-0 top-0 z-50 border-b border-line bg-ink/95 backdrop-blur-md">
          {/* ── row 1: identity + account ── */}
          <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-4 px-6">
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
              <Image
                src="/brand/logo-header@2x.png"
                alt="GNDSF"
                width={46}
                height={46}
                quality={100}
                priority
              />
              <span className="leading-tight">
                <span className="block text-base font-bold tracking-[0.08em] text-wine">GNDSF</span>
                <span className="hidden text-[10px] uppercase tracking-[0.14em] text-smoke sm:block">
                  სპორტული ცეკვების ეროვნული ფედერაცია
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <div className="hidden items-center gap-4 lg:flex">
                  <Link
                    href={dashboardHref}
                    className="rounded-full border border-wine/30 px-5 py-2 text-sm font-medium text-wine transition-colors hover:border-wine hover:bg-wine/5"
                  >
                    კაბინეტი
                  </Link>
                  <form action={doLogout}>
                    <button className="text-sm font-medium text-smoke transition-colors hover:text-flame">
                      გასვლა
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden rounded-full bg-wine px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-flame lg:block"
                >
                  შესვლა
                </Link>
              )}
              <ThemeToggle />
              <MobileNav items={NAV_FLAT} isLoggedIn={isLoggedIn} dashboardHref={dashboardHref} />
            </div>
          </div>

          {/* ── row 2: WDSF-style section nav with dropdowns ── */}
          <nav className="hidden border-t border-line lg:block">
            <ul className="mx-auto flex h-[52px] max-w-[1400px] items-stretch justify-center gap-2 px-6">
              {NAV_GROUPS.map((g) => (
                <li key={g.label} className="group relative flex items-stretch">
                  {g.href ? (
                    <Link
                      href={g.href}
                      className="flex items-center px-4 text-[15px] font-semibold text-silver transition-colors hover:text-gold"
                    >
                      {g.label}
                    </Link>
                  ) : (
                    <>
                      <button
                        className="flex items-center gap-1.5 px-4 text-[15px] font-semibold text-silver transition-colors group-hover:text-gold group-focus-within:text-gold"
                        aria-haspopup="true"
                      >
                        {g.label}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-0 opacity-0 transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                        <ul className="w-64 border border-gold/50 bg-ink shadow-lg">
                          {g.items!.map((it) => (
                            <li key={it.href} className="border-b border-line last:border-0">
                              <Link
                                href={it.href}
                                className="block px-6 py-3.5 text-[15px] text-silver transition-colors hover:bg-coal hover:text-gold"
                              >
                                {it.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="mt-24 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 text-sm text-smoke md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <Image src="/brand/logo-header.png" alt="" width={28} height={28} />
              <span>© {new Date().getFullYear()} GNDSF · gndsf.ge</span>
            </div>
            <div className="flex gap-6">
              <Link href="/documents" className="hover:text-gold">წესდება</Link>
              <Link href="/contact" className="hover:text-gold">კონტაქტი</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
