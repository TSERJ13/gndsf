import PhotoInput from "@/components/PhotoInput";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser, clubScope, can } from "@/lib/rbac";
import { CATEGORY_LABELS, categoryFor, fmtDate } from "@/lib/labels";
import { createAthlete } from "./actions";
import DeleteAthleteCardButton from "./DeleteAthleteCardButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "ათლეტები · ადმინი" };

const STATUS_TABS = [
  { key: "", label: "ყველა" },
  { key: "PENDING", label: "განხილვაში" },
  { key: "REJECTED", label: "დაბრუნებული" },
  { key: "APPROVED", label: "დამტკიცებული" },
] as const;

const STATUS_BADGE: Record<string, { text: string; cls: string }> = {
  PENDING: { text: "განხილვაში", cls: "bg-amber-100 text-amber-800" },
  REJECTED: { text: "დაბრუნდა", cls: "bg-red-100 text-red-800" },
};

const ERRORS: Record<string, string> = {
  club: "აირჩიეთ კლუბი.",
  contact: "არასრულწლოვნისთვის საჭიროა მშობლის სახელი და ელფოსტა, სრულწლოვნისთვის — ათლეტის ელფოსტა.",
  exists: "ამ პირადი ნომრით ათლეტი უკვე რეგისტრირებულია",
  fields: "შეავსეთ ყველა სავალდებულო ველი.",
};

