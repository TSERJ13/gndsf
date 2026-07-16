import { requireStaff, REGISTRY_ADMINS } from "@/lib/rbac";
import AdminSidebar from "@/components/admin/AdminSidebar";

const ROLE_LABELS: Record<string, string> = {
  ATHLETE: "სპორტსმენი",
  SUPER_ADMIN: "სუპერადმინი",
  PRESIDENT: "პრეზიდენტი",
  VICE_PRESIDENT: "ვიცე-პრეზიდენტი",
  GENERAL_SECRETARY: "გენერალური მდივანი",
  REGIONAL_REP: "რეგიონული წარმომადგენელი",
  CLUB_MANAGER: "კლუბის მენეჯერი",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const isRegistryAdmin = REGISTRY_ADMINS.includes(user.role);

  // Moved "ფოსტა" higher up below the main dashboard
  const nav = [
    { href: "/admin", label: "დაფა", show: true },
    { href: "/admin/mail", label: "ფოსტა", show: true },
    { href: "/admin/athletes", label: "სპორტსმენები", show: true },
    { href: "/admin/partnerships", label: "წყვილები", show: isRegistryAdmin },
    { href: "/admin/clubs", label: "კლუბები", show: isRegistryAdmin },
    { href: "/admin/competitions", label: "შეჯიბრებები", show: isRegistryAdmin },
    { href: "/admin/news", label: "სიახლეები", show: isRegistryAdmin },
    { href: "/admin/calendar", label: "კალენდარი", show: isRegistryAdmin },
    { href: "/admin/documents", label: "დოკუმენტები", show: isRegistryAdmin },
    { href: "/admin/users", label: "მომხმარებლები", show: user.role === "SUPER_ADMIN" },
    { href: "/admin/settings", label: "პარამეტრები", show: true },
  ].filter((n) => n.show);

  return (
    <div className="min-h-screen bg-[#f6f5f3] text-neutral-900">
      <div className="mx-auto flex max-w-7xl">
        <AdminSidebar nav={nav} />
        <main className="min-w-0 flex-1 px-4 py-8 md:px-8 pb-24 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
