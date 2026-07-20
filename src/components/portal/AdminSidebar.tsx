"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  HeartHandshake, 
  Building2, 
  Trophy, 
  Newspaper, 
  CalendarDays, 
  FileText, 
  Mail, 
  Settings,
  Menu,
  ChevronLeft,
  LogOut,
  Briefcase,
  CreditCard,
  ArrowRightLeft
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  show: boolean;
};

const ICONS: Record<string, React.ElementType> = {
  "/portal": LayoutDashboard,
  "/portal/workspace": Briefcase,
  "/portal/athletes": Users,
  "/portal/partnerships": HeartHandshake,
  "/portal/transfers": ArrowRightLeft,
  "/portal/clubs": Building2,
  "/portal/competitions": Trophy,
  "/portal/news": Newspaper,
  "/portal/calendar": CalendarDays,
  "/portal/documents": FileText,
  "/portal/users": Users, // generic for users
  "/portal/mail": Mail,
  "/portal/e-cards": CreditCard,
  "/portal/settings": Settings,
  "/portal/edit-requests": FileText,
};

export default function AdminSidebar({ 
  nav,
  userRole
}: { 
  nav: NavItem[];
  userRole?: string;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Hamburger Button (visible only on mobile when sidebar is closed) */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-wine text-white shadow-lg md:hidden"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}



      <aside 
        className={`fixed left-0 z-40 flex flex-col border-r border-neutral-200 bg-white transition-all duration-300 md:sticky md:top-[100px] lg:top-[190px] md:h-[calc(100vh-100px)] lg:h-[calc(100vh-190px)] ${
          isMobileOpen ? "translate-x-0 w-64 top-[100px] h-[calc(100vh-100px)]" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed && !isMobileOpen ? "md:w-20" : "md:w-64"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-neutral-100 px-4">
          <Link href="/" className={`flex items-center gap-2.5 overflow-hidden ${isCollapsed && !isMobileOpen ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
            <Image src="/brand/logo.png" alt="" width={30} height={30} className="shrink-0" />
            <div className="whitespace-nowrap">
              <div className="text-sm font-semibold leading-none">GNDSF</div>
              <div className="mt-0.5 text-[11px] font-medium text-wine uppercase tracking-wider">{userRole || "ადმინისტრირება"}</div>
            </div>
          </Link>
          
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Desktop floating toggle button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:bg-neutral-50 hover:text-neutral-900 transition-transform"
        >
          {isCollapsed ? <Menu size={14} /> : <ChevronLeft size={16} />}
        </button>

        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
          {nav.map((n) => {
            const Icon = ICONS[n.href] || Settings;
            const isActive = n.href === "/portal" 
              ? pathname === "/portal" 
              : pathname === n.href || pathname.startsWith(n.href + "/");
            
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed && !isMobileOpen ? n.label : undefined}
                className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-[#8B1E0F] text-white shadow-sm" 
                    : "text-neutral-700 hover:bg-[#8B1E0F]/10 hover:text-[#8B1E0F]"
                }`}
              >
                <Icon size={22} className="shrink-0" />
                <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed && !isMobileOpen ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                  {n.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
