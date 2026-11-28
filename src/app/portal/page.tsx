import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser, clubScope, can } from "@/lib/rbac";
import { auditLabel, timeAgo } from "@/lib/auditLabels";

export const dynamic = "force-dynamic";
export const metadata = { title: "დაფა · პანელი" };


async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (e) {
    console.error("dashboard query failed:", e);
    return fallback;
  }
}

export default async function Dashboard() {
  const user = await requireUser();
  const scope = clubScope(user);
  const inClub = scope ? { clubMemberships: { some: { clubId: scope.clubId, endDate: null } } } : {};
  const coupleWhere = scope ? { OR: [{ leader: inClub }, { follower: inClub }] } : {};
  const federation = !scope;
  const reviewer = can(user, "ATHLETE_APPROVE");

  const [athletes, couples, clubs, competitions, pendingAthletes, returnedAthletes, pendingStudios, pendingEdits, pendingTransfers, audit, club] =
    await Promise.all([
      safe(db.athlete.count({ where: { isActive: true, status: "APPROVED", ...inClub } }), 0),
      safe(db.partnership.count({ where: { endDate: null, ...coupleWhere } }), 0),
      federation ? safe(db.club.count({ where: { isActive: true } }), 0) : 0,
      federation ? safe(db.competition.count(), 0) : 0,
      safe(db.athlete.count({ where: { status: "PENDING", ...inClub } }), 0),
      scope ? safe(db.athlete.count({ where: { status: "REJECTED", ...inClub } }), 0) : 0,
      can(user, "CLUB_SIGNUP_REVIEW") ? safe(db.clubRegistration.count({ where: { status: "PENDING" } }), 0) : 0,
      can(user, "ATHLETE_EDIT_REVIEW") ? safe(db.athleteEditRequest.count({ where: { status: "PENDING" } }), 0) : 0,
      federation ? safe(db.clubTransferRequest.count({ where: { status: "PENDING" } }), 0) : 0,
      federation
        ? safe(db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } } } }), [])
        : [],
      scope ? safe(db.club.findUnique({ where: { id: scope.clubId }, select: { name: true } }), null) : null,
    ]);

  // What needs a decision now, most urgent first.
  const todo = [
    reviewer && pendingAthletes > 0 && { n: pendingAthletes, text: "ათლეტი ელოდება დამტკიცებას", href: "/portal/athletes?status=PENDING" },
    pendingStudios > 0 && { n: pendingStudios, text: "სტუდიის განაცხადი", href: "/portal/club-registrations" },
    pendingEdits > 0 && { n: pendingEdits, text: "მონაცემების შეცვლის მოთხოვნა", href: "/portal/edit-requests" },
    pendingTransfers > 0 && { n: pendingTransfers, text: "ტრანსფერის მოთხოვნა", href: "/portal/transfers" },
    scope && returnedAthletes > 0 && { n: returnedAthletes, text: "ათლეტი დაბრუნდა შესასწორებლად", href: "/portal/athletes?status=REJECTED" },
    scope && pendingAthletes > 0 && { n: pendingAthletes, text: "ათლეტი ფედერაციის განხილვაშია", href: "/portal/athletes?status=PENDING" },
  ].filter(Boolean) as { n: number; text: string; href: string }[];

  const stats = [
    { label: scope ? "ათლეტი" : "დამტკიცებული ათლეტი", value: athletes, href: "/portal/athletes" },
    { label: "მოქმედი წყვილი", value: couples, href: "/portal/partnerships" },
    ...(federation
      ? [
          { label: "სტუდია", value: clubs, href: "/portal/clubs" },
          { label: "შეჯიბრება", value: competitions, href: "/portal/competitions" },
        ]
      : []),
  ];

  const actions = scope
    ? [
        { label: "ათლეტის დამატება", href: "/portal/athletes" },
        { label: "წყვილის შექმნა", href: "/portal/partnerships" },
        { label: "სტუდიის მონაცემები", href: "/portal/settings" },
      ]
    : [
        { label: "სტუდიის დამატება", href: "/portal/clubs" },
        { label: "შეჯიბრების შექმნა", href: "/portal/competitions" },
        { label: "სიახლის დაწერა", href: "/portal/news" },
      ];

  const card = "rounded-2xl border border-neutral-200 bg-white shadow-sm";

  return (
    <div className="space-y-8">
      <header>
        {club && (
          <span className="inline-block rounded-full bg-[#8B1E0F]/10 px-3 py-1 text-[12px] font-bold text-[#8B1E0F]">{club.name}</span>
        )}
        <h1 className="mt-3 text-[26px] font-bold leading-tight text-neutral-900 md:text-[32px]">
          გამარჯობა{user.name && !/ადმინ|პრეზიდენტ/.test(user.name) ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
      </header>

      <section>
        <h2 className="mb-3 text-[13px] font-bold text-neutral-500">მოსაგვარებელი</h2>
        {todo.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {todo.map((t) => (
              <Link key={t.href + t.text} href={t.href} className={`${card} flex items-center gap-4 p-4 transition-colors hover:border-[#8B1E0F]`}>
                <span className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-[#8B1E0F] px-2 text-[18px] font-black text-white">{t.n}</span>
                <span className="flex-1 text-[15px] font-medium text-neutral-800">{t.text}</span>
                <span className="text-[20px] text-[#8B1E0F]">›</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className={`${card} flex items-center gap-3 p-4 text-[15px] text-neutral-600`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-700">✓</span>
            ყველაფერი განხილულია.
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`${card} p-4 transition-shadow hover:shadow-md md:p-5`}>
            <div className="text-[30px] font-black leading-none tabular-nums text-[#8B1E0F] md:text-[36px]">{s.value}</div>
            <div className="mt-2 text-[13px] font-medium text-neutral-600">{s.label}</div>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-[13px] font-bold text-neutral-500">სწრაფი მოქმედებები</h2>
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Link key={a.label} href={a.href} className="rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-800 transition-colors hover:border-[#8B1E0F] hover:text-[#8B1E0F]">
              + {a.label}
            </Link>
          ))}
        </div>
      </section>

      {federation && (
        <section>
          <h2 className="mb-3 text-[13px] font-bold text-neutral-500">ბოლო ცვლილებები</h2>
          <ul className={`${card} divide-y divide-neutral-100`}>
            {audit.map((a) => (
              <li key={a.id} className="flex gap-3 px-4 py-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c49a5b]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-[14px] font-bold text-neutral-900">{auditLabel(a.action)}</span>
                    <span className="text-[12px] text-neutral-400">{timeAgo(a.createdAt)}</span>
                  </div>
                  {a.detail && <div className="mt-0.5 break-words text-[13px] text-neutral-600">{a.detail}</div>}
                  <div className="mt-0.5 text-[12px] text-neutral-400">{a.user?.name ?? "სისტემა"}</div>
                </div>
              </li>
            ))}
            {audit.length === 0 && <li className="px-4 py-6 text-center text-neutral-400">ჯერ არაფერი.</li>}
          </ul>
        </section>
      )}
    </div>
  );
}
