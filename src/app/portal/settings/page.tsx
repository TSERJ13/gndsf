import PhotoInput from "@/components/PhotoInput";
import { requireStaff } from "@/lib/rbac";
import { changeOwnPassword, sendTestMail, updateOwnClub, checkStorage } from "./actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "პარამეტრები · ადმინი" };

export default async function AdminSettings({
  searchParams,
}: {
  searchParams: Promise<{ pok?: string; perror?: string; mail?: string; club?: string; photos?: string; docs?: string }>;
}) {
  const user = await requireStaff();
  const { pok, perror, mail, club: clubMsg, photos, docs } = await searchParams;
  const club = user.role === "CLUB_MANAGER" && user.clubId ? await db.club.findUnique({ where: { id: user.clubId } }) : null;
  const canTestMail = user.role === "SUPER_ADMIN" || user.role === "PRESIDENT";

  const input =
    "mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";
  const label = "text-xs uppercase tracking-wider text-neutral-500";

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold">პარამეტრები</h1>
      <p className="mt-1 text-sm text-neutral-500">{user.email}</p>

      {pok && (
        <p className="mt-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          პაროლი შეიცვალა.
        </p>
      )}
      {perror && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {perror === "wrong" ? "მიმდინარე პაროლი არასწორია." : "ახალი პაროლი მინიმუმ 8 სიმბოლო."}
        </p>
      )}

      <form action={changeOwnPassword} className="mt-6 space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold">პაროლის შეცვლა</h2>
        <div>
          <label className={label} htmlFor="current">მიმდინარე პაროლი</label>
          <input id="current" name="current" type="password" required autoComplete="current-password" className={input} />
        </div>
        <div>
          <label className={label} htmlFor="next">ახალი პაროლი</label>
          <input id="next" name="next" type="password" minLength={8} required autoComplete="new-password" className={input} />
        </div>
        <button className="rounded bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700">
          შეცვლა
        </button>
      </form>

      {club && (
        <form action={updateOwnClub} className="mt-6 space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">კლუბის მონაცემები — {club.name}</h2>
          {clubMsg === "ok" && <p className="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">შენახულია.</p>}
          {clubMsg === "logo" && <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">ლოგო ვერ აიტვირთა: საჭიროა JPG/PNG/WebP/HEIC სურათი (მაქს. 15 MB).</p>}
          {clubMsg === "fields" && <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">ქალაქი სავალდებულოა.</p>}
          <div><label className={label} htmlFor="c-nameEn">დასახელება (ENG)</label><input id="c-nameEn" name="nameEn" defaultValue={club.nameEn ?? ""} className={input} /></div>
          <div><label className={label} htmlFor="c-city">ქალაქი</label><input id="c-city" name="city" required defaultValue={club.city} className={input} /></div>
          <div><label className={label} htmlFor="c-address">მისამართი</label><input id="c-address" name="address" defaultValue={club.address ?? ""} className={input} /></div>
          <div><label className={label} htmlFor="c-phone">ტელეფონი</label><input id="c-phone" name="phone" defaultValue={club.phone ?? ""} className={input} /></div>
          <div><label className={label} htmlFor="c-email">ელფოსტა</label><input id="c-email" name="email" type="email" defaultValue={club.email ?? ""} className={input} /></div>
          <div><label className={label} htmlFor="c-logo">ლოგო</label><PhotoInput id="c-logo" name="logo" logo /></div>
          <button className="rounded bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700">შენახვა</button>
        </form>
      )}

      {canTestMail && (
        <form action={checkStorage} className="mt-6 space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">ფაილების ატვირთვის შემოწმება</h2>
          <p className="text-sm text-neutral-500">ატვირთავს და წაშლის სატესტო ფაილს ორივე საცავში.</p>
          {photos && (
            <ul className="space-y-1 text-sm">
              {[["ფოტოები და ლოგოები", photos], ["პირადობის დოკუმენტები", docs ?? "missing"]].map(([k, v]) => (
                <li key={k} className={v === "ok" ? "text-green-700" : "text-red-700"}>
                  {v === "ok" ? "✓" : "✗"} {k}: {v === "ok" ? "მუშაობს" : v === "missing" ? "გასაღები არ არის დაყენებული (Vercel)" : "შეცდომა — დეტალები Vercel-ის logs-შია"}
                </li>
              ))}
            </ul>
          )}
          <button className="rounded bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700">შემოწმება</button>
        </form>
      )}

      {canTestMail && (
        <form action={sendTestMail} className="mt-6 space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">ფოსტის შემოწმება</h2>
          <p className="text-sm text-neutral-500">სატესტო წერილი გაიგზავნება no-reply@gndsf.ge-დან.</p>
          {mail === "ok" && (
            <p className="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">წერილი გაიგზავნა. შეამოწმეთ ფოსტა (Spam-იც).</p>
          )}
          {mail === "fail" && (
            <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">გაგზავნა ვერ მოხერხდა. დეტალები Vercel-ის logs-შია.</p>
          )}
          {mail === "bad" && (
            <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">ელფოსტის მისამართი არასწორია.</p>
          )}
          <div>
            <label className={label} htmlFor="to">ვის გავუგზავნოთ</label>
            <input id="to" name="to" type="email" required defaultValue={user.email ?? ""} className={input} />
          </div>
          <button className="rounded bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700">
            სატესტო წერილის გაგზავნა
          </button>
        </form>
      )}
    </div>
  );
}
