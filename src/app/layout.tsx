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

const NAV = [
  { href: "/news", label: "სიახლეები" },
  { href: "/calendar", label: "კალენდარი" },
  { href: "/clubs", label: "კლუბები" },
  { href: "/athletes", label: "სპორტსმენები" },
  { href: "/rankings", label: "რეიტინგი" },
  { href: "/competitions", label: "შედეგები" },
  { href: "/documents", label: "დოკუმენტები" },
  { href: "/contact", label: "კონტაქტი" },
];

// Applies the saved theme before first paint (no flash). Default: light.
const themeInit = `try{var t=localStorage.getItem("gndsf-theme");if(t==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

import { auth } from "@/auth";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isLoggedIn = !!session;
  const dashboardHref = session?.user?.role === "ADMIN" ? "/admin" : "/cabinet";

  return (
    <html lang="ka">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen bg-ink text-silver">
        <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/brand/logo-header@2x.png"
                alt="GNDSF"
                width={40}
                height={40}
                quality={100}
                priority
              />
              <span className="text-base font-bold tracking-[0.08em]">GNDSF</span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm text-smoke md:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="transition-colors hover:text-wine">
                  {n.label}
                </Link>
              ))}
              {isLoggedIn ? (
                <div className="flex items-center gap-4">
                  <Link
                    href={dashboardHref}
                    className="rounded border border-line px-3 py-1.5 transition-colors hover:border-wine hover:text-wine"
                  >
                    კაბინეტი
                  </Link>
                  <Link
                    href="/api/auth/signout"
                    className="rounded bg-red-900/50 px-3 py-1.5 text-white transition-colors hover:bg-red-800/60"
                  >
                    გასვლა
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded border border-line px-3 py-1.5 transition-colors hover:border-wine hover:text-wine"
                >
                  შესვლა
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <MobileNav items={NAV} isLoggedIn={isLoggedIn} dashboardHref={dashboardHref} />
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-24 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 text-sm text-smoke md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <Image src="/brand/logo-header.png" alt="" width={28} height={28} />
              <span>© {new Date().getFullYear()} GNDSF · gndsf.ge</span>
            </div>
            <div className="flex gap-6">
              <Link href="/documents" className="hover:text-wine">წესდება</Link>
              <Link href="/contact" className="hover:text-wine">კონტაქტი</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
