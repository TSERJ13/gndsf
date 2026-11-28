import { requireStaff, REGISTRY_ADMINS, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import AdminSidebar from "@/components/portal/AdminSidebar";

const ROLE_LABELS: Record<string, string> = {
  ATHLETE: "ათლეტი",
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
  const canReviewSignups = can(user, "CLUB_SIGNUP_REVIEW");
  let pendingSignups = 0;
  if (canReviewSignups) {
    try {
      pendingSignups = await db.clubRegistration.count({ where: { status: "PENDING" } });
    } catch (err) {
      console.error("Failed to count pending club registrations:", err);
    }
  }

  let pendingAthletes = 0;
  if (can(user, "ATHLETE_APPROVE") || user.role === "CLUB_MANAGER") {
    try {
      pendingAthletes = await db.athlete.count({
        where: {
          status: "PENDING",
          ...(user.role === "CLUB_MANAGER" && user.clubId
            ? { clubMemberships: { some: { clubId: user.clubId, endDate: null } } }
            : {}),
        },
      });
    } catch (err) {
      console.error("Failed to count pending athletes:", err);
    }
  }

  // Moved "ფოსტა" higher up below the main dashboard
  const nav = [
    { href: "/portal", label: "დაფა", show: true },
    { href: "/portal/workspace", label: "სამუშაო სივრცე", show: true },
    { href: "/portal/mail", label: "ფოსტა", show: can(user, "MAIL_ACCESS") },
    { href: "/portal/e-cards", label: "E-Cards", show: can(user, "ECARD_REVIEW") },
    {
      href: "/portal/club-registrations",
      label: pendingSignups > 0 ? `სტუდიის მოთხოვნები (${pendingSignups})` : "სტუდიის მოთხოვნები",
      show: canReviewSignups,
    },
    {
      href: pendingAthletes > 0 ? "/portal/athletes?status=PENDING" : "/portal/athletes",
      label: pendingAthletes > 0 ? `ათლეტები (${pendingAthletes} განხილვაში)` : "ათლეტები",
      show: isRegistryAdmin || user.role === "CLUB_MANAGER",
    },
    { href: "/portal/partnerships", label: "წყვილები", show: isRegistryAdmin || user.role === "CLUB_MANAGER" },
    { href: "/portal/transfers", label: "ტრანსფერები", show: isRegistryAdmin || user.role === "CLUB_MANAGER" },
    { href: "/portal/edit-requests", label: "პროფილის მოთხოვნები", show: can(user, "ATHLETE_EDIT_REVIEW") },
    { href: "/portal/clubs", label: "კლუბები", show: isRegistryAdmin },
    { href: "/portal/competitions", label: "შეჯიბრებები", show: isRegistryAdmin },
    { href: "/portal/news", label: "სიახლეები", show: isRegistryAdmin },
    { href: "/portal/calendar", label: "კალენდარი", show: isRegistryAdmin },
    { href: "/portal/documents", label: "დოკუმენტები", show: isRegistryAdmin },
    { href: "/portal/users", label: "მომხმარებლები", show: can(user, "USER_MANAGE") },
    { href: "/portal/settings", label: "პარამეტრები", show: can(user, "SETTINGS_ACCESS") },
  ].filter((n) => n.show);


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
    </div>
  );
}
