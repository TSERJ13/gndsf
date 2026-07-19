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

// WDSF-style double-tier navigation
const TOP_NAV = [
  { label: "ჩვენ შესახებ", href: "/" },
  { label: "ფედერაცია", href: "/" },
  { label: "კლუბები", href: "/clubs" },
  { label: "კონტაქტი", href: "/contact" },
];

const MAIN_NAV = [
  { label: "სიახლეები", href: "/news" },
  { label: "სპორტსმენები", href: "/athletes" },
  { label: "წყვილები", href: "/couples" },
  { label: "რეიტინგი", href: "/rankings" },
  { label: "კალენდარი", href: "/calendar" },
  { label: "შედეგები", href: "/competitions" },
  { label: "დოკუმენტები", href: "/documents" },
];

// Flat list for the mobile drawer
const NAV_FLAT = [...TOP_NAV, ...MAIN_NAV];

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
          {/* ── row 1: Top tier WDSF style ── */}
          <div className="mx-auto flex h-[80px] max-w-[1400px] items-center justify-between gap-4 px-6">
            <Link href="/" className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90">
              <Image
                src="/brand/logo-header@2x.png"
                alt="GNDSF"
                width={52}
                height={52}
                quality={100}
                priority
              />
              <span className="leading-tight lg:block hidden">
                <span className="block text-base font-bold tracking-[0.08em] text-wine">GNDSF</span>
                <span className="block text-[10px] uppercase tracking-[0.14em] text-smoke">
                  სპორტული ცეკვების ეროვნული ფედერაცია
                </span>
              </span>
            </Link>

            <nav className="hidden flex-1 items-center justify-center lg:flex">
              <ul className="flex items-center gap-8">
                {TOP_NAV.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-[13px] font-medium uppercase tracking-wider text-smoke transition-colors hover:text-wine"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex shrink-0 items-center gap-4">
              <div className="hidden lg:flex items-center gap-2 rounded-full border border-line bg-coal px-4 py-1.5 focus-within:border-wine/50 focus-within:bg-ink">
                <input type="text" placeholder="ძებნა..." className="w-32 bg-transparent text-sm text-silver outline-none placeholder:text-smoke/70" />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-smoke">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>

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

          {/* ── row 2: Main Navigation Tier ── */}
          <nav className="hidden border-t border-line lg:block">
            <ul className="mx-auto flex h-[52px] max-w-[1400px] items-stretch justify-center gap-2 px-6">
              {MAIN_NAV.map((g) => (
                <li key={g.label} className="flex items-stretch">
                  <Link
                    href={g.href}
                    className="flex items-center px-4 text-[15px] font-bold text-silver transition-colors hover:text-gold"
                  >
                    {g.label}
                  </Link>
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
