import Link from "next/link";
import Image from "next/image";
import { requireStaff, REGISTRY_ADMINS } from "@/lib/rbac";
import { signOut } from "@/auth";

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

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  const nav = [
    { href: "/admin", label: "დაფა", show: true },
    { href: "/admin/athletes", label: "სპორტსმენები", show: true },
    { href: "/admin/partnerships", label: "წყვილები", show: isRegistryAdmin },
    { href: "/admin/clubs", label: "კლუბები", show: isRegistryAdmin },
    { href: "/admin/competitions", label: "შეჯიბრებები", show: isRegistryAdmin },
    { href: "/admin/news", label: "სიახლეები", show: isRegistryAdmin },
    { href: "/admin/calendar", label: "კალენდარი", show: isRegistryAdmin },
    { href: "/admin/documents", label: "დოკუმენტები", show: isRegistryAdmin },
    { href: "/admin/users", label: "მომხმარებლები", show: user.role === "SUPER_ADMIN" },
    { href: "/admin/mail", label: "ფოსტა", show: true },
    { href: "/admin/settings", label: "პარამეტრები", show: true },
  ].filter((n) => n.show);

  // The admin is deliberately a different world: light, dense, utilitarian.
  return (
    <div className="min-h-screen bg-[#f6f5f3] text-neutral-900">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-white px-4 py-6">
          <Link href="/" className="flex items-center gap-2.5 px-2">
            <Image src="/brand/logo.png" alt="" width={30} height={30} />
            <div>
              <div className="text-sm font-semibold leading-none">GNDSF</div>
              <div className="mt-0.5 text-[11px] text-neutral-500">ადმინისტრირება</div>
            </div>
          </Link>
          <nav className="mt-8 space-y-1">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="block rounded px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-neutral-200 pt-4">
            <div className="px-2 text-sm font-medium">{user.name}</div>
            <div className="px-2 text-xs text-neutral-500">{ROLE_LABELS[user.role]}</div>
            <form action={logout} className="mt-3 px-2">
              <button className="text-xs text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline">
                გასვლა
              </button>
            </form>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
