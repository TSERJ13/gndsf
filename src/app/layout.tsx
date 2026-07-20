import type { Metadata } from "next";
import { Noto_Sans_Georgian, Noto_Serif_Georgian } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

const notoSansGeorgian = Noto_Sans_Georgian({
  subsets: ["georgian"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const notoSerifGeorgian = Noto_Serif_Georgian({
  subsets: ["georgian"],
  weight: ["400", "700", "900"],
  display: "swap",
});

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

// Top Tier WDSF Navigation
const TOP_NAV = [
  { label: "ᲩᲕᲔᲜᲡ ᲨᲔᲡᲐᲮᲔᲑ", href: "/" },
  { label: "ᲙᲚᲣᲑᲔᲑᲘ", href: "/clubs" },
  { label: "ᲙᲝᲜᲢᲐᲥᲢᲘ", href: "/contact" },
];

// Main Tier WDSF Navigation
const MAIN_NAV = [
  { label: "ᲡᲘᲐᲮᲚᲔᲔᲑᲘ", href: "/news" },
  { label: "ᲡᲞᲝᲠᲢᲡᲛᲔᲜᲔᲑᲘ", href: "/athletes" },
  { label: "ᲬᲧᲕᲘᲚᲔᲑᲘ", href: "/couples" },
  { label: "ᲠᲔᲘᲢᲘᲜᲒᲘ", href: "/rankings" },
  { label: "ᲙᲐᲚᲔᲜᲓᲐᲠᲘ", href: "/calendar" },
  { label: "ᲨᲔᲓᲔᲒᲔᲑᲘ", href: "/competitions" },
  { label: "ᲓᲝᲙᲣᲛᲔᲜᲢᲔᲑᲘ", href: "/documents" },
  { label: "E-CARD", href: "/e-card/apply" },
];

const NAV_FLAT = [...TOP_NAV, ...MAIN_NAV];

import { auth } from "@/auth";
import { doLogout } from "@/app/auth-actions";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isLoggedIn = !!session;
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const dashboardHref = userRole && userRole !== "ATHLETE" ? "/portal" : "/cabinet";

  return (
    <html lang="ka">
      <body className={`${notoSansGeorgian.className} min-h-screen flex flex-col bg-white text-black pt-[100px] lg:pt-[190px]`}>
        <header className="fixed left-0 right-0 top-0 z-50 bg-white/95 backdrop-blur-2xl transition-all duration-500" translate="no">
          <div className="mx-auto max-w-[1400px]">
            {/* ── row 1: Logo & Federation Name ── */}
            <div className="flex h-[80px] lg:h-[95px] items-center justify-between px-6 relative">
              <Link href="/" className="flex items-center gap-4 transition-transform hover:scale-[1.02]">
                  <Image
                    src="/brand/logo-header@2x.png"
                    alt="GNDSF"
                    width={55}
                    height={55}
                    quality={100}
                    priority
                    className="shrink-0"
                  />
                  <div className={`hidden sm:flex flex-col justify-center uppercase leading-[1.15] ml-2 ${notoSerifGeorgian.className}`}>
                    <span className="text-[#8B1E0F] text-[10px] lg:text-[11px] font-bold tracking-[0.2em] mb-[2px]">საქართველოს</span>
                    <span className="text-black text-[15px] lg:text-[19px] font-black tracking-tight">სპორტცეკვების</span>
                    <span className="text-[#8B1E0F] text-[11.5px] lg:text-[14px] font-bold tracking-wider mt-[2px]">ეროვნული ფედერაცია</span>
                  </div>
                </Link>

                {/* Mobile Nav Button */}
                <div className="lg:hidden">
                  <MobileNav items={NAV_FLAT} isLoggedIn={isLoggedIn} dashboardHref={dashboardHref} />
                </div>
              </div>

            {/* ── row 2: Top Nav + Search (Desktop Only) ── */}
            <div className="hidden lg:flex h-[45px] items-center justify-between px-6">
              <nav>
                  <ul className="flex items-center gap-8">
                    {TOP_NAV.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="text-[14px] font-medium tracking-widest text-[#444] transition-colors hover:text-[#B83A14]"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                    {isLoggedIn ? (
                      <>
                        <li>
                          <Link href={dashboardHref} className="text-[13px] font-medium tracking-wider text-[#8B1E0F] hover:text-[#B83A14]">
                            ᲙᲐᲑᲘᲜᲔᲢᲘ
                          </Link>
                        </li>
                        <li>
                          <form action={doLogout}>
                            <button type="submit" className="text-[13px] font-medium tracking-wider text-gray-500 hover:text-black transition-colors">
                              ᲒᲐᲡᲕᲚᲐ
                            </button>
                          </form>
                        </li>
                      </>
                    ) : (
                      <li>
                        <Link href="/login" className="text-[13px] font-medium tracking-wider text-[#8B1E0F] hover:text-[#B83A14] transition-colors">
                          ᲨᲔᲡᲕᲚᲐ
                        </Link>
                      </li>
                    )}
                  </ul>
                </nav>

                {/* Right Side: Search */}
                <div className="flex h-[28px] w-[220px] items-center border border-gray-300 bg-white">
                  <input 
                    type="text" 
                    placeholder="ძებნა საიტზე..." 
                    className="w-full px-3 text-[12px] outline-none text-black placeholder:text-gray-400" 
                  />
                  <button className="h-full px-4 text-[12px] font-bold text-white bg-gradient-to-b from-[#8B1E0F] to-[#4A0E05] hover:from-[#B83A14] hover:to-[#8B1E0F] transition-colors">
                    go
                  </button>
              </div>
            </div>
          </div>
          {/* ── row 3: Main Navigation Tier ── */}
          <nav className="hidden lg:block border-t border-gray-200 bg-white">
            <ul className="mx-auto flex h-[50px] max-w-[1400px] items-center justify-center gap-10 px-6">
              {MAIN_NAV.map((g) => (
                <li key={g.label} className="flex">
                  <Link
                    href={g.href}
                    className="text-[15px] font-black text-black transition-all hover:text-[#B83A14]"
                  >
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="motion-fade-up flex-1 min-h-[calc(100vh-200px)] lg:min-h-[calc(100vh-350px)]">{children}</main>

        {/* ── Footer ── */}
        <footer className="mt-auto bg-gradient-to-b from-[#8B1E0F] via-[#B83A14] to-[#4A0E05] text-white">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center gap-10 px-6 py-16 text-[13px] font-medium text-white/80">
            {/* Logo and Name Side-by-Side */}
            <div className="flex items-center justify-center gap-5 text-left">
              <Image src="/brand/logo-header@2x.png" alt="GNDSF" width={60} height={60} className="brightness-0 invert opacity-90 shrink-0" />
              <div className="text-white text-[14px] md:text-[15px] font-medium tracking-widest leading-snug">
                საქართველოს <span className="font-black text-[15px] md:text-[16px]">სპორტცეკვების</span><br />
                ეროვნული ფედერაცია
              </div>
            </div>

            {/* Social Icons (Circles) */}
            <div className="flex gap-4 items-center">
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-white/80 hover:bg-white/10 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-white/80 hover:bg-white/10 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-white/80 hover:bg-white/10 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-white/80 hover:bg-white/10 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.77 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/></svg>
              </a>
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-white/80 hover:bg-white/10 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
              </a>
            </div>

            {/* Copyright */}
            <div className="flex flex-col items-center gap-2 text-center text-white/90 tracking-widest text-[11px] md:text-[12px] mt-4 font-bold">
              <p className="uppercase">© {new Date().getFullYear()} სსცეფ · ყველა უფლება დაცულია.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
