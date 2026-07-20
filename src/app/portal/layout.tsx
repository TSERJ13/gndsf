import { requireStaff, REGISTRY_ADMINS } from "@/lib/rbac";
import AdminSidebar from "@/components/portal/AdminSidebar";
import FloatingCalculator from "@/components/portal/FloatingCalculator";
import { getExchangeRates } from "@/lib/nbg";

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
    { href: "/portal", label: "დაფა", show: true },
    { href: "/portal/workspace", label: "სამუშაო სივრცე", show: true },
    { href: "/portal/mail", label: "ფოსტა", show: ["SUPER_ADMIN", "GENERAL_SECRETARY"].includes(user.role) },
    { href: "/portal/e-cards", label: "E-Cards", show: ["SUPER_ADMIN", "VICE_PRESIDENT"].includes(user.role) },
    { href: "/portal/athletes", label: "სპორტსმენები", show: isRegistryAdmin || user.role === "CLUB_MANAGER" },
    { href: "/portal/partnerships", label: "წყვილები", show: isRegistryAdmin || user.role === "CLUB_MANAGER" },
    { href: "/portal/transfers", label: "ტრანსფერები", show: isRegistryAdmin || user.role === "CLUB_MANAGER" },
    { href: "/portal/clubs", label: "კლუბები", show: isRegistryAdmin },
    { href: "/portal/competitions", label: "შეჯიბრებები", show: isRegistryAdmin },
    { href: "/portal/news", label: "სიახლეები", show: isRegistryAdmin },
    { href: "/portal/calendar", label: "კალენდარი", show: isRegistryAdmin },
    { href: "/portal/documents", label: "დოკუმენტები", show: isRegistryAdmin },
    { href: "/portal/users", label: "მომხმარებლები", show: user.role === "SUPER_ADMIN" },
    { href: "/portal/settings", label: "პარამეტრები", show: user.role === "SUPER_ADMIN" },
  ].filter((n) => n.show);

  const showCalc = ["PRESIDENT", "VICE_PRESIDENT", "GENERAL_SECRETARY", "SUPER_ADMIN"].includes(user.role);
  const rates = showCalc ? await getExchangeRates() : {};

  return (
    <div className="min-h-screen bg-[#f6f5f3] text-neutral-900 flex flex-col">
      <div className="flex w-full flex-1">
        <div className="shrink-0 bg-white border-r border-neutral-200 hidden md:block">
          <AdminSidebar nav={nav} userRole={ROLE_LABELS[user.role]} />
        </div>
        <div className="md:hidden">
          <AdminSidebar nav={nav} userRole={ROLE_LABELS[user.role]} />
        </div>
        <main className="min-w-0 flex-1 px-4 py-8 md:px-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      {showCalc && <FloatingCalculator rates={rates} />}
    </div>
  );
}
