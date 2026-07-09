import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
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
  { href: "/documents", label: "დოკუმენტები" },
  { href: "/contact", label: "კონტაქტი" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka">
      <body className="min-h-screen bg-ink text-silver">
        <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/brand/logo.png" alt="GNDSF" width={38} height={38} priority />
              <span className="text-sm font-semibold tracking-wide">
                GNDSF
                <span className="ml-2 hidden text-xs font-normal text-smoke lg:inline">
                  სპორტული ცეკვების ეროვნული ფედერაცია
                </span>
              </span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-smoke md:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="transition-colors hover:text-silver">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-24 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 text-sm text-smoke md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <Image src="/brand/logo.png" alt="" width={28} height={28} />
              <span>© {new Date().getFullYear()} GNDSF · gndsf.ge</span>
            </div>
            <div className="flex gap-6">
              <Link href="/documents" className="hover:text-silver">წესდება</Link>
              <Link href="/contact" className="hover:text-silver">კონტაქტი</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
