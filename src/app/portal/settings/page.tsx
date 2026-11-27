import { requireStaff } from "@/lib/rbac";
import { changeOwnPassword, sendTestMail } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "პარამეტრები · ადმინი" };

export default async function AdminSettings({
  searchParams,
}: {
  searchParams: Promise<{ pok?: string; perror?: string; mail?: string }>;
}) {
  const user = await requireStaff();
  const { pok, perror, mail } = await searchParams;
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
