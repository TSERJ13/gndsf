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
  LogOut
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  show: boolean;
};

const ICONS: Record<string, React.ElementType> = {
  "/admin": LayoutDashboard,
  "/admin/athletes": Users,
  "/admin/partnerships": HeartHandshake,
  "/admin/clubs": Building2,
  "/admin/competitions": Trophy,
  "/admin/news": Newspaper,
  "/admin/calendar": CalendarDays,
  "/admin/documents": FileText,
  "/admin/users": Users, // generic for users
  "/admin/mail": Mail,
  "/admin/settings": Settings,
};

export default function AdminSidebar({ 
  nav, 
  user 
}: { 
  nav: NavItem[], 
  user: { name: string; roleLabel: string } 
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside 
      className={`sticky top-0 flex h-screen flex-col border-r border-neutral-200 bg-white transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-neutral-100 px-4">
        <Link href="/" className={`flex items-center gap-2.5 overflow-hidden ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
          <Image src="/brand/logo.png" alt="" width={30} height={30} className="shrink-0" />
          <div className="whitespace-nowrap">
            <div className="text-sm font-semibold leading-none">GNDSF</div>
            <div className="mt-0.5 text-[11px] text-neutral-500">ადმინისტრირება</div>
          </div>
        </Link>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 ${isCollapsed ? "mx-auto" : ""}`}
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
        {nav.map((n) => {
          const Icon = ICONS[n.href] || Settings;
          const isActive = pathname === n.href || pathname.startsWith(n.href + "/");
          
          return (
            <Link
              key={n.href}
              href={n.href}
              title={isCollapsed ? n.label : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-neutral-900 text-white" 
                  : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">{n.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-4">
        {!isCollapsed ? (
          <div className="overflow-hidden">
            <div className="truncate text-sm font-medium text-neutral-900">{user.name}</div>
            <div className="truncate text-xs text-neutral-500">{user.roleLabel}</div>
            <Link 
              href="/api/auth/signout" 
              className="mt-3 flex items-center gap-2 text-xs font-medium text-red-600 hover:text-red-700"
            >
              <LogOut size={14} />
              <span>გასვლა</span>
            </Link>
          </div>
        ) : (
          <Link 
            href="/api/auth/signout" 
            title="გასვლა"
            className="flex items-center justify-center text-red-600 hover:text-red-700"
          >
            <LogOut size={20} />
          </Link>
        )}
      </div>
    </aside>
  );
}