export default async function AdminAthletes({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; gid?: string; status?: string }>;
}) {
  const user = await requireUser();
  const scope = clubScope(user);
  const { error, gid: existingGid, status: statusParam } = await searchParams;
  const status = ["PENDING", "REJECTED", "APPROVED"].includes(statusParam ?? "") ? statusParam : "";
  const canCreateAny = can(user, "ATHLETE_MANAGE_ALL");
  const canCreateOwnClub = can(user, "ATHLETE_MANAGE_OWN_CLUB");
  const canCreate = canCreateAny || canCreateOwnClub;
  const ownClub = scope && canCreateOwnClub
    ? await db.club.findUnique({ where: { id: scope.clubId } })
    : null;

  const [athletes, clubs] = await Promise.all([
    db.athlete.findMany({
      where: {
        isActive: true,
        ...(status ? { status: status as "PENDING" | "REJECTED" | "APPROVED" } : {}),
        ...(scope
          ? { clubMemberships: { some: { clubId: scope.clubId, endDate: null } } }
          : {}),
      },
      include: {
        clubMemberships: { where: { endDate: null }, include: { club: true } },
      },
      orderBy: [{ status: "desc" }, { gid: "asc" }],
    }),
    db.club.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-neutral-500";

  return (
    <div>
      <h1 className="text-2xl font-semibold">ათლეტები</h1>
      {scope && (
        <p className="mt-1 text-sm text-neutral-500">
          თქვენ ხედავთ და არეგისტრირებთ მხოლოდ თქვენი კლუბის ათლეტებს. ახალი ათლეტი ჯერ ფედერაციის დამტკიცებას გადის.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {ERRORS[error] ?? ERRORS.fields}
          {error === "exists" && existingGid ? ` (${existingGid}). თუ სხვა კლუბშია, გამოიყენეთ ტრანსფერი.` : ""}
        </p>
      )}

      <nav className="mt-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/portal/athletes?status=${t.key}` : "/portal/athletes"}
            className={`rounded-full px-4 py-1.5 text-sm ${
              status === t.key ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-600 hover:border-neutral-900"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 content-start">
          {athletes.map((a) => (
            <Link key={a.id} href={`/portal/athletes/${a.id}`} className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 flex flex-col relative transition-transform hover:-translate-y-1">
              <div className="aspect-square bg-gray-100 flex items-center justify-center relative group">
                {a.photoUrl ? (
                  <img src={a.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : a.gender === "FEMALE" ? (
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
                    <path d="M 22 32 C 22 46, 42 46, 42 32" />
                    <path d="M 16 46 L 22 40 C 20 30, 28 22, 32 18 C 36 22, 44 30, 42 40 L 48 46 L 46 24 C 46 4, 18 4, 18 24 Z" />
                  </svg>
                ) : (
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M 10 60 Q 10 46, 24 46 Q 32 54, 40 46 Q 54 46, 54 60" />
                    <path d="M 20 26 C 20 44, 44 44, 44 26" />
                    <path d="M 20 26 C 24 18, 28 26, 32 22 C 36 18, 40 24, 44 26 C 44 6, 20 6, 20 26 Z" />
                  </svg>
                )}
                
                {can(user, "ATHLETE_DELETE") && (
                  <div className="absolute top-3 left-3">
                    <DeleteAthleteCardButton athleteId={a.id} />
                  </div>
                )}
                
                <span className="absolute top-3 right-3 bg-white/80 backdrop-blur rounded px-2 py-1 text-[10px] font-bold text-gray-700 uppercase tracking-wider shadow-sm">{a.gid}</span>
                {STATUS_BADGE[a.status] && (
                  <span className={`absolute bottom-3 left-3 rounded px-2 py-1 text-[11px] font-bold ${STATUS_BADGE[a.status].cls}`}>
                    {STATUS_BADGE[a.status].text}
                  </span>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="font-bold text-[16px] text-black mb-1">
                  {a.firstName} {a.lastName}
                </div>
                <div className="text-[13px] text-gray-500 mb-4">
                  Age group: {CATEGORY_LABELS[categoryFor(a.birthDate)]}
                </div>
                <div className="text-[13px] font-bold text-black mb-4 line-clamp-2 leading-snug">
                  {a.clubMemberships[0]?.club.name ?? "—"}
                </div>
              </div>
            </Link>
          ))}
          {athletes.length === 0 && (
            <div className="col-span-full py-12 text-center text-neutral-500">
              ათლეტები არ მოიძებნა.
            </div>
          )}
        </div>

        {canCreate && (
          <div className="space-y-6">
          <form
            action={createAthlete}
            className="h-fit rounded-lg border border-neutral-200 bg-white p-5"
          >
            <h2 className="font-semibold">ახალი ათლეტი</h2>
            <p className="mt-1 text-xs text-neutral-500">
              {canCreateAny
                ? "GID მიენიჭება ავტომატურად."
                : "განაცხადი გაეგზავნება ფედერაციას. დამტკიცების შემდეგ ათლეტი მიიღებს GID-ს და E-CARD-ს."}
            </p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={label} htmlFor="firstName">სახელი *</label>
                  <input id="firstName" name="firstName" required className={input} />
                </div>
                <div>
                  <label className={label} htmlFor="lastName">გვარი *</label>
                  <input id="lastName" name="lastName" required className={input} />
                </div>
                <div>
                  <label className={label} htmlFor="firstNameEn">სახელი (ENG)</label>
                  <input id="firstNameEn" name="firstNameEn" className={input} />
                </div>
                <div>
                  <label className={label} htmlFor="lastNameEn">გვარი (ENG)</label>
                  <input id="lastNameEn" name="lastNameEn" className={input} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={label} htmlFor="birthDate">დაბადების თარიღი *</label>
                  <input id="birthDate" name="birthDate" type="date" required className={input} />
                </div>
                <div>
                  <label className={label} htmlFor="gender">სქესი *</label>
                  <select id="gender" name="gender" required className={input}>
                    <option value="MALE">მამრობითი</option>
                    <option value="FEMALE">მდედრობითი</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={label} htmlFor="personalNumber">პირადი ნომერი *</label>
                <input id="personalNumber" name="personalNumber" required className={input} />
              </div>
              <div>
                <label className={label} htmlFor="photo">ფოტო</label>
                <PhotoInput id="photo" />
              </div>
              <fieldset className="space-y-2 rounded border border-neutral-200 p-3">
                <legend className="px-1 text-xs text-neutral-500">ათლეტის კონტაქტი (18+ — სავალდებულო)</legend>
                <input name="email" type="email" placeholder="ელფოსტა" className={input} />
                <input name="phone" placeholder="ტელეფონი" className={input} />
              </fieldset>
              <fieldset className="space-y-2 rounded border border-neutral-200 p-3">
                <legend className="px-1 text-xs text-neutral-500">მშობელი (18-მდე — სავალდებულო)</legend>
                <input name="parentName" placeholder="სახელი, გვარი" className={input} />
                <input name="parentEmail" type="email" placeholder="ელფოსტა" className={input} />
                <input name="parentPhone" placeholder="ტელეფონი" className={input} />
              </fieldset>
              {canCreateAny ? (
                <div>
                  <label className={label} htmlFor="clubId">კლუბი *</label>
                  <select id="clubId" name="clubId" required className={input}>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className={label}>კლუბი</label>
                  <div className={`${input} bg-neutral-50 text-neutral-600`}>{ownClub?.name ?? "—"}</div>
                </div>
              )}
              <p className="text-xs text-neutral-500">
                შემდეგ ნაბიჯზე ატვირთავთ დაბადების მოწმობას ან პირადობას.
              </p>
              <button className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700">
                {canCreateAny ? "რეგისტრაცია" : "განაცხადის გაგზავნა"}
              </button>
            </div>
          </form>
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-neutral-400">
        სულ: <span className="tabular-nums">{athletes.length}</span> ·{" "}
        {fmtDate(new Date())}
      </p>
    </div>
  );
}
